// =========================================================================
// Portfolio service — frontend-only prototype.
//
// Metadata (photo list, categories, site-image slot overrides) lives in
// localStorage. Image blobs live in IndexedDB via idb-keyval so we don't
// burn the ~5 MB localStorage quota.
//
// Public API: everything is async. Replace the body of each function with
// REST / cloud calls later — the signatures stay stable.
// =========================================================================
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval'
import { processImage } from '../utils/imageProcessing.js'
import { CATEGORY_LABELS } from '../data/galleryCategories.js'

const PHOTO_META_KEY = 'demo:portfolio:photos'
const CATS_KEY = 'demo:portfolio:categories'
const SITE_META_KEY = 'demo:portfolio:siteImages'

/* --- Default seed ------------------------------------------------------ */

// Pulled from the shared gallery categories so admin + public + Home
// services section can never drift apart.
export const DEFAULT_CATEGORIES = CATEGORY_LABELS

// Seeded gallery photos (external URLs — browsers cache them). Admin can
// hide, feature, or add alongside. When new ones are uploaded they go into
// IndexedDB and sit beside these.
const SEED_PHOTOS = [
  { id: 'seed_1',  category: 'Wedding',   src: 'https://picsum.photos/seed/wedding1/1200/800',  thumbSrc: 'https://picsum.photos/seed/wedding1/480/320',  title: 'Wedding ceremony',       caption: '',                        featured: true,  hidden: false, order: 1  },
  { id: 'seed_2',  category: 'Wedding',   src: 'https://picsum.photos/seed/wedding2/1200/800',  thumbSrc: 'https://picsum.photos/seed/wedding2/480/320',  title: 'Bride and groom portrait', caption: '',                        featured: false, hidden: false, order: 2  },
  { id: 'seed_3',  category: 'Wedding',   src: 'https://picsum.photos/seed/wedding3/1200/800',  thumbSrc: 'https://picsum.photos/seed/wedding3/480/320',  title: 'Reception moment',          caption: '',                        featured: false, hidden: false, order: 3  },
  { id: 'seed_4',  category: 'Portrait',  src: 'https://picsum.photos/seed/portrait1/1200/800', thumbSrc: 'https://picsum.photos/seed/portrait1/480/320', title: 'Studio portrait',           caption: '',                        featured: true,  hidden: false, order: 4  },
  { id: 'seed_5',  category: 'Portrait',  src: 'https://picsum.photos/seed/portrait2/1200/800', thumbSrc: 'https://picsum.photos/seed/portrait2/480/320', title: 'Outdoor portrait',          caption: '',                        featured: false, hidden: false, order: 5  },
  { id: 'seed_6',  category: 'Portrait',  src: 'https://picsum.photos/seed/portrait3/1200/800', thumbSrc: 'https://picsum.photos/seed/portrait3/480/320', title: 'Candid portrait',           caption: '',                        featured: false, hidden: false, order: 6  },
  { id: 'seed_7',  category: 'Event',     src: 'https://picsum.photos/seed/event1/1200/800',    thumbSrc: 'https://picsum.photos/seed/event1/480/320',    title: 'Corporate event',           caption: '',                        featured: true,  hidden: false, order: 7  },
  { id: 'seed_8',  category: 'Event',     src: 'https://picsum.photos/seed/event2/1200/800',    thumbSrc: 'https://picsum.photos/seed/event2/480/320',    title: 'Birthday celebration',      caption: '',                        featured: false, hidden: false, order: 8  },
  { id: 'seed_9',  category: 'Landscape', src: 'https://picsum.photos/seed/landscape1/1200/800',thumbSrc: 'https://picsum.photos/seed/landscape1/480/320',title: 'Mountain landscape',        caption: '',                        featured: false, hidden: false, order: 9  },
  { id: 'seed_10', category: 'Landscape', src: 'https://picsum.photos/seed/landscape2/1200/800',thumbSrc: 'https://picsum.photos/seed/landscape2/480/320',title: 'Coastal landscape',         caption: '',                        featured: false, hidden: false, order: 10 },
  { id: 'seed_11', category: 'Landscape', src: 'https://picsum.photos/seed/landscape3/1200/800',thumbSrc: 'https://picsum.photos/seed/landscape3/480/320',title: 'Forest landscape',          caption: '',                        featured: false, hidden: false, order: 11 },
  { id: 'seed_12', category: 'Event',     src: 'https://picsum.photos/seed/other1/1200/800',    thumbSrc: 'https://picsum.photos/seed/other1/480/320',    title: 'Street photography',        caption: '',                        featured: false, hidden: false, order: 12 },
  // Extra 4 photos so every category has at least 4 shots in the seed.
  { id: 'seed_13', category: 'Wedding',   src: 'https://picsum.photos/seed/wedding4/1200/800',  thumbSrc: 'https://picsum.photos/seed/wedding4/480/320',  title: 'First dance',               caption: '',                        featured: false, hidden: false, order: 13 },
  { id: 'seed_14', category: 'Portrait',  src: 'https://picsum.photos/seed/portrait4/1200/800', thumbSrc: 'https://picsum.photos/seed/portrait4/480/320', title: 'Family portrait',           caption: '',                        featured: false, hidden: false, order: 14 },
  { id: 'seed_15', category: 'Event',     src: 'https://picsum.photos/seed/event3/1200/800',    thumbSrc: 'https://picsum.photos/seed/event3/480/320',    title: 'Conference keynote',        caption: '',                        featured: false, hidden: false, order: 15 },
  { id: 'seed_16', category: 'Landscape', src: 'https://picsum.photos/seed/landscape4/1200/800',thumbSrc: 'https://picsum.photos/seed/landscape4/480/320',title: 'Sunset over the lagoon',    caption: '',                        featured: false, hidden: false, order: 16 },
]

