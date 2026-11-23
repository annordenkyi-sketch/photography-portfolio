// =========================================================================
// One-time refresh of demo data saved in the browser after the package
// prices changed (src/data/packages.js). Without it, browsers that already
// stored bookings/payments would keep the old ₵250 / ₵500 / ₵950 figures.
//
// Each service calls refreshOnce() when it loads saved data. The fix runs
// once per storage key (tracked by `<key>:pricingRevision`); records the
// user created are kept, and later edits are never overwritten.
// Bump PRICING_REVISION if prices change again.
// =========================================================================
import { packages, LEGACY_PACKAGE_IDS, findPackageByName } from '../data/packages.js'

export const PRICING_REVISION = 1

export function refreshOnce(storageKey, value, fix) {
  const revKey = `${storageKey}:pricingRevision`
  try {
    if (Number(localStorage.getItem(revKey)) === PRICING_REVISION) return value
    const next = fix(value)
    localStorage.setItem(storageKey, JSON.stringify(next))
    localStorage.setItem(revKey, String(PRICING_REVISION))
    return next
  } catch {
    return value
  }
}

const legacyPackage = (name) => {
  const id = LEGACY_PACKAGE_IDS[name]
  return id ? packages.find((p) => p.id === id) || null : null
}

// Built-in demo bookings take their new package + total from the seed;
// bookings the user made on an old package move to its replacement.
export function refreshBookings(list, seed) {
  const seedById = new Map(seed.map((b) => [b.id, b]))
  return list.map((b) => {
    const s = seedById.get(b.id)
    if (s) return { ...b, package: s.package, totalAmount: s.totalAmount }
    const pkg = legacyPackage(b.package)
    return pkg ? { ...b, package: pkg.name, totalAmount: pkg.amount } : b
  })
}

// Built-in demo payments/notifications take their new amount/message.
export function refreshFromSeed(list, seed, fields) {
  const seedById = new Map(seed.map((r) => [r.id, r]))
  return list.map((r) => {
    const s = seedById.get(r.id)
    if (!s) return r
    const next = { ...r }
    for (const f of fields) next[f] = s[f]
    return next
  })
}

// Slot settings: key packageSlots by the current package names, keeping
// any counts the photographer already set; old names are dropped.
export function refreshSlotSettings(settings, defaults) {
  const stored = settings.packageSlots || {}
  const packageSlots = {}
  for (const p of packages) {
    packageSlots[p.name] = stored[p.name] ?? defaults.packageSlots?.[p.name] ?? p.slots ?? 1
  }
  for (const [name, count] of Object.entries(stored)) {
    if (!(name in packageSlots) && !LEGACY_PACKAGE_IDS[name]) packageSlots[name] = count
  }
  return { ...settings, packageSlots }
}

// Slot count for a package: admin settings first, then the package data.
export function fallbackSlotCount(packageName) {
  return findPackageByName(packageName)?.slots ?? legacyPackage(packageName)?.slots ?? 1
}
