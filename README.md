# WaterWatch SJDM

A community water monitoring platform for San Jose del Monte, Bulacan. Residents can anonymously report water supply issues, track the status of their reports, and find alternative water services during interruptions.

**No account required.** Built for the SJDM community.

---

## Features

### For Residents
- **Submit a Water Report** — GPS-verified, anonymous reporting with photo evidence. Select your barangay, issue type, and water provider. No sign-up needed.
- **Interactive Water Map** — View all verified reports across 40 barangays on an OpenStreetMap. Filter by barangay, issue type, and water provider.
- **Community Confirmation** — Click "I have this too" to confirm issues in your area. More confirmations = higher confidence.
- **Track a Report** — Enter your Report ID (e.g. `SJDM-WATER-00042`) to check status, see confirmations, and mark resolved.
- **Mark as Resolved** — Let the community know when water is back.
- **Report Reactivation** — If an inactive or resolved issue returns, submit a new report at the same location (auto-reactivates) or use your Report ID.
- **Services Directory** — Find water refilling stations, delivery services, tankers, and laundry services during interruptions.
- **Emergency Contacts** — Water provider hotlines, government offices, and emergency numbers.
- **Announcements** — Official and community advisories.

### For Admins
- **Report Moderation** — Approve or deny submissions with optional denial reasons.
- **Multi-tab Dashboard** — New, Approved, Resolved, and Denied report views with search and provider filters.
- **Export to Excel** — Export approved reports by provider for forwarding to water companies.
- **Service Directory Management** — Add and verify business listings.
- **Claims Management** — Review and approve community-submitted business listings.
- **Bug Report Viewer** — View bug reports submitted by users.
- **Role-based Access** — Supabase Auth with admin role enforcement.

---

## Report Status Lifecycle

```
NEW REPORT
    |
    v
[Submitted]  ← initial state, not visible on map
    |     \
    |      \ (admin deny with reason)
    |       v
    |      [Denied]  ← rejected, not visible
    |
    | (admin approve)
    v
[Approved]  ← visible on public map
    |
    | (user marks resolved or auto-stale)
    v
[Resolved] / [Inactive]  ← water back OR 7 days no activity
    |
    | (new report nearby / manual reactivate / community confirmation)
    v
[Under Review]  ← back in queue for re-approval
```

### Statuses

| Status | Meaning | Visible on Map |
|---|---|---|
| Submitted | New report, not yet reviewed | No |
| Under Review | Reactivated, pending re-approval | No |
| Approved | Admin reviewed and verified | Yes |
| Denied | Admin rejected (reason shown) | No |
| Community Confirmed | Has enough confirmations | Yes |
| Resolved | Issue fixed (user-marked) | Yes |
| Inactive (Stale) | No activity for 7 days | Yes (marked inactive) |

---

## Rate Limits

| Action | Limit | Window |
|---|---|---|
| Submit report | 3 | Per hour |
| Confirm report | 10 | Per hour |
| Mark resolved | 3 | Per hour |
| Reactivate per report | 1 | Per 24 hours |
| Submit business claim | 2 | Per 24 hours |
| Submit bug report | 5 | Per 24 hours |

Rate limits are tracked by `IP:sessionID`.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth (email/password for admins)
- **Storage:** Supabase Storage (report photos)
- **Maps:** Leaflet + OpenStreetMap (react-leaflet)
- **UI:** Tailwind CSS + shadcn/ui + Radix UI
- **CAPTCHA:** Cloudflare Turnstile
- **Export:** xlsx (SheetJS)
- **PWA:** Service worker with offline support
- **Security:** Row Level Security (RLS), CSP headers, XSS sanitization

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project (free tier works)
- Cloudflare Turnstile site key (optional)

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key  # optional
TURNSTILE_SECRET_KEY=your-turnstile-secret-key           # optional
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Setup

Run migrations in order:

1. `supabase/migrations/20260101000000_initial_schema.sql` — Core tables
2. `supabase/migrations/20260102000000_anti_spam.sql` — Rate limiting
3. `supabase/migrations/20260103000000_confirmations_claims.sql` — Confirmations + business claims
4. `supabase/migrations/20260104000000_auto_resolve.sql` — Auto-stale logic
5. `supabase/migrations/20260722000000_water_provider.sql` — Water provider field
6. `supabase/migrations/20260722000001_verified_reports.sql` — Verified flag
7. `supabase/migrations/20260722000002_business_photos.sql` — Business photos
8. `supabase/migrations/20260722000003_report_denied.sql` — Deny flow
9. `supabase/migrations/20260722000004_stale_status.sql` — Stale status + reactivation trigger
10. `supabase/migrations/20260722000005_bug_reports.sql` — Bug report table

Or run the combined schema:
```sql
-- supabase/migrations/full_schema.sql
```

### Seed Data (Optional)

```bash
# Using Supabase SQL Editor or CLI:
# Run supabase/seed_test_data.sql
```

Creates 30 sample reports across various barangays, statuses, and providers.

### Create Admin Account

1. Sign up via Supabase Auth on `/admin/login`
2. Manually set `role = 'admin'` in the `profiles` table

---

## Project Structure

```
src/
├── app/                       # Next.js App Router pages & API routes
│   ├── admin/                 # Admin dashboard & login
│   ├── api/                   # REST API routes
│   │   ├── admin/             # Admin-only endpoints
│   │   ├── bug-reports/       # Bug report submission
│   │   ├── reports/           # Report CRUD, reactivate, resolve
│   │   └── ...
│   ├── directory/             # Services directory & claim page
│   ├── map/                   # Interactive water map
│   ├── report/                # Report submission & tracking
│   └── ...
├── components/
│   ├── admin/                 # Admin dashboard component
│   ├── layout/                # Header, footer, disclaimer popover
│   ├── map/                   # Water map & auto-resolve trigger
│   ├── reports/               # Report form, confirm, resolve, reactivate
│   └── ui/                    # shadcn/ui components
└── lib/
    ├── constants.ts           # Barangays, issue types, status labels
    ├── types.ts               # TypeScript type definitions
    ├── rate-limit.ts          # Rate limiting utilities
    ├── sanitize.ts            # XSS sanitization
    ├── utils.ts               # Date formatting, confidence levels
    └── supabase/              # Supabase client (browser, server, admin)
```

---

## How Reports Reach Water Providers

1. Residents submit reports → admin reviews and approves
2. Admin exports approved reports to Excel (filtered by provider)
3. Excel file is manually sent to the respective water provider's email/contact
4. This platform is **not an official reporting channel** — reports are forwarded on a best-effort basis

---

## Privacy

- Reports are **completely anonymous** — no account required
- **Exact addresses are never stored or shown** — only approximate GPS coordinates
- A session cookie is used for rate limiting only
- No tracking, no analytics, no third-party scripts

---

## Disclaimer

WaterWatch SJDM is an **independent community platform**. It is **not affiliated** with:
- PrimeWater Infrastructure Corp.
- Metro Pacific Bulacan Water
- The City Government of San Jose del Monte
- Any government agency

See `/disclaimer` for the full legal notice.

---

## Built By

An SJDM programmer citizen.

---

## License

This project is open source. Use it, modify it, improve it — just give credit where due.
