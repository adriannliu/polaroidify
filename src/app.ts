import { validateConfig } from './config';
import { AuthManager } from './auth';
import { SpotifyAPI } from './spotify-api';
import { UIManager } from './ui';
import { PolaroidManager } from './polaroid';
import { dom, showLoginSection, showTracksSection, showLoading, showError } from './dom';

export class App {
    private authManager: AuthManager;
    private spotifyAPI: SpotifyAPI;
    private uiManager: UIManager;
    private polaroidManager: PolaroidManager;

    constructor() {
        validateConfig();
        
        this.authManager = new AuthManager();
        this.spotifyAPI = new SpotifyAPI(this.authManager);
        this.uiManager = new UIManager();
        this.polaroidManager = new PolaroidManager(this.uiManager);
        
        this.setupEventListeners();
        this.initialize();
    }

    private setupEventListeners(): void {
        dom.loginBtn.addEventListener('click', () => this.authManager.handleLogin());
        dom.logoutBtn.addEventListener('click', () => this.authManager.handleLogout());
        dom.polaroidBtn.addEventListener('click', () => this.polaroidManager.createPolaroid());
        dom.downloadPolaroidBtn.addEventListener('click', () => this.polaroidManager.downloadPolaroid());
        dom.closePolaroidBtn.addEventListener('click', () => this.polaroidManager.closePolaroidPreview());
        dom.uploadPhotoBtn.addEventListener('click', () => dom.photoUpload.click());
        dom.photoUpload.addEventListener('change', (e) => this.uiManager.handlePhotoUpload(e));
        
        document.addEventListener('tracksReloadRequested', () => this.loadTopTracks());
    }

    private initialize(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            this.authManager.handleAuthCallback(code).then(() => {
                this.loadTopTracks();
            });
        } else if (this.authManager.isAuthenticated()) {
            showTracksSection();
            this.loadTopTracks();
        } else {
            showLoginSection();
        }
    }

    public async loadTopTracks(): Promise<void> {
        if (!this.authManager.getAccessToken()) return;
        
        try {
            showLoading();
            
            const timeframe = this.uiManager.getCurrentTimeframe();
            const algorithm = this.uiManager.getCurrentAlgorithm();
            const trackCount = this.uiManager.getCurrentTrackCount();
            
            let tracks: any[];
            
            switch (algorithm) {
                case 'spotify':
                    if (timeframe === 'recent') {
                        tracks = await this.spotifyAPI.getRecentlyPlayed(trackCount);
                    } else {
                        tracks = await this.spotifyAPI.getTopTracks(trackCount, timeframe);
                    }
                    break;
                    
                case 'custom':
                    try {
                        tracks = await this.spotifyAPI.getCustomTopTracks(trackCount, timeframe);
                    } catch (error) {
                        console.error('Custom algorithm failed, falling back to Spotify algorithm:', error);
                        tracks = await this.spotifyAPI.getTopTracks(trackCount, timeframe);
                    }
                    break;
                    
                default:
                    throw new Error('Unknown algorithm');
            }
            
            this.uiManager.displayTracks(tracks);
            
        } catch (error) {
            console.error('Error loading tracks:', error);
            showError('Failed to load your top tracks. Please try again.');
        }
    }

    public reloadTracks(): void {
        this.loadTopTracks();
    }
} 