// Single source of truth for public portfolio categories, shared by the
// Portfolio filter tabs and the admin Portfolio defaults so names and order
// can never drift. `slug` is the URL-safe id used in ?category=; `label`
// is the one user-facing name.
export const PORTFOLIO_CATEGORIES = [
  { slug: 'all',       label: 'All' },
  { slug: 'wedding',   label: 'Wedding' },
  { slug: 'portrait',  label: 'Portrait' },
  { slug: 'event',     label: 'Event' },
  { slug: 'landscape', label: 'Landscape' },
]

// Real categories only (no "All").
export const CONTENT_CATEGORIES = PORTFOLIO_CATEGORIES.filter((c) => c.slug !== 'all')

// Feeds portfolioService.DEFAULT_CATEGORIES for the admin dropdown.
export const CATEGORY_LABELS = CONTENT_CATEGORIES.map((c) => c.label)

export function slugToLabel(slug) {
  const found = PORTFOLIO_CATEGORIES.find((c) => c.slug === String(slug || '').toLowerCase())
  return found ? found.label : null
}

export function labelToSlug(label) {
  const found = PORTFOLIO_CATEGORIES.find((c) => c.label.toLowerCase() === String(label || '').toLowerCase())
  return found ? found.slug : null
}

// Valid slug for the input, falling back to 'all' for unknown values.
export function normalizeSlug(input) {
  const s = String(input || '').toLowerCase()
  if (!s) return 'all'
  return PORTFOLIO_CATEGORIES.find((c) => c.slug === s)?.slug || 'all'
}
