# Home page image credits

This file lists every photograph used on the public Home page and
where it came from. Keep it current — if you replace an image, update
the entry here in the same change.

## How images are sourced right now

All Home page imagery is served through the admin **Portfolio → Website
images** slots so you can replace it in the browser without touching
code:

| Slot name       | Used on               | Replace in                                                  |
| --------------- | --------------------- | ----------------------------------------------------------- |
| `cover`         | Public splash (`/`)   | Admin → Portfolio → Website images → "Home cover"           |
| `home_hero`     | Home hero background  | Admin → Portfolio → Website images → "Home hero"            |
| `home_portrait` | Home About portrait   | Admin → Portfolio → Website images → "About portrait"       |

When a slot is empty, the site falls back to a Picsum placeholder (see
below). Picsum images are randomised per seed and are **not** licensed
for production — they're there to let the layout work before real
photos are uploaded.

## Current fallbacks

| Where                          | URL                                                                                                    | License          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | ---------------- |
| Cover splash fallback          | `https://images.unsplash.com/photo-1745102098874-0a9d16c077ee?w=1920&q=80&fm=webp&auto=format`         | Unsplash License (see Attributions) |
| Home hero fallback             | `https://picsum.photos/seed/perry-home/1920/1080`                                                      | Placeholder only — replace before launch |
| About portrait fallback        | (none — section stays empty until uploaded)                                                            | —                |

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

| Where                               | Photographer       | Source                                                                                                                                                                         | License          |
| ----------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| Cover splash (`/`)                  | Wietse Jongsma     | [unsplash.com/photos/sunset-over-a-beach-with-palm-trees-pxXdejrvhcE](https://unsplash.com/photos/sunset-over-a-beach-with-palm-trees-pxXdejrvhcE) — "Sunset over a beach with palm trees" (Elmina, Ghana per Unsplash location tag). | [Unsplash License](https://unsplash.com/license) |
| Testimonial 1 — Wedding (Nana & Kofi) | Sabesh Photography LTD | [unsplash.com/photos/couple-silhouetted-by-a-sunset-at-the-beach-eHxsMt30i4M](https://unsplash.com/photos/couple-silhouetted-by-a-sunset-at-the-beach-eHxsMt30i4M) — "Couple silhouetted by a sunset at the beach". | [Unsplash License](https://unsplash.com/license) |
| Testimonial 2 — Corporate portraits (Esi Agyemang) | JV | [unsplash.com/photos/a-close-up-of-a-person-tying-a-tie-3uIKaSWEUHs](https://unsplash.com/photos/a-close-up-of-a-person-tying-a-tie-3uIKaSWEUHs) — "A close up of a person tying a tie". | [Unsplash License](https://unsplash.com/license) |
| Testimonial 3 — Family event (Benjamin Osei) | Abhishek Tirkey | [unsplash.com/photos/a-lavish-banquet-hall-is-decorated-for-an-event-4W6Np2np-ds](https://unsplash.com/photos/a-lavish-banquet-hall-is-decorated-for-an-event-4W6Np2np-ds) — "A lavish banquet hall is decorated for an event". | [Unsplash License](https://unsplash.com/license) |
| Testimonial 4 — Maternity (Akosua Boateng) | Janko Ferlič | [unsplash.com/photos/pregnant-woman-in-silhouette-ZNVGL_Pcf74](https://unsplash.com/photos/pregnant-woman-in-silhouette-ZNVGL_Pcf74) — "A pregnant woman in silhouette holding her belly against a bright white background". | [Unsplash License](https://unsplash.com/license) |

> All Unsplash License entries above: free for commercial and personal use; attribution appreciated but not required. Still credited here as a courtesy.
