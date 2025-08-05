# Polaroidify - Your Top Tracks

A web application that displays your top Spotify tracks with a custom polaroid generator.

## Architecture

### Core Modules

- **`types.ts`** - TypeScript interfaces and type definitions
- **`config.ts`** - Application configuration and validation
- **`dom.ts`** - DOM element references and UI state management
- **`auth.ts`** - Spotify authentication management
- **`spotify-api.ts`** - Spotify API integration and data fetching
- **`ui.ts`** - User interface management and event handling
- **`polaroid.ts`** - Polaroid image generation functionality
- **`app.ts`** - Main application orchestrator
- **`main.ts`** - Application entry point

### Key Features

- **Modular Design**: Each module has a single responsibility
- **Type Safety**: Full TypeScript support with proper type definitions
- **Event-Driven**: Uses custom events for communication between modules
- **Error Handling**: Comprehensive error handling throughout the application

### Module Responsibilities

- **AuthManager**: Handles Spotify OAuth flow and token management
- **SpotifyAPI**: Manages all Spotify API calls and data processing
- **UIManager**: Controls UI state and user interactions
- **PolaroidManager**: Generates polaroid images with track overlays
- **App**: Orchestrates all modules and manages application lifecycle

### Development

```bash
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in root directory with:
```
VITE_CLIENT_ID=your_spotify_client_id
VITE_CLIENT_SECRET=your_spotify_client_secret
```

## Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**
   - Go to your project settings
   - Add `VITE_CLIENT_ID` and `VITE_CLIENT_SECRET`

### Option 2: Netlify

1. **Connect your GitHub repository to Netlify**
2. **Set build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add environment variables in Netlify dashboard**

### Option 3: GitHub Pages

1. **Push your code to GitHub**
2. **Enable GitHub Pages in repository settings**
3. **Set environment variables as GitHub Secrets**

### Important: Update Spotify App Settings

After deploying, update your Spotify app settings:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Add your deployment URL to "Redirect URIs":
   - For Vercel: `https://your-app.vercel.app/`
   - For Netlify: `https://your-app.netlify.app/`
   - For GitHub Pages: `https://username.github.io/repo-name/` 