---
name: uiux-pro-max
description: Editorial, photography-led design system for the Perry Studios portfolio site. Load when designing or redesigning any public page (Home, Gallery, Packages, SiteFooter), building a new section, choosing colors/typography/motion, picking images, or evaluating a visual against the project's design rules. Enforces real photos only, outlined icons, Aptos typography, amber accent, generous whitespace, alternating light/dark sections, prefers-reduced-motion compliance, WebP + lazy loading, and no AI-generated decorative art (bokeh, aperture glyphs, glowing blobs).
---

# UI/UX Pro Max — Perry Studios

Design the public portfolio like a high-end photography book, not a
template. Photos carry the design; everything else recedes.

## Non-negotiables (read first)

1. **No AI-generated images, no decorative SVG/CSS art.** No bokeh
   circles, aperture glyphs, lens rings, film strips, drifting blobs,
   glowing shapes, or generative noise overlays. If you added any
   earlier in a session, remove them.
2. **No emoji, no stock icon packs for decoration.** Icons are only
   acceptable as outlined SVG strokes (`stroke="currentColor"`,
   `fill="none"`) for utilities (social links, close buttons, arrows).
   One or two per section at most.
3. **No glassmorphism, no neon gradients, no card-stacking template
   look.** No `backdrop-filter: blur`, no multi-stop neon gradients, no
   rainbow accents.
4. **Real photographs only.** First try the studio's own work via
   `portfolioService.listPublicPhotos()` / `getSiteImageUrl()`. For
   placeholders needed in development, use `picsum.photos` *and* note
   it in `src/assets/home/CREDITS.md` as a replace-before-launch item.
   For stock, use Unsplash or Pexels (both allow commercial use free)
   and record every attribution in `CREDITS.md`.
5. **Prefers-reduced-motion is a hard contract.** Every animated
   property (transform, opacity, transition, keyframe) must opt out
   under `@media (prefers-reduced-motion: reduce)`.

## Palette

Scoped tokens. Don't invent new colors; add them to the editorial
sections' `--paper*` / `--sf-*` token blocks instead.

```css
--paper:           #f5f0e6;  /* warm off-white for light sections */
--paper-ink:       #1b1612;  /* body text on paper */
--paper-ink-muted: #6b5f52;  /* eyebrows, captions, labels on paper */
--paper-rule:      #d9cfbe;  /* hairline rules on paper */

--ink-surface:     #141311;  /* deep charcoal for dark sections */
--ink-rule:        rgba(255, 255, 255, 0.1);
--ink-text:        rgba(255, 255, 255, 0.9);
--ink-text-muted:  rgba(255, 255, 255, 0.6);

--accent-amber:        #B8853D;  /* brand accent — buttons, rules */
--accent-amber-strong: #8B6225;  /* hover + active */
```

Rules:
- One accent color. Amber is it. No red/green/blue accents.
- Buttons: filled amber primary (sharp 2px corners, uppercase micro-
  letters). Secondary = underlined ghost link.
- Alternate dark and light sections down the page so the eye breathes.
  Hero (dark photo) → About (paper) → Services (dark) → Steps (paper)
  → Testimonials (dark) → Footer (dark). Never two paper sections in a
  row and never three dark sections in a row.

## Typography

