# WaterWatch SJDM

> A bilingual (English/Tagalog) community water monitoring platform for **San Jose del Monte, Bulacan**.
> Residents can anonymously report water issues, track report status, view an interactive map of active issues,
> access a directory of water services, and find emergency contacts — all without creating an account.
> Admins manage reports, listings, and announcements through a dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19 + Tailwind CSS v4 + Radix UI |
| **Language** | TypeScript |
| **Map** | Leaflet + react-leaflet + MarkerCluster |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (admin only — email/password) |
| **File Storage** | Supabase Storage |
| **Error Tracking** | Sentry |
| **Captcha** | Cloudflare Turnstile |
| **Weather** | WeatherAPI.com (proxied) |
| **Dam Data** | PAGASA flood bulletin (scraped) |
| **Excel Export** | SheetJS (xlsx) |
| **Icons** | Lucide React |
| **Deployment** | Vercel |
| **PWA** | Custom manifest + install prompt |

---

## Features

### For Residents

- **Anonymous Water Issue Reporting** — 5-step guided form: select barangay, drop a pin on the map, choose issue type (no water, low pressure, dirty water, leak, pipe damage), pick your water provider (PrimeWater or Metro Pacific), add optional description and photo. No account or personal info required.

- **Interactive Water Map** — Real-time view of all active verified reports across SJDM's 44 barangays. Color-coded pins by issue type, clustered at zoom levels. Click any pin to see details: photo, description, provider, status, timestamp. Barangay boundary overlay included.

- **Report Tracking** — Every submission gets a unique Report ID (`SJDM-PRIME-XXXXX`). Enter it on the report page to check status at any time. Statuses: Submitted → Under Review → Approved (visible on map) → Resolved | Denied | Stale.

- **Report Reactivation** — If a resolved or stale issue returns, residents can reactivate their report (24-hour cooldown per report).

- **Assistance Directory** — Browse water refilling stations, private tanker services, water storages, and laundromats. Filter by barangay or category. Each listing shows contact info, operating hours, delivery availability, coverage area, estimated fees, and photos.

- **Business Claim Portal** — Water service business owners can submit their listing for admin approval. Includes captcha protection.

- **Emergency Contacts** — Categorized directory of water provider hotlines, government offices, and emergency services. Searchable.

- **Dam Level Widget** — Live Angat Dam water level display (scraped from PAGASA, 30-minute cache with fallback).

- **Rain Indicator** — Current rain probability and temperature for SJDM from WeatherAPI.com.

- **Announcements** — Official advisories and community announcements.

- **Bilingual (EN/TL)** — Full English ↔ Tagalog support with 489 translation pairs. Toggle instantly via header button.

- **PWA Ready** — Installable on mobile home screen. Works offline.

- **Bug Reporting** — In-app form accessible from any page.

### For Admins

- **Admin Dashboard** — Central panel to approve/deny reports, manage directory listings, emergency contacts, announcements, and business claims. All CRUD operations available.

- **Excel Export** — Download active reports as `.xlsx` (summary + detail sheets), filterable by provider.

- **Auto-Resolve** — Reports older than 7 days are automatically marked stale to keep the map current.

### Anti-Abuse

- **Fingerprint-based Rate Limiting** — Each anonymous user is identified by a hash of IP, browser, session, and canvas fingerprint. Rate limits are enforced per action (submit, resolve, reactivate, upload, etc.) and stored in the database.

- **One Active Report Per User** — Prevents duplicate submissions. Must wait for resolution before reporting a new issue.

- **Cloudflare Turnstile** — Optional captcha on report submission and business claims.

- **Photo Validation** — Magic-byte verification, 2MB max, JPEG/PNG/WebP only.

- **CSP & Security Headers** — Content Security Policy, HSTS, X-Frame-Options, and more applied via middleware.

- **Input Sanitization** — HTML stripping, event handler removal, length limits, enum validation on all inputs.

---

## Try It

**Website:** [sjdmwater.vercel.app](https://sjdmwater.vercel.app/)

Built for the residents of San Jose del Monte, Bulacan 🇵🇭
