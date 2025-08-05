import type { Timeframe, TrackScore, CustomWeights } from './types';
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

    async getCustomTopTracks(limit: number, timeframe: Timeframe, customWeights?: CustomWeights): Promise<any[]> {
        console.log(`Fetching data for ${timeframe} time period...`);
        console.log('Custom weights received:', customWeights);
        
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
            timeframe,
            customWeights
        );
        
        trackAnalysis.sort((a, b) => b.score - a.score);
        
        console.log('Top 5 tracks after custom scoring:');
        trackAnalysis.slice(0, 5).forEach((item, index) => {
            console.log(`${index + 1}. ${item.track.name} - Score: ${item.score.toFixed(2)}`);
        });
        
        return trackAnalysis.slice(0, limit).map(item => item.track);
    }

    private analyzeListeningPatterns(
        recentlyPlayed: any[], 
        savedTracks: any[], 
        spotifyTopTracks: any[],
        timeframe: Timeframe,
        customWeights?: CustomWeights
    ): TrackScore[] {
        const trackMap = new Map<string, TrackScore>();
        
        // Use custom weights if provided, otherwise use defaults
        const weights = customWeights || {
            playCount: 10,
            recency: 3,
            userRating: 8,
            timeOfDay: 1,
            timeframeMultiplier: 1
        };
        
        console.log('Using weights for scoring:', weights);
        console.log('Data sources - Recently played:', recentlyPlayed.length, 'Saved tracks:', savedTracks.length, 'Spotify top:', spotifyTopTracks.length);
        
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
        
        console.log('Final track analysis - Total tracks:', trackMap.size);
        
        trackMap.forEach(trackScore => {
            const { playCount, recency, userRating, timeOfDay } = trackScore.factors;
            
            let timeframeMultiplier = weights.timeframeMultiplier;
            if (timeframe === 'short_term') {
                timeframeMultiplier *= 1.5;
            } else if (timeframe === 'medium_term') {
                timeframeMultiplier *= 1.0;
            } else if (timeframe === 'long_term') {
                timeframeMultiplier *= 0.5;
            } else if (timeframe === 'recent') {
                timeframeMultiplier *= 2;
            }
            
            const finalScore = (
                playCount * weights.playCount * timeframeMultiplier +
                recency * weights.recency * timeframeMultiplier +
                userRating * weights.userRating +
                timeOfDay * weights.timeOfDay
            );
            
            trackScore.score = finalScore;
            
            // Debug first few tracks
            if (trackMap.size <= 3) {
                console.log(`Track: ${trackScore.track.name} - Score: ${finalScore.toFixed(2)}`);
                console.log(`  Factors: playCount=${playCount}, recency=${recency.toFixed(2)}, userRating=${userRating}, timeOfDay=${timeOfDay.toFixed(2)}`);
                console.log(`  Weights: playCount=${weights.playCount}, recency=${weights.recency}, userRating=${weights.userRating}, timeOfDay=${weights.timeOfDay}`);
            }
        });
        
        return Array.from(trackMap.values());
    }
} 