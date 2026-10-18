# Home page image credits

This file lists every photograph used on the public Home page and
where it came from. Keep it current — if you replace an image, update
the entry here in the same change.

## How images are sourced right now

All Home page imagery is served through the admin **Portfolio → Website
images** slots so you can replace it in the browser without touching
code:

| Slot name       | Used on         | Replace in                                          |
| --------------- | --------------- | --------------------------------------------------- |
| `home_hero`     | Hero background | Admin → Portfolio → Website images → "Home hero"    |
| `home_portrait` | About portrait  | Admin → Portfolio → Website images → "About portrait" |

When a slot is empty, the site falls back to a Picsum placeholder (see
below). Picsum images are randomised per seed and are **not** licensed
for production — they're there to let the layout work before real
photos are uploaded.

## Current fallbacks (placeholders only — replace before launch)

| Where                          | URL                                               | License          |
| ------------------------------ | ------------------------------------------------- | ---------------- |
| Hero fallback                  | `https://picsum.photos/seed/perry-home/1920/1080` | Placeholder only |
| About portrait fallback        | (none — section stays empty until uploaded)       | —                |

## Replacing with real licensed photos

1. **Source** — pick each photo from Unsplash (unsplash.com/license) or
   Pexels (pexels.com/license). Both allow commercial use with no
   attribution required, but **crediting the photographer is a courtesy
   and should be done here**.
2. **Download** — save the full-size file into
   `src/assets/home/` with a descriptive name, e.g.
   `hero-couple-labadi-beach.jpg`.
3. **Compress** — run through squoosh.app (or similar) to produce a WebP
   at ~1920px wide, quality 78–82. Target < 300 KB.
4. **Upload** — go to Admin → Portfolio → Website images and upload the
   WebP into the matching slot. The service re-encodes and stores the
   blob in IndexedDB; the public page swaps it in live.
5. **Credit** — add a row to the "Attributions" table below with
   photographer name, URL, and source.

## Attributions

<!-- Add one row per real photo. Example row shown below. -->

| File                                       | Photographer   | Source URL                              | License  |
| ------------------------------------------ | -------------- | --------------------------------------- | -------- |
| _(none yet — using Picsum placeholders)_   |                |                                         |          |
