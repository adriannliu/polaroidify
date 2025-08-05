export interface TrackScore {
    track: any;
    score: number;
    factors: {
        playCount: number;
        recency: number;
        userRating: number;
        skipRate: number;
        timeOfDay: number;
        audioFeatures: number;
        playlistPresence: number;
    };
}

export interface CustomWeights {
    playCount: number;
    recency: number;
    userRating: number;
    timeOfDay: number;
    timeframeMultiplier: number;
}

export interface SpotifyConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string;
}

export type Timeframe = 'short_term' | 'medium_term' | 'long_term' | 'recent';
export type Algorithm = 'spotify' | 'custom';
export type TrackCount = 10 | 20 | 30 | 50; 