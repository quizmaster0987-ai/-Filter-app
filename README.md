# Filter Studio

A mobile-friendly browser camera app with live visual filters and decorative overlays.

## Run locally
Open `index.html` from a local HTTPS server. Camera access requires HTTPS (or localhost) and browser permission.

## Deploy
The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys the site to GitHub Pages whenever a commit is pushed to `main`.

After the first workflow run, check **Settings → Pages** and confirm **Build and deployment → Source: GitHub Actions**.

## Features
- Front and rear camera switching
- Live color filters
- Decorative emoji overlays
- Capture and save a filtered photo

This version does not include face tracking or Snapchat's proprietary lenses.
