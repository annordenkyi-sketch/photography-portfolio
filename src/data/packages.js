// Placeholder pricing. Replace with real packages when ready.
// `price` is the display string; `amount` is the numeric cedi value used by
// the admin side (payment calculations, booking totals). `deposit` is the
// up-front amount shown on the Packages card and expected at booking.
// `featured: true` marks the "Most popular" tier — toggled directly in
// this file for now; a future admin Content page can edit the same field.
export const packages = [
  {
    id: 'essential',
    name: 'Essential',
    price: '₵250',
    amount: 250,
    deposit: '₵75',
    duration: '2 hours',
    features: [
      'Up to 2 hours of coverage',
      '30 edited digital photos',
      'Online gallery delivery',
      '1 location',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '₵500',
    amount: 500,
    deposit: '₵150',
    duration: '4 hours',
    featured: true,
    features: [
      'Up to 4 hours of coverage',
      '80 edited digital photos',
      'Online gallery + print rights',
      'Up to 2 locations',
      'Pre-shoot consultation',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₵950',
    amount: 950,
    deposit: '₵300',
    duration: 'Full day',
    features: [
      'Full-day coverage (up to 8 hours)',
      '200+ edited digital photos',
      'Online gallery + print rights',
      'Unlimited locations',
      'Pre-shoot consultation',
      'Second photographer included',
    ],
  },
]
