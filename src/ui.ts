import { dom, hideLoading } from './dom';
import type { Timeframe, Algorithm, TrackCount, CustomWeights } from './types';

export class UIManager {
    private currentTimeframe: Timeframe = 'short_term';
    private currentAlgorithm: Algorithm = 'spotify';
    private currentTrackCount: TrackCount = 10;
    private userUploadedImage: HTMLImageElement | null = null;
    private customWeights: CustomWeights = {
        playCount: 10,
        recency: 3,
        userRating: 8,
        timeOfDay: 1,
        timeframeMultiplier: 1
    };

    constructor() {
        console.log('UIManager constructor called');
        this.setupEventListeners();
        this.updateButtonText();
        this.updateUploadButtonState();
        this.setupWeightSliders();
        console.log('UIManager constructor completed');
    }

    getCurrentTimeframe(): Timeframe {
        return this.currentTimeframe;
    }

    getCurrentAlgorithm(): Algorithm {
        return this.currentAlgorithm;
    }

    getCurrentTrackCount(): TrackCount {
        return this.currentTrackCount;
    }

    getCustomWeights(): CustomWeights {
        return { ...this.customWeights };
    }

    getUserUploadedImage(): HTMLImageElement | null {
        return this.userUploadedImage;
    }

    setUserUploadedImage(image: HTMLImageElement | null): void {
        this.userUploadedImage = image;
        this.updateUploadButtonState();
    }

    private setupEventListeners(): void {
        dom.timeframeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const timeframe = target.dataset.timeframe as Timeframe;
                if (timeframe) {
                    this.setActiveTimeframe(timeframe);
                    this.triggerReload();
                }
            });
        });

        const algorithmButtons = document.querySelectorAll('[data-algorithm]') as NodeListOf<HTMLButtonElement>;
        algorithmButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const algorithm = target.dataset.algorithm as Algorithm;
                if (algorithm) {
                    this.setActiveAlgorithm(algorithm);
                    this.triggerReload();
                }
            });
        });

        const trackCountButtons = document.querySelectorAll('[data-track-count]') as NodeListOf<HTMLButtonElement>;
        trackCountButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const trackCount = target.dataset.trackCount;
                if (trackCount) {
                    this.setActiveTrackCount(parseInt(trackCount) as TrackCount);
                    this.triggerReload();
                }
            });
        });
    }

    private setupWeightSliders(): void {
        console.log('Setting up weight sliders...');
        
        // Check if sliders exist in DOM
        const slidersElement = document.getElementById('weight-sliders');
        console.log('Weight sliders element found:', !!slidersElement);
        if (slidersElement) {
            console.log('Weight sliders HTML:', slidersElement.innerHTML.substring(0, 100) + '...');
        }
        
        // Setup slider event listeners
        this.setupSliderEventListeners();
        console.log('Weight sliders setup complete');
    }

    private setupSliderEventListeners(): void {
        const sliders = document.querySelectorAll('.weight-slider') as NodeListOf<HTMLInputElement>;
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const value = parseFloat(target.value);
                const weightType = target.id.replace('-weight', '') as keyof CustomWeights;
                
                // Update the display value
                const valueSpan = document.getElementById(`${weightType}-value`);
                if (valueSpan) {
                    valueSpan.textContent = value.toString();
                }
                
                // Update the weights object
                this.customWeights[weightType] = value;
                
                // Trigger reload if custom algorithm is active
                if (this.currentAlgorithm === 'custom') {
                    this.triggerReload();
                }
            });
        });
    }

    private triggerReload(): void {
        const event = new CustomEvent('tracksReloadRequested');
        document.dispatchEvent(event);
    }

    private setActiveTimeframe(timeframe: Timeframe): void {
        this.currentTimeframe = timeframe;
        
        dom.timeframeButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.timeframe === timeframe) {
                button.classList.add('active');
            }
        });
    }

    private setActiveAlgorithm(algorithm: Algorithm): void {
        this.currentAlgorithm = algorithm;
        
        const algorithmButtons = document.querySelectorAll('[data-algorithm]') as NodeListOf<HTMLButtonElement>;
        algorithmButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.algorithm === algorithm) {
                button.classList.add('active');
            }
        });

        // Show/hide weight sliders based on algorithm selection
        this.toggleWeightSliders(algorithm === 'custom');
    }

    private toggleWeightSliders(show: boolean): void {
        console.log('Toggling weight sliders:', show);
        const weightSliders = document.getElementById('weight-sliders');
        console.log('Weight sliders element found:', !!weightSliders);
        
        if (weightSliders) {
            if (show) {
                weightSliders.classList.remove('hidden');
                console.log('Weight sliders shown');
            } else {
                weightSliders.classList.add('hidden');
                console.log('Weight sliders hidden');
            }
        } else {
            console.error('Weight sliders element not found');
        }
    }

    private setActiveTrackCount(trackCount: TrackCount): void {
        this.currentTrackCount = trackCount;
        
        const trackCountButtons = document.querySelectorAll('[data-track-count]') as NodeListOf<HTMLButtonElement>;
        trackCountButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.trackCount === trackCount.toString()) {
                button.classList.add('active');
            }
        });
        
        this.updateButtonText();
    }

    displayTracks(tracks: any[]): void {
        dom.tracksContainer.innerHTML = '';
        
        if (tracks.length === 0) {
            dom.tracksContainer.innerHTML = '<p class="error">No tracks found for this time period.</p>';
            hideLoading();
            return;
        }
        
        tracks.forEach((track, index) => {
            const trackCard = this.createTrackCard(track, index + 1);
            dom.tracksContainer.appendChild(trackCard);
        });
        
        hideLoading();
    }

    private createTrackCard(track: any, rank: number): HTMLElement {
        const card = document.createElement('div');
        card.className = 'track-card';
        
        const artwork = track.album.images[0]?.url || 'https://via.placeholder.com/60x60?text=🎵';
        
        card.innerHTML = `
            <div class="track-info">
                <div class="track-rank">${rank}</div>
                <img src="${artwork}" alt="${track.name}" class="track-artwork">
                <div class="track-details">
                    <div class="track-name">${track.name}</div>
                    <div class="track-artist">${track.artists.map((artist: any) => artist.name).join(', ')}</div>
                </div>
            </div>
        `;
        
        return card;
    }

    private updateButtonText(): void {
        const recentButton = document.querySelector('[data-timeframe="recent"]') as HTMLButtonElement;
        if (recentButton) {
            recentButton.textContent = `${this.currentTrackCount} Recent`;
        }
        
        if (dom.polaroidBtn) {
            dom.polaroidBtn.textContent = `📸 Polaroid-ize My Top 10`;
        }
    }

    private updateUploadButtonState(): void {
        if (this.userUploadedImage) {
            dom.uploadPhotoBtn.classList.add('btn-uploaded');
            dom.uploadPhotoBtn.textContent = '🖼️ Photo Uploaded ✓';
        } else {
            dom.uploadPhotoBtn.classList.remove('btn-uploaded');
            dom.uploadPhotoBtn.textContent = '🖼️ Upload Photo';
        }
    }

    handlePhotoUpload(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.setUserUploadedImage(img);
                alert('Photo uploaded successfully! Now create your polaroid to see it with your tracks.');
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    getTimeframeDisplayText(timeframe: Timeframe): string {
        switch (timeframe) {
            case 'short_term':
                return 'Last 4 Weeks';
            case 'medium_term':
                return 'Last 6 Months';
            case 'long_term':
                return 'All Time';
            case 'recent':
                return '10 Recent';
            default:
                return 'Unknown Period';
        }
    }
} 