// Default website image slots (what the public site falls back to)
export const SITE_IMAGE_SLOTS = [
  {
    key: 'cover',
    label: 'Cover page hero',
    description: 'Full-screen landing image on the public cover (/).',
    recommended: 'Best size: 1920 × 1080, landscape',
    defaultUrl: 'https://picsum.photos/seed/perry-cover/1920/1080',
  },
  {
    key: 'home_hero',
    label: 'Home page hero',
    description: 'The large hero behind the Home page intro.',
    recommended: 'Best size: 1920 × 1080, landscape',
    defaultUrl: 'https://picsum.photos/seed/perry-home/1920/1080',
  },
  {
    key: 'home_portrait',
    label: 'About portrait',
    description: 'Portrait of the photographer in the Home → About section.',
    recommended: 'Best size: 1200 × 1500, portrait',
    defaultUrl: 'https://picsum.photos/seed/perry-portrait/1200/1500',
  },
  {
    key: 'home_cta',
    label: 'Final CTA background',
    description: 'Full-width image behind the "Ready to capture your story?" banner at the bottom of Home.',
    recommended: 'Best size: 1920 × 800, landscape',
    defaultUrl: 'https://picsum.photos/seed/perry-cta/1920/800',
  },
]

/* --- Metadata persistence --------------------------------------------- */

