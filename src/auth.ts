import { config } from './config';
import { showLoginSection, showTracksSection, showLoading, showError } from './dom';

export class AuthManager {
    private accessToken: string | null = null;

    constructor() {
        this.accessToken = localStorage.getItem('spotify_access_token');
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    setAccessToken(token: string): void {
        this.accessToken = token;
        localStorage.setItem('spotify_access_token', token);
    }

    clearAccessToken(): void {
        this.accessToken = null;
        localStorage.removeItem('spotify_access_token');
        sessionStorage.clear();
    }

    isAuthenticated(): boolean {
        return this.accessToken !== null;
    }

    handleLogin(): void {
        console.log('Redirect URI being used:', config.redirectUri);
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${config.clientId}&response_type=code&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scope)}`;
        console.log('Full auth URL:', authUrl);
        window.location.href = authUrl;
    }

    handleLogout(): void {
        this.clearAccessToken();
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.reload();
    }

    forceReAuth(): void {
        console.log('Forcing re-authentication due to insufficient permissions...');
        this.clearAccessToken();
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${config.clientId}&response_type=code&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scope)}&show_dialog=true`;
        window.location.href = authUrl;
    }

    async handleAuthCallback(code: string): Promise<void> {
        try {
            showLoading();
            
            const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(config.clientId + ':' + config.clientSecret)
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: config.redirectUri
                })
            });
            
            const tokenData = await tokenResponse.json();
            
            if (tokenData.access_token) {
                this.setAccessToken(tokenData.access_token);
                window.history.replaceState({}, document.title, window.location.pathname);
                showTracksSection();
                return;
            } else {
                throw new Error('Failed to get access token');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            showError('Failed to authenticate with Spotify. Please try again.');
            showLoginSection();
        }
    }

    async makeAuthenticatedRequest(url: string): Promise<Response> {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (response.status === 401) {
            this.clearAccessToken();
            showLoginSection();
            throw new Error('Authentication expired');
        }

        return response;
    }
} 