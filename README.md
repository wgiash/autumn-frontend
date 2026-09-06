# Autumn — marketing dashboard

A calm, hospitality-native marketing dashboard for The Brass Lantern, an
independent inn in Stowe, VT. Two connected screens: the **Overview**
answers "is Autumn getting me more direct bookings and revenue?" at a
glance; **Bookings** is the connected detail screen — every reservation
behind those numbers, with filters, sorting, and fee/stay/guest insights.

Built with Next.js (App Router, React server components), Tailwind CSS v4,
Motion, and a hosted **Supabase Postgres** the pages actually query.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in your values (see below)
npm run db:push              # applies supabase/schema.sql
npm run seed                 # 730 days of deterministic data
npm run verify               # 47 assertions against the live DB
npm run dev
```

`.env.local` needs a Postgres `DATABASE_URL` (Supabase → Connect → Direct
connection) plus the project's `NEXT_PUBLIC_SUPABASE_URL` and publishable
key. The app reads only through `DATABASE_URL`.

## Data model

Seven tables (`supabase/schema.sql`): `bookings` (every reservation —
guest, city, channel, referral, attribution, stay dates, value and fee in
integer cents), `daily_metrics` (730 days of ad views, visits, direct
bookings and revenue), `monthly_expectations`, `weekly_forecast`,
`visibility_checks`, `actions` (the work Autumn did each month), and
`referral_categories`. Dates are `DATE` columns — hotel-local calendar
days, no timezone arithmetic; money is integer cents everywhere.

## Seeding

`scripts/seed.ts` is fully deterministic (seeded PRNG, fixed seed): every
run reproduces the identical database. The data is shaped, not random —
Stowe seasonality (foliage peak, summer weekends, mud-season trough),
weekday/weekend rhythm, and a direct-booking share that climbs after
Autumn's onboarding, which is the story the dashboard exists to tell.
Prior-year rows are reconstructed so year-over-year comparisons join on
real data. `scripts/verify-seed.ts` then proves the seed through the same
query layer the pages use — 47 assertions covering totals, per-channel
fees, histograms, chart weeks, and per-month coverage.

## How it fetches

Pages are async server components: they read `?month=` from the URL,
validate it against the months that exist in the database, and fetch one
`MonthData` (`src/lib/queries.ts`, typed by `src/lib/contracts.ts`) that
threads down as props. The month stepper in the nav drives the URL, so
every screen is shareable and provably database-fed. The trend chart is
generated at render from the month's weekly series
(`src/lib/chart-gen.ts`); `/api/report/[month]` streams the month's
bookings as CSV.

## Decisions worth knowing

- **Single property, no auth** — the brief's user is one owner-operator;
  a login would be surface without substance. RLS is deliberately off:
  demo data, nothing private.
- **Native scroll, no chart library** — tables are tools; the chart is
  hand-generated SVG so its motion, tooltips, and paper texture belong to
  the design system instead of a library's.
- **Skeletons only where data lands**, sized to the real layout, with the
  real headings kept as text.
- **Reduced motion** is respected across every animation.

## With more time

Campaign-level attribution as a third drill-down, real GA4/ads ingestion
behind the same `daily_metrics` shape, per-property multi-tenancy (the
schema is one `property_id` away), and alerting when a week's direct
share drops below its seasonal band.
