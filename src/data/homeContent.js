// =========================================================================
// Content for the public Home page sections (About, Services, How Booking
// Works, Testimonials, CTA, Footer). All editable here — the Home page
// never hard-codes strings. Studio name, tagline, contact details and
// social handles come from the studio profile (Admin → Settings), NOT
// this file, so they're editable live without a code change.
// =========================================================================

export const homeContent = {
  hero: {
    eyebrow: 'Photography · Accra, Ghana',
    primaryCta: { label: 'Book a Session', to: '/packages' },
    secondaryCta: { label: 'View Portfolio', to: '/gallery' },
  },

  about: {
    headingPrefix: "Hi, I'm", // joined with first name of studio
    paragraphs: [
      "I'm a photographer based in Accra, working with couples, families, and brands who want images that feel honest a decade from now, not just today.",
      "My style sits between editorial and documentary: natural light where I can, considered composition, and a quiet eye for the moments between the posed ones.",
      "I shoot weddings, portraits, events, and landscape commissions across Ghana, with occasional travel to West Africa and beyond.",
    ],
    ctaLabel: "Let's work together",
    ctaTo: '/packages',
  },

  stats: [
    { number: '8+',   label: 'Years behind the lens' },
    { number: '240',  label: 'Shoots completed' },
    { number: '180',  label: 'Happy clients' },
    { number: '12',   label: 'Regions covered' },
  ],

  services: {
    heading: 'What I shoot',
    tagline: 'Pick the kind of work closest to yours — the gallery filters to match.',
    // `slug` references src/data/galleryCategories.js — the shared source of
    // truth. `displayLabel` can override the shared label if you want plural
    // phrasing on the Home card (e.g. "Weddings") while the gallery tab
    // stays "Wedding". The URL + filter always use the slug.
    items: [
      { slug: 'wedding',   displayLabel: 'Weddings',  description: 'Full-day coverage with second shooter options for ceremonies and receptions.' },
      { slug: 'portrait',  displayLabel: 'Portraits', description: 'Individuals, families, maternity, and headshots in studio or on location.' },
      { slug: 'event',     displayLabel: 'Events',    description: 'Corporate functions, launches, parties — candid plus formal group shots.' },
      { slug: 'landscape', displayLabel: 'Landscape', description: 'Branded landscape commissions, travel editorial, and location scouting.' },
    ],
  },

  howItWorks: {
    heading: 'How booking works',
    tagline: 'Three steps between first message and shoot day.',
    steps: [
      { number: 1, title: 'Choose a package', body: 'Browse the three tiers and pick the one closest to your shoot.' },
      { number: 2, title: 'Pick a date & time',  body: 'Select an available slot right in the booking form.' },
      { number: 3, title: 'Get confirmed',       body: "I'll reach out within 48 hours to lock in the details." },
    ],
  },

  testimonials: {
    heading: 'In their words',
    tagline: 'A few recent clients.',
    autoplayMs: 6500,
    items: [
      {
        id: 't1',
        quote: '[PLACEHOLDER] The whole experience was calm, considered, and the photos somehow feel more like us than our wedding video does.',
        name: '[PLACEHOLDER] Nana & Kofi',
        role: 'Wedding · La Palm Royal Beach',
      },
      {
        id: 't2',
        quote: '[PLACEHOLDER] Our team headshots finally match the quality of the work we do. Got the full gallery back inside a week.',
        name: '[PLACEHOLDER] Esi Agyemang',
        role: 'Corporate portraits · Osu',
      },
      {
        id: 't3',
        quote: '[PLACEHOLDER] Showed up early, directed us just enough, and sent sneak peeks the next day. Hiring again next Christmas.',
        name: '[PLACEHOLDER] Benjamin Osei',
        role: 'Family event · Kempinski',
      },
      {
        id: 't4',
        quote: '[PLACEHOLDER] I was so nervous and he put me completely at ease — the maternity shots are everything I hoped for.',
        name: '[PLACEHOLDER] Akosua Boateng',
        role: 'Maternity · Airport Residential',
      },
    ],
  },

  footer: {
    tagline: 'Photography across Accra and beyond.',
    quickLinks: [
      { label: 'Home',     to: '/home' },
      { label: 'Gallery',  to: '/gallery' },
      { label: 'Packages', to: '/packages' },
    ],
    smallPrint: 'Available for weddings, portraits, events, and editorial commissions.',
  },
}

/* --- Placeholders you need to replace before launch -------------------- */
export const PLACEHOLDERS = [
  'About — paragraphs (src/data/homeContent.js → about.paragraphs)',
  'Stats numbers (src/data/homeContent.js → stats)',
  'Services — category descriptions (src/data/homeContent.js → services.items)',
  'Testimonials — all 4 entries marked [PLACEHOLDER]',
  'Site image: About portrait  — upload in Admin → Portfolio → Website images → "About portrait"',
  'Site image: Final CTA cover  — upload in Admin → Portfolio → Website images → "Final CTA background"',
  'Studio profile: name, tagline, email, phone, address, social handles — Admin → Settings → Studio profile',
]
