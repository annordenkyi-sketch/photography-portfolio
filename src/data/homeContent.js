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
    secondaryCta: { label: 'View Portfolio', to: '/portfolio' },
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


  testimonials: {
    heading: 'In their words',
    tagline: 'A few recent clients.',
    autoplayMs: 6500,
    // Each testimonial pairs a quote with an anonymous (face-less) stock
    // image that matches the shoot type. The reviews themselves are
    // placeholders — see [PLACEHOLDER] markers — so we deliberately avoid
    // showing identifiable faces that would read as "this specific stranger
    // said this review." Images are served via Unsplash's CDN as compressed
    // 800×800 WebP (?w=800&h=800&q=80&fm=webp&auto=format&fit=crop) and
    // credited in src/assets/home/CREDITS.md.
    items: [
      {
        id: 't1',
        quote: ' The whole experience was calm, considered, and the photos somehow feel more like us than our wedding video does.',
        name: ' Nana & Kofi',
        role: 'Wedding · La Palm Royal Beach',
        image: 'https://images.unsplash.com/photo-1753996297177-a852d17fb202?w=800&h=800&q=80&fm=webp&auto=format&fit=crop',
        imageAlt: 'Silhouette of a couple at the beach during sunset.',
      },
      {
        id: 't2',
        quote: ' Our team headshots finally match the quality of the work we do. Got the full gallery back inside a week.',
        name: ' Esi Agyemang',
        role: 'Corporate portraits · Osu',
        image: 'https://images.unsplash.com/photo-1639161863028-1b3979c6001a?w=800&h=800&q=80&fm=webp&auto=format&fit=crop',
        imageAlt: 'Close-up of hands tying a necktie against a suit — a corporate portrait session detail.',
      },
      {
        id: 't3',
        quote: 'Showed up early, directed us just enough, and sent sneak peeks the next day. Hiring again next Christmas.',
        name: 'Benjamin Osei',
        role: 'Family event · Kempinski',
        image: 'https://images.unsplash.com/photo-1746739802530-b490abdfc8e6?w=800&h=800&q=80&fm=webp&auto=format&fit=crop',
        imageAlt: 'An elegant banquet hall decorated for a formal event, with set tables and warm lighting.',
      },
      {
        id: 't4',
        quote: 'I was so nervous and he put me completely at ease — the maternity shots are everything I hoped for.',
        name: ' Akosua Boateng',
        role: 'Maternity · Airport Residential',
        // Same photo as portfolio seed_10 ("Maternity shoot at sundown").
        image: 'https://images.unsplash.com/flagged/photo-1576011276208-39d066a314ba?w=800&h=800&q=80&fm=webp&auto=format&fit=crop',
        imageAlt: 'Silhouette of a pregnant woman standing on the shore at dusk.',
      },
    ],
  },

  footer: {
    tagline: 'Photography across Accra and beyond.',
    quickLinks: [
      { label: 'Home',     to: '/home' },
      { label: 'Portfolio', to: '/portfolio' },
      { label: 'Packages', to: '/packages' },
    ],
    smallPrint: 'Available for weddings, portraits, events, and editorial commissions.',
  },
}

/* --- Placeholders you need to replace before launch -------------------- */
export const PLACEHOLDERS = [
  'About — paragraphs (src/data/homeContent.js → about.paragraphs)',
  'Stats numbers (src/data/homeContent.js → stats)',
  'Testimonials — all 4 entries marked [PLACEHOLDER]',
  'Site image: About portrait  — upload in Admin → Portfolio → Website images → "About portrait"',
  'Site image: Final CTA cover  — upload in Admin → Portfolio → Website images → "Final CTA background"',
  'Studio profile: name, tagline, email, phone, address, social handles — Admin → Settings → Studio profile',
]
