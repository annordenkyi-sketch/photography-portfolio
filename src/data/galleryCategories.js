// =============================================================================
// Single source of truth for public gallery categories.
//
// Read from here by:
//   - The "What I Shoot" cards on Home   → shows label + description, links to
//                                          /gallery?category=<slug>.
//   - The Gallery page filter tabs       → shows "All" first, then one tab per
//                                          category below, in order.
//   - The admin Portfolio defaults       → CATEGORY_LABELS feeds
//                                          portfolioService.DEFAULT_CATEGORIES.
//
// Everything here is slug-first: `slug` is the URL-safe identifier used in
// query params and in photo.category storage comparisons; `label` is the one
// user-facing name — do not vary it per surface, keep it identical everywhere
// so the Home card, Gallery tab, and admin dropdown all read the same.
//
// Order below IS the order shown on the Gallery (after "All") AND on the Home
// services section. If you reorder, both update together.
//
// `description`  — one-sentence copy shown on the Home services card.
// `coverImage`   — optional static URL to show on the Home services card. When
//                  null (default), Home falls back to the first public photo in
//                  that category, which keeps the card auto-fresh as the admin
//                  Portfolio changes. Set this to a URL to pin a specific
//                  image for the card instead.
// =============================================================================

export const GALLERY_CATEGORIES = [
  {
    slug: 'all',
    label: 'All',
    description: null,
    coverImage: null,
    // Meta-entry — only used by the Gallery as the "show everything" tab.
    // Home services + admin ignore this one.
  },
  {
    slug: 'wedding',
    label: 'Wedding',
    description: 'Full-day coverage with second shooter options for ceremonies and receptions.',
    coverImage: null,
  },
  {
    slug: 'portrait',
    label: 'Portrait',
    description: 'Individuals, families, maternity, and headshots in studio or on location.',
    coverImage: null,
  },
  {
    slug: 'event',
    label: 'Event',
    description: 'Corporate functions, launches, parties — candid plus formal group shots.',
    coverImage: null,
  },
  {
    slug: 'landscape',
    label: 'Landscape',
    description: 'Branded landscape commissions, travel editorial, and location scouting.',
    coverImage: null,
  },
]

// Categories as the Home services + admin dropdown see them (no "All").
export const CONTENT_CATEGORIES = GALLERY_CATEGORIES.filter((c) => c.slug !== 'all')

// Labels only — fed into portfolioService.DEFAULT_CATEGORIES so the admin
// portfolio's default dropdown stays in lockstep with this file.
export const CATEGORY_LABELS = CONTENT_CATEGORIES.map((c) => c.label)

export function slugToLabel(slug) {
  const found = GALLERY_CATEGORIES.find((c) => c.slug === String(slug || '').toLowerCase())
  return found ? found.label : null
}

export function labelToSlug(label) {
  const found = GALLERY_CATEGORIES.find((c) => c.label.toLowerCase() === String(label || '').toLowerCase())
  return found ? found.slug : null
}

// Returns the valid slug for the given input, falling back to 'all' when
// the slug isn't in the shared list. Keeps shared/custom links robust.
export function normalizeSlug(input) {
  const s = String(input || '').toLowerCase()
  if (!s) return 'all'
  return GALLERY_CATEGORIES.find((c) => c.slug === s)?.slug || 'all'
}
