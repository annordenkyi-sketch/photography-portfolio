// Single source of truth for public gallery categories. Used by:
// - The "What I Shoot" cards on Home (link to /gallery?category=<slug>)
// - The Gallery page filter tabs
// - The admin portfolio's default category list (so names can't drift)
//
// `slug` = URL-safe identifier used in query params.
// `label` = user-facing name shown everywhere.
export const GALLERY_CATEGORIES = [
  { slug: 'all',       label: 'All' },
  { slug: 'wedding',   label: 'Wedding' },
  { slug: 'portrait',  label: 'Portrait' },
  { slug: 'event',     label: 'Event' },
  { slug: 'landscape', label: 'Landscape' },
]

// Labels for admin portfolio defaults (excludes the special "All" entry).
export const CATEGORY_LABELS = GALLERY_CATEGORIES
  .filter((c) => c.slug !== 'all')
  .map((c) => c.label)

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
