Life Setup Icon Pack
===================

Drop this folder into your project at:
  /assets/icons/

Files:
- favicon.ico                -> Browser tab favicon (also works as a basic site icon)
- favicon-16x16.png, favicon-32x32.png ... -> Optional explicit favicons
- apple-touch-icon-180x180.png -> iOS home screen icon
- icon-192x192.png, icon-512x512.png -> PWA icons
- icon-192x192-maskable.png, icon-512x512-maskable.png -> PWA maskable icons
- app-icon.ico               -> Program icon (Windows .ico), good for Electron/Python shortcuts
- manifest.webmanifest       -> PWA manifest
- head-snippet.html          -> Copy into <head> of index.html

If you’re using Electron:
  - Windows: set BrowserWindow icon to app-icon.ico (or .png on mac/linux)
  - Also set your builder icon to app-icon.png or app-icon.ico depending on tooling.