Everything routes through `--font-sans` which resolves to:
`"Aptos", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

Scale (clamp-based, mobile → desktop):
- **Display H1 / hero title**: `clamp(3rem, 7vw + 1rem, 7.5rem)`,
  weight 300, line-height 0.95, letter-spacing -0.02em.
- **Section H2**: `clamp(2.1rem, 2.4vw + 1.2rem, 3.6rem)`, weight 300,
  letter-spacing -0.015em.
- **H3 / card title**: `clamp(1.2rem, 0.6vw + 1rem, 1.5rem)`,
  weight 500, letter-spacing -0.01em.
- **Body paragraph**: `clamp(1rem, 0.3vw + 0.95rem, 1.1rem)`,
  line-height 1.7, measure capped at 36rem (~62ch).
- **Eyebrow label**: 0.72rem, letter-spacing 0.26em, text-transform
  uppercase, weight 600. Always paired with a 2.25rem amber hairline.
- **UI label (button, nav)**: 0.78–0.95rem, letter-spacing 0.08–0.14em,
  uppercase, weight 600.

Lead paragraphs can bold the first line via `::first-line` for an
editorial drop-in.

## Layout

- **Max content width**: 1200px (footer), 1240px (About), 1120px
  (generic). Gutter `clamp(1.25rem, 5vw, 3rem)`.
- **Section vertical padding**: `clamp(4rem, 8vw, 7rem)` for editorial
  sections. Hero fills `100svh`.
- **Grids are asymmetric** on desktop:
  - About: 5fr media / 6fr copy, gap `clamp(3rem, 6vw, 6rem)`
  - Services: 2fr lead card / 1fr + 1fr tiles
  - Footer: 1.4fr brand / 1fr explore / 1fr services / 1.3fr contact
- **Hero content** anchors to **bottom-left** on desktop (not centered)
  with left-aligned type and the amber rule between title and tagline.
- **Mobile**: everything stacks. Minimum 44×44 tap targets for socials,
  buttons, nav links, back-to-top. No horizontal scroll at any width.

## Motion

Allowed primitives (slow, gentle):
- **Fade-in on scroll** via existing `.reveal reveal-1/2/3` or
  `IntersectionObserver` adding `.is-visible`. Durations 500–800ms,
  stagger 60–120ms.
- **Photo hover**: `transform: scale(1.04)` with 900ms
  `cubic-bezier(0.2, 0.6, 0.2, 1)`. Filter saturation +0.1 permitted.
- **Button hover**: `translateY(-1px)` + background shift. 180ms ease.
- **Arrow nudges**: inline `<span aria-hidden="true">→</span>` on
  underlined links; `translateX(3-4px)` on hover.
- **Scroll indicator**: thin vertical rule pulsing scaleY, 2.4s loop.

Disallowed: parallax, auto-rotating decorative shapes, infinite drift,
multi-second entry animations, letter-by-letter staggering.

Every animated rule MUST have a matching
`@media (prefers-reduced-motion: reduce)` block that sets
`transition: none` / `animation: none` and neutralises hover transforms.

## Images

- **Format**: WebP, quality 78–82. Target < 300 KB per image at 1920px.
- **Delivery**: `fetchPriority="high"` on the hero; everything else
  `loading="lazy"`.
- **Processing**: run new uploads through `utils/imageProcessing.js`
  which already encodes WebP and generates thumbs.
- **Storage**: large images live in IndexedDB via `idb-keyval`; the
  `portfolioService` returns resolved blob URLs. Revoke
  `URL.createObjectURL` results in effect cleanup.
- **Admin slot replacement is the primary workflow**. Never hard-code a
  hero/portrait path in a page — go through
  `portfolio.getSiteImageUrl(slot)` with a sensible Picsum fallback.
- **CREDITS.md** at `src/assets/home/CREDITS.md` lists every real
  photo, source URL, and license. Update it in the same change as the
  image.

## Icons

Allowed:
- Social icons (Instagram, Facebook, TikTok, YouTube, WhatsApp) as
  outlined SVG strokes in `currentColor`.
- UI arrows and chevrons as inline `<span>→</span>` text, not as SVG
  decoration.
- Close/menu glyphs as outlined SVGs on buttons that have an
  `aria-label`.

Not allowed:
- Service/category icons (parcel, calendar, check, camera) as
  decoration inside cards. Use photo thumbnails or type-only treatments
  instead. If a card must have a visual, use a cropped photo.
- Emoji anywhere in UI text or copy.
- Any stock icon pack (Feather, Heroicons, Font Awesome, Lucide).

## Section recipes

Reach for these shapes before inventing new ones.

### Hero (dark, photo-led)
- Full-bleed `<img>` with `fetchPriority="high"`.
- Two-stop scrim: `linear-gradient(180deg, 0% transparent → 70% rgba(10,8,6,0.55) → 100% rgba(10,8,6,0.85))` plus a side scrim on the left.
- Content block bottom-left, max-width 56rem.
- Eyebrow → H1 (light 300) → 2px amber rule 56px wide → tagline → CTAs
  (amber primary button + underlined ghost link).
- Slim vertical scroll indicator bottom-right.

### Editorial content section (paper)
- Background `--paper`, ink `--paper-ink`.
- Asymmetric 2-column grid with a bold image on one side and copy on
  the other. Image gets a subtle offset shadow (`0 24px 60px -36px
  rgba(27,22,18,0.5)`) and a figcaption overlay (`NO. 0X` in amber +
  descriptor in white uppercase).
- Eyebrow with amber hairline, oversized H2, measured paragraphs,
  underlined link CTA.
- Optional stats row below with a hairline rule and light-weight
  numerals.

### Dark content section
- Background `--ink-surface`. Grid of 3 cards or a slider.
- Each card: thumbnail photo + title + 1-sentence body + small
  "Explore →" affordance. No icons.
- Padding `clamp(4rem, 8vw, 7rem) 0`.

### Footer
- 4 columns (`1.4fr / 1fr / 1fr / 1.3fr`) on ≥760px, stacked below.
- Hairline rule at the very top aligned to container width (not
  viewport).
- Optional 6-tile recent-frames strip above the columns, from
  `portfolioService.listPublicPhotos().slice(0,6)`.
- Bottom bar: left © + right Back-to-top button. Divider above.

## Content & copy

- Keep placeholder text explicitly bracketed: `[PLACEHOLDER]`. Collect
  all unresolved placeholders in `homeContent.PLACEHOLDERS`.
- Studio profile (name, tagline, contacts, socials) is live-editable
  via Admin → Settings. Pages read it via `studioProfile.getProfile()`
  and listen to `studioProfile.CHANGED_EVENT_NAME` for refresh.
- Section copy lives in `src/data/homeContent.js`. Page JSX never
  hard-codes marketing strings.

## Checklist before shipping a redesign

Run through this list for every section.

- [ ] No AI-generated images or decorative CSS/SVG art added.
- [ ] All photos are from the admin portfolio or documented in
      `CREDITS.md` (with license + photographer).
- [ ] All animated rules have a `prefers-reduced-motion` opt-out.
- [ ] Minimum 44×44 tap targets on every interactive element at ≤640px.
- [ ] No horizontal scroll at 320px, 375px, 414px, and 768px.
- [ ] Text contrast meets WCAG AA against the surface it sits on.
- [ ] Images use `loading="lazy"` below the hero; hero uses
      `fetchPriority="high"`.
- [ ] One accent color only (amber). No new palette additions.
- [ ] Section follows the dark/paper alternation rule.
- [ ] Section-order spec in the request matches what's actually
      rendered. If a section referenced in the spec was removed earlier
      in the conversation, surface that mismatch instead of silently
      reinstating it.

## When to load this skill

- The user says "redesign", "editorial", "clean up", "make it look like
  a real site", "UI/UX", "visual pass", or similar.
- A new section is being added to a public page.
- Images, icons, typography, or motion are being changed.
- Before "approve/reject" review of a visual change.

Skip this skill for admin-area changes (admin stays white and
functional; its design rules are different).
