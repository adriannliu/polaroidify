import type { Timeframe, TrackScore } from './types';
import { AuthManager } from './auth';

export class SpotifyAPI {
    private authManager: AuthManager;

    constructor(authManager: AuthManager) {
        this.authManager = authManager;
    }

    async getTopTracks(limit: number, timeframe: Timeframe): Promise<any[]> {
        const response = await this.authManager.makeAuthenticatedRequest(
            `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${timeframe}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.items;
    }

    async getRecentlyPlayed(limit: number): Promise<any[]> {
        const response = await this.authManager.makeAuthenticatedRequest(
            `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.items.map((item: any) => item.track);
    }

    async getSavedTracks(limit: number): Promise<any[]> {
        const response = await this.authManager.makeAuthenticatedRequest(
            `https://api.spotify.com/v1/me/tracks?limit=${limit}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.items;
    }

    async getCustomTopTracks(limit: number, timeframe: Timeframe): Promise<any[]> {
        console.log(`Fetching data for ${timeframe} time period...`);
        
        let primaryTracks: any[] = [];
        let spotifyTopTracks: any[] = [];
        
        if (timeframe === 'recent') {
            primaryTracks = await this.getRecentlyPlayed(limit);
            console.log('Recently played tracks:', primaryTracks.length);
        } else {
            primaryTracks = await this.getTopTracks(limit, timeframe);
            console.log(`Spotify ${timeframe} tracks:`, primaryTracks.length);
        }
        
        if (primaryTracks.length === 0) {
            if (timeframe === 'short_term') {
                console.log('Recently played tracks unavailable, falling back to Spotify algorithm...');
                return await this.getTopTracks(limit, timeframe);
            } else {
                throw new Error(`Failed to fetch ${timeframe} tracks`);
            }
        }
        
        if (timeframe !== 'recent') {
            spotifyTopTracks = await this.getTopTracks(limit, timeframe);
            console.log('Spotify top tracks:', spotifyTopTracks.length);
        }
        
        const savedTracks = await this.getSavedTracks(limit);
        console.log('Saved tracks:', savedTracks.length);
        
        const trackAnalysis = this.analyzeListeningPatterns(
            primaryTracks, 
            savedTracks,
            spotifyTopTracks,
            timeframe
        );
        
        trackAnalysis.sort((a, b) => b.score - a.score);
        return trackAnalysis.slice(0, limit).map(item => item.track);
    }

    private analyzeListeningPatterns(
        recentlyPlayed: any[], 
        savedTracks: any[], 
        spotifyTopTracks: any[],
        timeframe: Timeframe
    ): TrackScore[] {
        const trackMap = new Map<string, TrackScore>();
        
        recentlyPlayed.forEach((item) => {
            let track, trackId, playedAt;
            
            if (item.track && item.played_at) {
                track = item.track;
                trackId = item.track.id;
                playedAt = new Date(item.played_at);
            } else if (item.track && !item.played_at) {
                track = item.track;
                trackId = item.track.id;
                playedAt = new Date();
            } else if (item.id) {
                track = item;
                trackId = item.id;
                playedAt = new Date();
            } else {
                console.warn('Unknown track structure:', item);
                return;
            }
            
            if (!trackMap.has(trackId)) {
                trackMap.set(trackId, {
                    track: track,
                    score: 0,
                    factors: {
                        playCount: 0,
                        recency: 0,
                        userRating: 0,
                        skipRate: 0,
                        timeOfDay: 0,
                        audioFeatures: 0,
                        playlistPresence: 0
                    }
                });
            }
            
            const trackScore = trackMap.get(trackId)!;
            
            if (item.track && !item.played_at) {
                trackScore.factors.playCount += 2;
            } else {
                trackScore.factors.playCount++;
            }
            
            const now = new Date();
            const hoursSincePlayed = (now.getTime() - playedAt.getTime()) / (1000 * 60 * 60);
            trackScore.factors.recency += Math.max(0, 24 - hoursSincePlayed) / 24;
            
            const hour = playedAt.getHours();
            if (hour >= 6 && hour <= 12) {
                trackScore.factors.timeOfDay += 1.2;
            } else if (hour >= 18 && hour <= 23) {
                trackScore.factors.timeOfDay += 1.1;
            } else {
                trackScore.factors.timeOfDay += 0.8;
            }
        });
        
        savedTracks.forEach(item => {
            const trackId = item.track.id;
            if (trackMap.has(trackId)) {
                trackMap.get(trackId)!.factors.userRating += 2;
            }
        });
        
        spotifyTopTracks.forEach((track, index) => {
            const trackId = track.id;
            if (!trackMap.has(trackId)) {
                trackMap.set(trackId, {
                    track: track,
                    score: 0,
                    factors: {
                        playCount: 0,
                        recency: 0,
                        userRating: 0,
                        skipRate: 0,
                        timeOfDay: 0,
                        audioFeatures: 0,
                        playlistPresence: 0
                    }
                });
            }
            
            const trackScore = trackMap.get(trackId)!;
            const spotifyRankBonus = Math.max(1, 10 - index) / 10 * 0.1;
            trackScore.factors.playCount += spotifyRankBonus;
        });
        
        trackMap.forEach(trackScore => {
            const { playCount, recency, userRating, timeOfDay } = trackScore.factors;
            
            let timeframeMultiplier = 1;
            if (timeframe === 'short_term') {
                timeframeMultiplier = 1.5;
            } else if (timeframe === 'medium_term') {
                timeframeMultiplier = 1.0;
            } else if (timeframe === 'long_term') {
                timeframeMultiplier = 0.5;
            } else if (timeframe === 'recent') {
                timeframeMultiplier = 2;
            }
            
            trackScore.score = (
                playCount * 10 * timeframeMultiplier +
                recency * 3 * timeframeMultiplier +
                userRating * 8 +
                timeOfDay * 1
            );
        });
        
        return Array.from(trackMap.values());
    }
} 