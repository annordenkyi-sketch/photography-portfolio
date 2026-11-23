# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Clients in Ghana (primary):** people planning a shoot with an Accra-based photographer: couples planning a wedding, individuals wanting portraits, and people organising events (birthdays, launches, parties, corporate events). Their job on the site: see the work, compare packages and prices, then request a date or get in touch.
- **The photographer (admin):** runs the business from the admin area: bookings, calendar and slot availability, payments, notifications, portfolio photos, website images and the studio profile.
- **The site owner's client:** this site is built for a real photographer client and demoed to them; their final business name and email are still to be confirmed.

## Product Purpose

A photography business website with a working booking flow. It shows the photographer's work (Portfolio), publishes packages with clear Ghana-cedi prices (Packages), lets a visitor request a specific available date and time for a package, and offers a contact form. Behind it, an admin area manages the resulting bookings and payments.

Success: a visitor can go from seeing the work to a submitted booking request (or a message) without leaving the site or guessing at prices, and the photographer can run the business and update content without touching code.

## Positioning

An Accra-based photographer covering weddings, portraits, events and landscapes across Ghana, with prices shown up front ("From GH₵ …") and bookings made against the photographer's real calendar availability rather than an open enquiry form.

## Operating Context

- **Booking flow:** pick a package → pick an available date (calendar of 2-hour slots; working days Mon–Sat, 08:00–17:00 by default, set in admin) → pick a time → give name, phone, optional email, region and town, notes → submit a booking *request*. The photographer confirms within 48 hours; a 50% deposit confirms the date.
- **Payments:** recorded in admin against bookings (MoMo, cash, card); balances = package total minus payments.
- **Contact:** form with name, phone (with country code), email and message, posted to `/api/contact`; WhatsApp and click-to-call phone are the quick channels.
- **Location data:** Ghana's 16 regions plus town/area.
- **Currency and formats:** Ghana cedis shown as "GH₵ 1,500" (thousands separator); phone numbers in +233 format.

## Capabilities and Constraints

- **Stack (existing):** React 19 + Vite 8 + React Router 7, deployed on Netlify. Frontend-only prototype: data lives in the browser (localStorage, images in IndexedDB) behind service modules in `src/services/` whose function signatures are meant to stay when a backend replaces them. A Go backend is planned (`POST /api/contact`, `GET /api/packages`) but not built; the contact form queues messages locally when it is unreachable.
- **Public pages:** Home (`/home`), Portfolio (`/portfolio`, filterable by `?category=`; old `/gallery` links redirect), Packages (`/packages`, with the booking dialog), Contact (`/contact`), and a standalone `/book` page.
- **Admin:** dashboard, bookings, calendar, payments, notifications, portfolio (photos + "Website images" slots), settings (studio profile, demo-data reset).
- **Content sources of truth:** packages and prices in `src/data/packages.js`; portfolio categories in `src/data/portfolioCategories.js` (Wedding, Portrait, Event, Landscape); studio name, contact details and social handles in the studio profile (Admin → Settings); Home copy and testimonials in `src/data/homeContent.js`.
- **Terminology:** "Portfolio" (not "Gallery"), "Packages", "Book this package", "booking request", "Website images".
- **Open decisions:**
  - Final business name (`Perry Studios` is a stand-in).
  - Studio email address: shown as a placeholder until the client provides it.
  - Landscapes are a service the site sells, but there is no landscape package or price yet.
  - Deposit, rescheduling and delivery-time policies have no final wording (the placeholder FAQ was removed).
  - Backend implementation (Go is planned).

## Brand Commitments

- **Voice:** first person singular from the photographer ("I'll be in touch within 48 hours"), plain and warm.
- **Imagery:** real photographs only: the photographer's own work first, otherwise Unsplash/Pexels, credited in `src/assets/home/CREDITS.md`. No AI-generated images. Ghanaian/African subjects preferred where possible.
- **Booking path:** every "Book" call to action leads to Packages, where booking happens.
- **Admin area stays plain;** design work targets the public site.

## Evidence on Hand

- **Prices (confirmed final):** Portrait session GH₵ 800 (1 hour, 15 edited photos), Event coverage GH₵ 3,000 (4 hours, 150), Wedding standard GH₵ 6,000 (full day, 300, "Most popular"), Wedding premium GH₵ 10,000 (full day, two photographers, album, highlight film); 50% deposit. Source: `src/data/packages.js`.
- **Contact details (confirmed final):** phone/WhatsApp, Accra location and social handles (Instagram, Facebook, TikTok, YouTube) in the studio profile. Email is not yet provided.
- **Portfolio photos (confirmed by the owner as final):** 26 photos across Wedding, Portrait (including graduation), Event and Landscape, currently sourced from Unsplash and credited per photo in `src/assets/home/CREDITS.md`. Stock photos showing identifiable people come with no model release.
- **Testimonials (confirmed real):** four client reviews in `src/data/homeContent.js`.
- **Absences:** no press, awards, client logos or case studies; none may be invented.

## Product Principles

1. **Prices and availability are visible before commitment.** A visitor sees what a package costs and which dates are free before they share details.
2. **A booking is a request until the photographer confirms it.** Never imply instant confirmation; the 48-hour reply and the deposit are part of the promise.
3. **Only real proof.** Real photographs, real reviews, real figures; no fabricated work, testimonials or claims.
4. **The photographer can run it without code.** Content that changes (photos, website images, contact details, availability) stays editable from admin.
5. **One clear path to booking:** through Packages.

## Accessibility & Inclusion

- **Motion:** respect `prefers-reduced-motion` everywhere animation is used (fades only, no movement).
- **Phones:** must work fully at phone width with no horizontal scrolling. Clients often reach the site on phones; this is assumed, not measured.
- **Keyboard and screen readers:** full keyboard use, with focus moving into dialogs and returning to the trigger on close. Every image has alt text.
