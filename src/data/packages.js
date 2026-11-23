// =========================================================================
// Packages — the single place to edit prices and what each package
// includes. Read by the Packages page, the booking pop-up, the /book page,
// the admin "Add booking" form and the slot calendar.
//
// Fields
//   id                 URL-safe id (used in /book?package=…)
//   name               display name; bookings store this name
//   amount             price in Ghana cedis (number) — booking totals,
//                      balances and payment maths all use this
//   price              display string, derived from `amount` below
//   duration           shown on the card
//   editedPhotos       number (or text like '300+') of edited photos
//   depositPercent     share of `amount` due to confirm the date
//   slots              2-hour calendar slots the shoot occupies (used when
//                      the admin slot settings don't list this package)
//   category           Portfolio category the photo comes from
//   portfolioPhotoId   Portfolio photo shown on the card (seed_… or an
//                      uploaded photo's id). Change the photo in Admin →
//                      Portfolio and the card follows.
//   photoSubject       optional: only Portfolio photos tagged with this
//                      `subject` (e.g. 'graduation') are used for the card
//                      and its thumbnails (none use it at the moment)
//   featured           true = "Most popular" (one package)
//   description        one line under the name
//   features           short list on the card
// =========================================================================

const CEDI = 'GH₵'

// "GH₵ 1,500"
export function formatCedis(amount) {
  return `${CEDI} ${Number(amount || 0).toLocaleString('en-GB')}`
}

const PACKAGE_LIST = [
  {
    id: 'portrait',
    name: 'Portrait session',
    amount: 800,
    duration: '1 hour',
    editedPhotos: 15,
    depositPercent: 50,
    slots: 1,
    category: 'Portrait',
    portfolioPhotoId: 'seed_9',
    description: 'Individual portraits for profiles, personal branding and milestones.',
    features: [
      '1 location',
      'Up to 2 outfit changes',
      'Online gallery delivery',
    ],
  },
  {
    id: 'event',
    name: 'Event coverage',
    amount: 3000,
    duration: '4 hours',
    editedPhotos: 150,
    depositPercent: 50,
    slots: 2,
    category: 'Event',
    portfolioPhotoId: 'seed_16',
    description: 'Birthdays, launches, parties and corporate events, covered start to finish.',
    features: [
      'Candid and posed coverage',
      'Sneak peek within 48 hours',
      'Online gallery delivery',
    ],
  },
  {
    id: 'wedding-standard',
    name: 'Wedding standard',
    amount: 6000,
    duration: 'Full day',
    editedPhotos: 300,
    depositPercent: 50,
    slots: 4,
    category: 'Wedding',
    portfolioPhotoId: 'seed_6',
    featured: true,
    description: 'Your wedding day from preparations to the first dance.',
    features: [
      'Full-day coverage',
      'Pre-wedding consultation',
      'Online gallery with print rights',
    ],
  },
  {
    id: 'wedding-premium',
    name: 'Wedding premium',
    amount: 10000,
    duration: 'Full day',
    editedPhotos: '300+',
    depositPercent: 50,
    slots: 4,
    category: 'Wedding',
    portfolioPhotoId: 'seed_5',
    description: 'Two photographers, a printed album and a short highlight film.',
    features: [
      'Two photographers',
      'Printed wedding album',
      'Short highlight film',
      'Online gallery with print rights',
    ],
  },
]

export const packages = PACKAGE_LIST.map((p) => ({
  ...p,
  price: formatCedis(p.amount),
  deposit: formatCedis(Math.round((p.amount * p.depositPercent) / 100)),
}))

export function findPackageByName(name) {
  return packages.find((p) => p.name === name) || null
}

// Earlier package names, kept so stored demo bookings can be moved onto
// the new packages (see the services' price refresh). 'family-graduation'
// was removed from the list; bookings already made on it keep their name
// and total, and take 1 calendar slot.
export const LEGACY_PACKAGE_IDS = {
  Essential: 'portrait',
  Standard: 'family-graduation',
  Premium: 'wedding-standard',
}
