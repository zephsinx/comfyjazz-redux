# ComfyJazz Deployment Guide

## Quick Start

1. **Build the project**:

   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder** to your web server

3. **Access the applications**:
   - Main ComfyJazz: `https://yoursite.com/`
   - OBS Dock: `https://yoursite.com/obs-dock.html`

## File Structure After Build

```
dist/
├── index.html              # Main ComfyJazz application
├── obs-dock.html          # OBS Browser Dock interface
├── assets/
│   ├── main-*.js          # Main application JavaScript
│   ├── obs-dock-*.js      # OBS dock JavaScript
│   ├── main-*.css         # Main application styles
│   ├── obs-dock-*.css     # OBS dock styles
│   └── note-worker-*.js   # Web worker for note generation
└── web/sounds/            # Audio files
    ├── piano/
    ├── sax/
    ├── guitar/
    └── ...
```

## OBS Studio Setup

1. **Add a Custom Browser Dock**
   - Go to `View` → `Docks` → `Custom Browser Docks...`
   - Dock Name: `ComfyJazz`
   - URL: your deployed `https://yoursite.com/obs-dock.html`
   - Click `Apply` (use `View` → `Docks` to show it if not visible)
2. _(Optional)_ **Add as a Browser Source** in a scene if you want on‑scene controls
   - URL: same `https://yoursite.com/obs-dock.html`
   - Recommended size: 400x600px (adjustable)
   - Enable "Shutdown source when not visible" for performance

## Development vs Production

### Development

- Run `npm run dev` for local development
- Access at `http://localhost:8901`
- OBS dock at `http://localhost:8901/obs-dock.html`
- Quick preview of the dock UI: `npm run preview:obs` (opens `/obs-dock.html`)

### Production

- Run `npm run build` to create production build
- Deploy `dist/` folder to web server
- Access via your domain

## Features

- **Bidirectional Sync**: Changes in either interface update both
- **Real-time Updates**: No refresh needed
- **Persistent Settings**: Settings saved across sessions
- **Responsive Design**: Adapts to different dock sizes
- **Cross-tab Communication**: Works across browser tabs
- **Collapsible Auto Notes**: Auto Notes section is collapsed by default; toggle via the chevron
- **Reset Confirmation**: Reset button asks for confirmation and preserves StreamerBot enable state

## Troubleshooting

**OBS dock not syncing**:

- Ensure both main app and dock are loaded
- Check browser console for errors
- Verify localStorage is enabled

**Build issues**:

- Clear `dist/` folder and rebuild
- Check for TypeScript errors
- Ensure all dependencies are installed
