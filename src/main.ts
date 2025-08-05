import { App } from './app';

console.log('Main.ts loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing App');
    new App();
    console.log('App initialized');
});
