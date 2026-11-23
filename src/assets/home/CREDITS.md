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
| `home_hero`     | Home hero background  | Admin → Portfolio → Website images → "Home hero"            |
| `home_portrait` | Home About portrait   | Admin → Portfolio → Website images → "About portrait"       |

When a slot is empty, the site falls back to a Picsum placeholder (see
below). Picsum images are randomised per seed and are **not** licensed
for production — they're there to let the layout work before real
photos are uploaded.

## Current fallbacks

| Where                          | URL                                                                                                    | License          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | ---------------- |
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
| Home hero (default, until a photo is uploaded to the `home_hero` slot) | Iskra Photography | [unsplash.com/photos/aoAmSJKUL_M](https://unsplash.com/photos/aoAmSJKUL_M) — "A bride and groom embracing in a field at sunset" (seen from behind, no faces). Original 5442×3628; served full-frame up to 3200px wide on landscape screens and as a 9:16 crop up to 1600×2844 on portrait screens. | [Unsplash License](https://unsplash.com/license) |
| Testimonial 1 — Wedding (Nana & Kofi) | Sabesh Photography LTD | [unsplash.com/photos/couple-silhouetted-by-a-sunset-at-the-beach-eHxsMt30i4M](https://unsplash.com/photos/couple-silhouetted-by-a-sunset-at-the-beach-eHxsMt30i4M) — "Couple silhouetted by a sunset at the beach". | [Unsplash License](https://unsplash.com/license) |
| Testimonial 2 — Corporate portraits (Esi Agyemang) | JV | [unsplash.com/photos/a-close-up-of-a-person-tying-a-tie-3uIKaSWEUHs](https://unsplash.com/photos/a-close-up-of-a-person-tying-a-tie-3uIKaSWEUHs) — "A close up of a person tying a tie". | [Unsplash License](https://unsplash.com/license) |
| Testimonial 3 — Family event (Benjamin Osei) | Abhishek Tirkey | [unsplash.com/photos/a-lavish-banquet-hall-is-decorated-for-an-event-4W6Np2np-ds](https://unsplash.com/photos/a-lavish-banquet-hall-is-decorated-for-an-event-4W6Np2np-ds) — "A lavish banquet hall is decorated for an event". | [Unsplash License](https://unsplash.com/license) |
| Testimonial 4 — Maternity (Akosua Boateng) | Sebastian Latorre | [unsplash.com/photos/pregnant-woman-standing-on-shore-QXNugKxqqeo](https://unsplash.com/photos/pregnant-woman-standing-on-shore-QXNugKxqqeo) — "Pregnant woman standing on shore" (same photo as portfolio seed_10). | [Unsplash License](https://unsplash.com/license) |

> All Unsplash License entries above: free for commercial and personal use; attribution appreciated but not required. Still credited here as a courtesy.

## Portfolio seed photos (public portfolio grid, 21 images)

All anonymous (silhouettes, back views, hands/detail shots, empty venues, or landscapes) so no identifiable face appears. Served via Unsplash's CDN with WebP + resize params. Admin can hide / feature / replace any of these from Admin → Portfolio.

### Wedding (6)

| Seed id | Shot | Photographer | Unsplash page | License |
| ------- | ---- | ------------ | ------------- | ------- |
| seed_1 | Wedding ring on a bouquet | Jocelyn Allen | [B3xc3hzPF68](https://unsplash.com/photos/a-wedding-ring-sitting-on-top-of-a-bouquet-of-flowers-B3xc3hzPF68) | [Unsplash License](https://unsplash.com/license) |
| seed_2 | Couple's hands with wedding rings touching | Klara Kulikova | [sj3gSYe5OXE](https://unsplash.com/photos/couples-hands-with-wedding-rings-touching-sj3gSYe5OXE) | [Unsplash License](https://unsplash.com/license) |
| seed_3 | Bride walking on shore with veil | Shifaaz shamoon | [v3CogJMwMvQ](https://unsplash.com/photos/woman-wearing-white-wedding-gown-with-veil-walking-on-shore-v3CogJMwMvQ) | [Unsplash License](https://unsplash.com/license) |
| seed_4 | Bride on a staircase about to walk | Haoward Nguyen | [BjjjRjH_6wo](https://unsplash.com/photos/bride-wearing-gown-and-veil-about-to-walk-on-staircase-BjjjRjH_6wo) | [Unsplash License](https://unsplash.com/license) |
| seed_5 | Couple dancing in a cloud of smoke | Liviu Boldis | [ZXO5V0qZJGU](https://unsplash.com/photos/a-bride-and-groom-dancing-in-a-cloud-of-smoke-ZXO5V0qZJGU) | [Unsplash License](https://unsplash.com/license) |
| seed_6 | Silhouette of two people on a beach at sunset | David Emrich | [GRMO21Kqj5A](https://unsplash.com/photos/silhouette-of-2-person-standing-on-beach-shore-during-sunset-GRMO21Kqj5A) | [Unsplash License](https://unsplash.com/license) |

### Portrait (6)

| Seed id | Shot | Photographer | Unsplash page | License |
| ------- | ---- | ------------ | ------------- | ------- |
| seed_7 | Afro silhouette against a white background (high-key profile) | Dotun S. | [z_s_k2nxCB4](https://unsplash.com/photos/back-of-a-womans-head-z_s_k2nxCB4) | [Unsplash License](https://unsplash.com/license) |
| seed_8 | Rim-lit woman in profile, dark studio | Sophia | [Mjm6ot0FdNE](https://unsplash.com/photos/a-silhouette-of-a-woman-in-the-dark-Mjm6ot0FdNE) | [Unsplash License](https://unsplash.com/license) |
| seed_9 | Woman in profile against a sunset sky | Ziyao Xiong | [hkC5nW5hMgs](https://unsplash.com/photos/a-silhouette-of-a-woman-at-sunset-hkC5nW5hMgs) | [Unsplash License](https://unsplash.com/license) |
| seed_10 | Pregnant woman standing on the shore (dusk silhouette) | Sebastian Latorre | [QXNugKxqqeo](https://unsplash.com/photos/pregnant-woman-standing-on-shore-QXNugKxqqeo) | [Unsplash License](https://unsplash.com/license) |
| seed_11 | Man in side profile, blue rim light | Cemrecan Yurtman | [EAmyRE5_2lM](https://unsplash.com/photos/a-silhouette-of-a-person-in-the-dark-EAmyRE5_2lM) | [Unsplash License](https://unsplash.com/license) |
| seed_12 | Woman backlit by morning sun, face hidden | Tiffany Combs | [aQld4blsXoA](https://unsplash.com/photos/silhouette-photo-of-woman-during-daytime-aQld4blsXoA) | [Unsplash License](https://unsplash.com/license) |

### Event (4)

| Seed id | Shot | Photographer | Unsplash page | License |
| ------- | ---- | ------------ | ------------- | ------- |
| seed_13 | Rows of empty seats in a large auditorium | Vadim Kuznetsov | [lDzyjg14g2c](https://unsplash.com/photos/rows-of-empty-seats-in-a-large-auditorium-lDzyjg14g2c) | [Unsplash License](https://unsplash.com/license) |
| seed_14 | Birthday cake with candles | Imants Kaziļuns | [Z30Jpgmx2UY](https://unsplash.com/photos/happy-birthday-cake-with-candles-Z30Jpgmx2UY) | [Unsplash License](https://unsplash.com/license) |
| seed_15 | Empty auditorium with chalkboard and chairs | Ksenia Obukhova | [BWfJvlISbmk](https://unsplash.com/photos/an-empty-auditorium-with-a-chalkboard-and-chairs-BWfJvlISbmk) | [Unsplash License](https://unsplash.com/license) |
| seed_16 | Crowd with hands raised at a concert with stage lights | Vitalii Onyshchuk | [b7gi_rqKxcQ](https://unsplash.com/photos/crowd-with-hands-raised-at-a-concert-with-stage-lights-b7gi_rqKxcQ) | [Unsplash License](https://unsplash.com/license) |

### Landscape (5)

| Seed id | Shot | Photographer | Unsplash page | License |
| ------- | ---- | ------------ | ------------- | ------- |
| seed_17 | Fishing village with boats on sandy and rocky shore — Elmina, Ghana | Wietse Jongsma | [Gdz6bM7z8Ao](https://unsplash.com/photos/fishing-village-with-boats-on-sandy-shore-and-rocky-shore-Gdz6bM7z8Ao) | [Unsplash License](https://unsplash.com/license) |
| seed_18 | Brown boat on the seashore — Cape Coast, Ghana | orva studio | [-0lm9r442zE](https://unsplash.com/photos/brown-boat-on-the-seashore--0lm9r442zE) | [Unsplash License](https://unsplash.com/license) |
| seed_19 | Aerial photography of Accra, Ghana | Virgyl Sowah | [E9NPWGBXM9o](https://unsplash.com/photos/E9NPWGBXM9o) | [Unsplash License](https://unsplash.com/license) |
| seed_20 | Golden hour illuminating a rocky coastline with crashing waves | Kellen Riggin | [9jTkTV7E51I](https://unsplash.com/photos/golden-hour-illuminates-rocky-coastline-with-crashing-waves-9jTkTV7E51I) | [Unsplash License](https://unsplash.com/license) |
| seed_21 | Aerial view of a city skyline at dusk | Klaus Birner | [3mdHgIGJdrM](https://unsplash.com/photos/aerial-view-of-a-city-skyline-at-dusk-3mdHgIGJdrM) | [Unsplash License](https://unsplash.com/license) |

### Graduation (Portrait, tagged `graduation`) — Family & graduation package (5)

Identifiable people: Unsplash provides no model release.

| Seed id | Shot | Photographer | Unsplash page | License |
| ------- | ---- | ------------ | ------------- | ------- |
| seed_22 | Two graduates in green gowns and kente stoles walking across campus | Raymond Owusu-Afriyie | [PCYPAmfyvvs](https://unsplash.com/photos/two-women-in-graduation-gowns-walking-down-a-street-PCYPAmfyvvs) | [Unsplash License](https://unsplash.com/license) |
| seed_23 | Graduate in a green gown and kente stole, side profile | Raymond Owusu-Afriyie | [dGNvkOOCWeQ](https://unsplash.com/photos/a-woman-in-a-graduation-gown-is-walking-down-the-street-dGNvkOOCWeQ) | [Unsplash License](https://unsplash.com/license) |
| seed_24 | Graduate seen from behind adjusting her cap, studio backdrop | Emediong Umoh | [biVOjoZb4c](https://unsplash.com/photos/a-woman-wearing-a-graduation-gown-and-a-black-hat--biVOjoZb4c) | [Unsplash License](https://unsplash.com/license) |
| seed_25 | Graduates tossing their caps in front of a university building | Rut Miit | [hpRGrfOIybc](https://unsplash.com/photos/graduates-throwing-caps-in-celebration-hpRGrfOIybc) | [Unsplash License](https://unsplash.com/license) |
| seed_26 | Graduate in cap and gown on campus steps (Uganda Martyrs University) | Askas Jeremy | [HmX3neVpUPs](https://unsplash.com/photos/a-man-in-a-graduation-cap-and-gown-HmX3neVpUPs) | [Unsplash License](https://unsplash.com/license) |

## Contact page

| Where | Photographer | Source | License |
| ----- | ------------ | ------ | ------- |
| Contact hero (`/contact`) — hand holding a professional camera with a large white telephoto lens | rawkkim | [unsplash.com/photos/R_Qoc5ycrtA](https://unsplash.com/photos/hand-holding-a-professional-camera-with-a-large-lens-R_Qoc5ycrtA) | [Unsplash License](https://unsplash.com/license) |
