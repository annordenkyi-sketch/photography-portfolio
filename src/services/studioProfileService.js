// =========================================================================
// Studio profile — the business-level info shown across the public site
// and in receipts: name, tagline, contact details, physical address, and
// social links. Edited from Admin → Settings. Persists to localStorage.
// =========================================================================

const STORAGE_KEY = 'demo:studioProfile'
const CHANGED_EVENT = 'perry:studio-profile-updated'

export const DEFAULT_PROFILE = {
  name: 'Perry Studios',
  tagline: 'Weddings · Portraits · Events · Landscapes',
  email: 'hello@perrystudios.com',
  phone: '+233 20 000 0000',
  address: 'Accra, Ghana',
  website: 'perrystudios.com',
  instagram: '@perry.studios',
  facebook: 'perrystudios',
  tiktok: '@perry.studios',
  youtube: '@perrystudios',
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch { /* fall through */ }
  return DEFAULT_PROFILE
}

export function updateProfile(patch) {
  const next = { ...getProfile(), ...patch }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: next })) } catch { /* non-browser */ }
  return next
}

export function reset() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: DEFAULT_PROFILE })) } catch { /* ignore */ }
}

export const CHANGED_EVENT_NAME = CHANGED_EVENT
