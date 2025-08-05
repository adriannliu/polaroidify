import type { SpotifyConfig } from './types';

export const config: SpotifyConfig = {
    clientId: import.meta.env.VITE_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_CLIENT_SECRET || '',
    redirectUri: import.meta.env.VITE_REDIRECT_URI || 'https://polaroidify-three.vercel.app/',
    scope: 'user-top-read user-read-recently-played user-library-read user-read-private user-read-email'
};

export const validateConfig = (): void => {
    if (!config.clientId) {
        throw new Error('Client ID not configured. Please set VITE_CLIENT_ID in your .env file.');
    }
    if (!config.clientSecret) {
        throw new Error('Client secret not configured. Please set VITE_CLIENT_SECRET in your .env file.');
    }
}; 