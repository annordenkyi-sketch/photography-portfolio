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

// Seeded gallery photos — real photographs from Unsplash's CDN, served
// as compressed WebP via query params (?w=1200&q=80&fm=webp&auto=format
// &fit=crop for full image, same but w=480 for thumb). Chosen to be
// anonymous (silhouettes, back views, hands/detail shots, empty venues,
// landscapes) so no identifiable face appears. Attribution: every photo
// is credited in src/assets/home/CREDITS.md with photographer, Unsplash
// page URL, and license (Unsplash License — free for commercial use,
// attribution appreciated but not required).
//
// Admin can hide, feature, or add alongside. When new photos are
// uploaded they go into IndexedDB and sit beside these.
const u = (id, w) => `https://images.unsplash.com/${id}?w=${w}&q=80&fm=webp&auto=format&fit=crop`
const SEED_PHOTOS = [
  // --- Wedding (6) --------------------------------------------------
  { id: 'seed_1',  category: 'Wedding',   src: u('photo-1697059354929-731142fe2515', 1200), thumbSrc: u('photo-1697059354929-731142fe2515', 480), title: 'Wedding ring on a bouquet',              caption: 'Rings + flowers detail',       featured: true,  hidden: false, order: 1  },
  { id: 'seed_2',  category: 'Wedding',   src: u('photo-1758712508646-49eb3ced4e89', 1200), thumbSrc: u('photo-1758712508646-49eb3ced4e89', 480), title: 'Hands with wedding rings',               caption: 'Couple detail',                featured: false, hidden: false, order: 2  },
  { id: 'seed_3',  category: 'Wedding',   src: u('photo-1512101481582-ef0ef96bd7be', 1200), thumbSrc: u('photo-1512101481582-ef0ef96bd7be', 480), title: 'Bride walking on the shore',             caption: 'Beach ceremony',               featured: false, hidden: false, order: 3  },
  { id: 'seed_4',  category: 'Wedding',   src: u('photo-1562254609-151750be7f5a', 1200),    thumbSrc: u('photo-1562254609-151750be7f5a', 480),    title: 'Bride on the staircase',                 caption: 'Pre-ceremony moment',          featured: false, hidden: false, order: 4  },
  { id: 'seed_5',  category: 'Wedding',   src: u('photo-1728713351269-79d2e63926f2', 1200), thumbSrc: u('photo-1728713351269-79d2e63926f2', 480), title: 'Couple dancing in smoke',                 caption: 'Reception atmosphere',         featured: false, hidden: false, order: 5  },
  { id: 'seed_6',  category: 'Wedding',   src: u('photo-1623610641251-a3252bea79f6', 1200), thumbSrc: u('photo-1623610641251-a3252bea79f6', 480), title: 'Beach silhouette at sunset',             caption: 'Couple at golden hour',        featured: false, hidden: false, order: 6  },

  // --- Portrait (6) -------------------------------------------------
  { id: 'seed_7',  category: 'Portrait',  src: u('photo-1767130298927-2df12c33e5d6', 1200), thumbSrc: u('photo-1767130298927-2df12c33e5d6', 480), title: 'Portrait studio setup',                   caption: 'Studio with softbox lighting', featured: true,  hidden: false, order: 7  },
  { id: 'seed_8',  category: 'Portrait',  src: u('photo-1758825175271-168064c2004c', 1200), thumbSrc: u('photo-1758825175271-168064c2004c', 480), title: 'Hands holding the camera',                caption: 'Behind the lens',              featured: false, hidden: false, order: 8  },
  { id: 'seed_9',  category: 'Portrait',  src: u('photo-1760061398084-0ec65a992725', 1200), thumbSrc: u('photo-1760061398084-0ec65a992725', 480), title: 'Professional lens close-up',              caption: 'Shoot-day gear',               featured: false, hidden: false, order: 9  },
  { id: 'seed_10', category: 'Portrait',  src: u('flagged/photo-1576011276208-39d066a314ba', 1200), thumbSrc: u('flagged/photo-1576011276208-39d066a314ba', 480), title: 'Maternity shoot at sundown',       caption: 'Silhouette on the shore',      featured: false, hidden: false, order: 10 },
  { id: 'seed_11', category: 'Portrait',  src: u('photo-1453137494194-411b946480fe', 1200), thumbSrc: u('photo-1453137494194-411b946480fe', 480), title: 'Lens detail',                             caption: 'Session detail',               featured: false, hidden: false, order: 11 },
  { id: 'seed_12', category: 'Portrait',  src: u('photo-1659697067461-f9604d8f9898', 1200), thumbSrc: u('photo-1659697067461-f9604d8f9898', 480), title: 'Camera on dark backdrop',                 caption: 'Studio prep',                  featured: false, hidden: false, order: 12 },

  // --- Event (4) ----------------------------------------------------
  { id: 'seed_13', category: 'Event',     src: u('photo-1711733865005-8c0b2f1d4794', 1200), thumbSrc: u('photo-1711733865005-8c0b2f1d4794', 480), title: 'Empty auditorium ready for the event',    caption: 'Venue, before doors open',     featured: true,  hidden: false, order: 13 },
  { id: 'seed_14', category: 'Event',     src: u('photo-1625649611137-df49dc542f6a', 1200), thumbSrc: u('photo-1625649611137-df49dc542f6a', 480), title: 'Birthday cake with candles',              caption: 'Celebration detail',           featured: false, hidden: false, order: 14 },
  { id: 'seed_15', category: 'Event',     src: u('photo-1702763529935-f4f7b4df3380', 1200), thumbSrc: u('photo-1702763529935-f4f7b4df3380', 480), title: 'Conference venue before guests arrive',   caption: 'Corporate setup',              featured: false, hidden: false, order: 15 },
  { id: 'seed_16', category: 'Event',     src: u('photo-1760092189954-5b2f6eb3ca88', 1200), thumbSrc: u('photo-1760092189954-5b2f6eb3ca88', 480), title: 'Hands raised at the celebration',         caption: 'Crowd silhouette',             featured: false, hidden: false, order: 16 },

  // --- Landscape (5) ------------------------------------------------
  { id: 'seed_17', category: 'Landscape', src: u('photo-1776153381006-043d50ab44eb', 1200), thumbSrc: u('photo-1776153381006-043d50ab44eb', 480), title: 'Elmina fishing village',                  caption: 'Elmina, Ghana',                featured: true,  hidden: false, order: 17 },
  { id: 'seed_18', category: 'Landscape', src: u('photo-1562490654-3f78be490c66', 1200),    thumbSrc: u('photo-1562490654-3f78be490c66', 480),    title: 'Fishermen boat at Cape Coast',            caption: 'Cape Coast, Ghana',            featured: false, hidden: false, order: 18 },
  { id: 'seed_19', category: 'Landscape', src: u('photo-1568025848823-86404cd04ad1', 1200), thumbSrc: u('photo-1568025848823-86404cd04ad1', 480), title: 'Accra from the air',                      caption: 'Accra, Ghana',                 featured: false, hidden: false, order: 19 },
  { id: 'seed_20', category: 'Landscape', src: u('photo-1762222630690-20a58212af83', 1200), thumbSrc: u('photo-1762222630690-20a58212af83', 480), title: 'Golden-hour coastline',                   caption: 'Rocky coast at sunset',        featured: false, hidden: false, order: 20 },
  { id: 'seed_21', category: 'Landscape', src: u('photo-1771450092348-5f33e2cc2963', 1200), thumbSrc: u('photo-1771450092348-5f33e2cc2963', 480), title: 'City skyline at dusk',                    caption: 'Aerial dusk cityscape',        featured: false, hidden: false, order: 21 },
]

// Default website image slots (what the public site falls back to)
export const SITE_IMAGE_SLOTS = [
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
export async function uploadPhoto(file, { category = CATEGORY_LABELS[0], title = '', caption = '' } = {}) {
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