function loadPhotos() {
  try {
    const raw = localStorage.getItem(PHOTO_META_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* fall through */ }
  return SEED_PHOTOS
}

function savePhotos(list) {
  try { localStorage.setItem(PHOTO_META_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

export function getCategories() {
  try {
    const raw = localStorage.getItem(CATS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* fall through */ }
  return DEFAULT_CATEGORIES
}

function saveCategories(cats) {
  try { localStorage.setItem(CATS_KEY, JSON.stringify(cats)) } catch { /* ignore */ }
}

/* --- Photo API -------------------------------------------------------- */

// Returns the list of photo metadata, sorted by `order`.
export function listPhotoMeta() {
  return loadPhotos().slice().sort((a, b) => a.order - b.order)
}

// Returns the public (non-hidden) photos.
export function listPublicPhotos() {
  return listPhotoMeta().filter((p) => !p.hidden)
}

// Returns the featured + non-hidden photos (used by the public homepage).
export function listFeaturedPhotos() {
  return listPhotoMeta().filter((p) => p.featured && !p.hidden)
}

// Resolve the thumbnail URL for a photo (object URL from IDB blob OR direct src).
export async function resolveThumbUrl(photo) {
  if (photo.thumbSrc) return photo.thumbSrc
  const blob = await idbGet(`photo:${photo.id}:thumb`)
  return blob ? URL.createObjectURL(blob) : null
}

// Resolve the full-size URL.
export async function resolveFullUrl(photo) {
  if (photo.src) return photo.src
  const blob = await idbGet(`photo:${photo.id}:full`)
  return blob ? URL.createObjectURL(blob) : null
}

// Upload: process file, store blobs, add metadata.
export async function uploadPhoto(file, { category = 'Wedding', title = '', caption = '' } = {}) {
  const { fullBlob, thumbBlob } = await processImage(file)
  const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  await idbSet(`photo:${id}:full`, fullBlob)
  await idbSet(`photo:${id}:thumb`, thumbBlob)
  const list = loadPhotos()
  const nextOrder = (list.reduce((m, p) => Math.max(m, p.order), 0) || 0) + 1
  const meta = {
    id,
    category,
    title: title || stripExt(file.name),
    caption,
    featured: false,
    hidden: false,
    order: nextOrder,
    src: null,
    thumbSrc: null,
    uploadedAt: new Date().toISOString(),
  }
  list.push(meta)
  savePhotos(list)
  return meta
}

export function updatePhoto(id, patch) {
  const next = loadPhotos().map((p) => (p.id === id ? { ...p, ...patch } : p))
  savePhotos(next)
  return next.find((p) => p.id === id) || null
}

export async function deletePhoto(id) {
  await idbDel(`photo:${id}:full`).catch(() => {})
  await idbDel(`photo:${id}:thumb`).catch(() => {})
  savePhotos(loadPhotos().filter((p) => p.id !== id))
}

export function toggleFeatured(id) {
  const list = loadPhotos()
  const target = list.find((p) => p.id === id)
  if (!target) return null
  return updatePhoto(id, { featured: !target.featured })
}

export function toggleHidden(id) {
  const list = loadPhotos()
  const target = list.find((p) => p.id === id)
  if (!target) return null
  return updatePhoto(id, { hidden: !target.hidden })
}

export function reorderPhotos(idList) {
  const map = Object.fromEntries(loadPhotos().map((p) => [p.id, p]))
  const next = idList.map((id, idx) => ({ ...map[id], order: idx + 1 })).filter(Boolean)
  // Preserve any photos not in idList at the end
  for (const p of Object.values(map)) {
    if (!idList.includes(p.id)) next.push({ ...p, order: next.length + 1 })
  }
  savePhotos(next)
}

export function addCategory(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed) throw new Error('Category name is required.')
  const cats = getCategories()
  if (cats.includes(trimmed)) return cats
  const next = [...cats, trimmed]
  saveCategories(next)
  return next
}

/* --- Website images API ----------------------------------------------- */

function loadSiteMeta() {
  try {
    const raw = localStorage.getItem(SITE_META_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveSiteMeta(meta) {
  try { localStorage.setItem(SITE_META_KEY, JSON.stringify(meta)) } catch { /* ignore */ }
}

export async function getSiteImageUrl(key) {
  const slot = SITE_IMAGE_SLOTS.find((s) => s.key === key)
  if (!slot) return null
  const meta = loadSiteMeta()
  if (meta[key]?.customized) {
    const blob = await idbGet(`site:${key}`)
    if (blob) return URL.createObjectURL(blob)
  }
  return slot.defaultUrl
}

export function isSiteImageCustomized(key) {
  const meta = loadSiteMeta()
  return !!meta[key]?.customized
}

export async function setSiteImage(key, file) {
  const { fullBlob } = await processImage(file, { maxWidth: 1920, quality: 0.85 })
  await idbSet(`site:${key}`, fullBlob)
  const meta = loadSiteMeta()
  meta[key] = { customized: true, updatedAt: new Date().toISOString() }
  saveSiteMeta(meta)
}

export async function restoreSiteImage(key) {
  await idbDel(`site:${key}`).catch(() => {})
  const meta = loadSiteMeta()
  delete meta[key]
  saveSiteMeta(meta)
}

/* --- Reset ------------------------------------------------------------ */

export async function reset() {
  try {
    localStorage.removeItem(PHOTO_META_KEY)
    localStorage.removeItem(CATS_KEY)
    localStorage.removeItem(SITE_META_KEY)
  } catch { /* ignore */ }
  try {
    const all = await idbKeys()
    for (const k of all) {
      if (typeof k === 'string' && (k.startsWith('photo:') || k.startsWith('site:'))) {
        await idbDel(k)
      }
    }
  } catch { /* ignore */ }
}

function stripExt(name) {
  return name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
}
