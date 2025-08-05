export const dom = {
    loginSection: document.getElementById('login-section') as HTMLElement,
    tracksSection: document.getElementById('tracks-section') as HTMLElement,
    loginBtn: document.getElementById('login-btn') as HTMLButtonElement,
    logoutBtn: document.getElementById('logout-btn') as HTMLButtonElement,
    tracksContainer: document.getElementById('tracks-container') as HTMLElement,
    loadingElement: document.getElementById('loading') as HTMLElement,
    timeframeButtons: document.querySelectorAll('[data-timeframe]') as NodeListOf<HTMLButtonElement>,
    polaroidBtn: document.getElementById('polaroid-btn') as HTMLButtonElement,
    polaroidPreview: document.getElementById('polaroid-preview') as HTMLElement,
    polaroidCanvas: document.getElementById('polaroid-canvas') as HTMLCanvasElement,
    downloadPolaroidBtn: document.getElementById('download-polaroid-btn') as HTMLButtonElement,
    closePolaroidBtn: document.getElementById('close-polaroid-btn') as HTMLButtonElement,
    uploadPhotoBtn: document.getElementById('upload-photo-btn') as HTMLButtonElement,
    photoUpload: document.getElementById('photo-upload') as HTMLInputElement
};

export const showLoginSection = (): void => {
    dom.loginSection.classList.remove('hidden');
    dom.tracksSection.classList.add('hidden');
    hideLoading();
};

export const showTracksSection = (): void => {
    dom.loginSection.classList.add('hidden');
    dom.tracksSection.classList.remove('hidden');
};

export const showLoading = (): void => {
    dom.loadingElement.classList.remove('hidden');
    dom.tracksContainer.innerHTML = '';
};

export const hideLoading = (): void => {
    dom.loadingElement.classList.add('hidden');
};

export const showError = (message: string): void => {
    dom.tracksContainer.innerHTML = `<div class="error">${message}</div>`;
    hideLoading();
}; 