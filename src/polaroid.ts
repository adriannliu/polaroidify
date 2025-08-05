import { dom } from './dom';

export class PolaroidManager {
    private uiManager: any;

    constructor(uiManager: any) {
        this.uiManager = uiManager;
    }

    createPolaroid(): void {
        const tracks = dom.tracksContainer.querySelectorAll('.track-card');
        if (tracks.length === 0) {
            alert('No tracks to polaroid-ize! Please load your top tracks first.');
            return;
        }
        
        const ctx = dom.polaroidCanvas.getContext('2d');
        if (!ctx) {
            alert('Canvas not supported in this browser.');
            return;
        }
        
        const polaroidImg = new Image();
        polaroidImg.crossOrigin = 'anonymous';
        polaroidImg.onload = () => {
            this.renderPolaroid(ctx, polaroidImg, tracks);
        };
        
        polaroidImg.onerror = () => {
            alert('Failed to load polaroid template. Please try again.');
        };
        
        polaroidImg.src = 'assets/vecteezy_blank-frame-template_50232056.png';
    }

    private renderPolaroid(ctx: CanvasRenderingContext2D, polaroidImg: HTMLImageElement, tracks: NodeListOf<Element>): void {
        const userUploadedImage = this.uiManager.getUserUploadedImage();
        
        let targetWidth: number;
        let targetHeight: number;
        
        if (userUploadedImage) {
            targetWidth = userUploadedImage.width;
            targetHeight = userUploadedImage.height;
        } else {
            targetWidth = 900;
            targetHeight = 1600;
        }
        
        dom.polaroidCanvas.width = targetWidth;
        dom.polaroidCanvas.height = targetHeight;
        
        const cropX = polaroidImg.width * 0.02;
        const cropY = polaroidImg.height * 0.02;
        const cropWidth = polaroidImg.width * 0.96;
        const cropHeight = polaroidImg.height * 0.96;
        
        ctx.drawImage(polaroidImg, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
        
        if (userUploadedImage) {
            const blackAreaX = dom.polaroidCanvas.width * 0.1;
            const blackAreaY = dom.polaroidCanvas.height * 0.04;
            const blackAreaWidth = dom.polaroidCanvas.width * 0.8;
            const blackAreaHeight = dom.polaroidCanvas.height * 0.85;
            
            ctx.drawImage(userUploadedImage, blackAreaX, blackAreaY, blackAreaWidth, blackAreaHeight);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(blackAreaX, blackAreaY, blackAreaWidth, blackAreaHeight);
            
            const imageData = ctx.getImageData(blackAreaX, blackAreaY, blackAreaWidth, blackAreaHeight);
            const textColor = this.getContrastingColor(imageData);
            ctx.fillStyle = textColor;
        } else {
            ctx.fillStyle = '#000';
        }
        
        const trackList = Array.from(tracks).slice(0, 10).map((track, index) => {
            const trackName = track.querySelector('.track-name')?.textContent || '';
            const trackArtist = track.querySelector('.track-artist')?.textContent || '';
            return `${index + 1}. ${trackName} - ${trackArtist}`;
        });
        
        this.drawTextOverlay(ctx, trackList, userUploadedImage);
        
        dom.polaroidPreview.classList.remove('hidden');
        dom.tracksContainer.classList.add('hidden');
    }

    private drawTextOverlay(ctx: CanvasRenderingContext2D, trackList: string[], userUploadedImage: HTMLImageElement | null): void {
        const canvasWidth = dom.polaroidCanvas.width;
        const canvasHeight = dom.polaroidCanvas.height;
        
        let textBaseWidth: number;
        if (userUploadedImage) {
            const blackAreaWidth = canvasWidth;
            const blackAreaHeight = canvasHeight;
            textBaseWidth = Math.min(blackAreaWidth, blackAreaHeight);
        } else {
            textBaseWidth = Math.min(canvasWidth, canvasHeight) * 0.3;
        }
        
        const titleFontSize = Math.min(96, textBaseWidth / 8);
        const trackFontSize = Math.min(84, textBaseWidth / 10);
        const lineHeight = trackFontSize * 1.5;
        
        ctx.textAlign = 'center';
        
        const centerX = canvasWidth * 0.5;
        let startY: number;
        let availableHeight: number;
        
        if (userUploadedImage) {
            const blackAreaY = canvasHeight * 0.08;
            const blackAreaHeight = canvasHeight * 0.7;
            startY = blackAreaY + (blackAreaHeight * 0.1);
            availableHeight = blackAreaHeight;
        } else {
            startY = canvasHeight * 0.13;
            availableHeight = canvasHeight * 0.6;
        }
        
        const totalLineHeight = (titleFontSize * 1.5) + (trackList.length * lineHeight);
        const spacing = (availableHeight - totalLineHeight) / (trackList.length + 1);
        
        const timeframeText = this.uiManager.getTimeframeDisplayText(this.uiManager.getCurrentTimeframe());
        
        ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
        ctx.fillText(`My Top 10 Tracks - ${timeframeText}`, centerX, startY);
        
        ctx.font = `${trackFontSize}px Arial, sans-serif`;
        const maxTextWidth = canvasWidth * 0.75;
        let currentY = startY + (titleFontSize * 1.5) + spacing;
        
        trackList.forEach((track) => {
            const wrappedLines = this.wrapText(track, maxTextWidth, ctx);
            
            wrappedLines.forEach((line, lineIndex) => {
                const y = currentY + (lineIndex * lineHeight);
                ctx.fillText(line, centerX, y);
            });
            
            currentY += (wrappedLines.length * lineHeight) + spacing;
        });
    }

    private wrapText(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    private getContrastingColor(imageData: ImageData): string {
        let r = 0, g = 0, b = 0;
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        
        const pixelCount = data.length / 4;
        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);
        
        return '#FFFFFF';
    }

    downloadPolaroid(): void {
        const link = document.createElement('a');
        link.download = 'my-top-10-tracks-polaroid.png';
        link.href = dom.polaroidCanvas.toDataURL();
        link.click();
    }

    closePolaroidPreview(): void {
        dom.polaroidPreview.classList.add('hidden');
        dom.tracksContainer.classList.remove('hidden');
    }
} 