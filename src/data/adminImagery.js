// Admin-area imagery (login slideshow, dashboard welcome banner, etc.).
// Reuses picsum.photos seeded URLs for the prototype so the demo works
// without any file assets committed. Swap for local WebP files from
// /src/assets/admin when the real portfolio is ready — see
// /src/assets/admin/CREDITS.md.

function pic(seed, w = 1920, h = 1080) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

export const LOGIN_SLIDESHOW = [
  { src: pic('perry-login-wedding'),   alt: 'Bride and groom portrait', category: 'Weddings' },
  { src: pic('perry-login-portrait'),  alt: 'Studio portrait session',  category: 'Portraits' },
  { src: pic('perry-login-event'),     alt: 'Candid event moment',      category: 'Events' },
  { src: pic('perry-login-landscape'), alt: 'Coastal landscape',        category: 'Landscapes' },
  { src: pic('perry-login-camera'),    alt: 'Studio camera setup',      category: 'Behind the lens' },
]

export const DASHBOARD_WELCOME_IMAGE = {
  src: pic('perry-dashboard-welcome', 1920, 600),
  alt: '',
}
