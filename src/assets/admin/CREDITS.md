# Admin imagery — credits & provenance

This folder holds admin-area photography for the production build.

## Current state (prototype)

The admin login slideshow and dashboard welcome banner currently load
seeded placeholder photos from **picsum.photos** (CC0, Public Domain) via
remote URLs defined in [../data/adminImagery.js](../../data/adminImagery.js).
No files are stored in this folder yet.

## Replacing with real portfolio photos

When Perry Studios' actual portfolio is ready, replace the picsum URLs
with locally-hosted assets:

1. Export 5 portfolio hero images at **1920×1080**, JPEG quality ~75.
2. Convert to **WebP** (quality ~75) — use `cwebp`, Squoosh, or
   Sharp:
   ```
   cwebp -q 75 input.jpg -o output.webp
   ```
3. Save as `login-01.webp` through `login-05.webp` in this folder.
4. Export one dashboard banner image at **1920×600** → `dashboard.webp`.
5. Update `src/data/adminImagery.js` to import the local files instead
   of using the `pic()` helper, e.g.:
   ```js
   import login01 from '../assets/admin/login-01.webp'
   export const LOGIN_SLIDESHOW = [{ src: login01, alt: '…', category: '…' }, …]
   ```

## Licensing notes

- picsum.photos → CC0 (no attribution required).
- When replacing with real work, confirm each photo has the right
  license. For Unsplash/Pexels images, their standard licenses are
  permissive but recommended attribution is good practice; append the
  source URL beside each entry here.
