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
npm run verify              # checks an already populated demo database
npm run dev
```

`.env.local` needs a Postgres `DATABASE_URL` (Supabase → Connect → Direct
connection) plus the project's `NEXT_PUBLIC_SUPABASE_URL` and publishable
key. The app reads only through `DATABASE_URL`.

For an existing database, `npm run db:secure` applies the non-destructive
client-permissions migration. It does not reset or reseed records.

## Data model

Seven tables (`supabase/schema.sql`): `bookings` (every reservation —
guest, city, channel, referral, attribution, stay dates, value and fee in
integer cents), `daily_metrics` (730 days of ad views, visits, direct
bookings and revenue), `monthly_expectations`, `weekly_forecast`,
`visibility_checks`, `actions` (the work Autumn did each month), and
`referral_categories`. Dates are `DATE` columns — hotel-local calendar
days, no timezone arithmetic; money is integer cents everywhere.

## Seeding

Only reset a disposable demo database. Set `AUTUMN_DEMO_PROJECT_REF` in
`.env.local` to that project's exact reference, then explicitly confirm:

```bash
npm run db:push -- --confirm-demo-reset
npm run seed -- --confirm-demo-reset
npm run verify
```

Both reset commands refuse `NODE_ENV=production`, a missing confirmation,
or a database connection belonging to another project. `db:push` replaces
the schema in one transaction; `seed` replaces all seven tables' records
in one transaction. A failed seed restores the previous records. The two
commands are separate transactions, so do not use them to migrate an
existing database with data you need to keep.

`scripts/seed.ts` is fully deterministic (seeded PRNG, fixed seed): every
run reproduces the identical database. The data is shaped, not random —
Stowe seasonality (foliage peak, summer weekends, mud-season trough),
weekday/weekend rhythm, and a direct-booking share that climbs after
Autumn's onboarding, which is the story the dashboard exists to tell.
Prior-year rows are reconstructed so year-over-year comparisons join on
real data. `scripts/verify-seed.ts` then proves the seed through the same
query layer the pages use — 47 assertions covering totals, per-channel
fees, histograms, chart weeks, and per-month coverage.

`scripts/verify-backend.ts` also reconciles all 12 calendar-month reports
against booking records and daily metrics, checks missing-history and
forecast behavior, and verifies RLS and client grants. Its rollback test
uses temporary tables inside one transaction, never live records.

Run `npm test`, `npm run typecheck`, and `npm run lint` for local checks.
`npm run test:e2e` runs the Playwright desktop, tablet, and phone suite.

## How it fetches

Pages are async server components: they read `?month=` from the URL,
validate it against the months that exist in the database, and fetch one
`MonthData` (`src/lib/queries.ts`, typed by `src/lib/contracts.ts`) that
threads down as props. The month stepper in the nav drives the URL, so
every screen is shareable and provably database-fed. The trend chart is
generated at render from the month's weekly series
(`src/lib/chart-gen.ts`); `/api/report/[month]` streams the month's
bookings as CSV.

Monthly KPIs use calendar dates, matching the booking list and CSV export.
Chart observations use Monday-starting weeks, grouped by Thursday's month;
weeks that cross a month boundary are not calendar-month totals. Missing
or incomplete prior-year history is unavailable, not zero. Weekly forecasts
distribute the stored next-month expectation and reconcile to that total.
CSV text cells neutralize spreadsheet formula prefixes and quote embedded
commas, quotes, and line breaks.

## Decisions worth knowing

- **Single property, no auth** — the brief's user is one owner-operator;
  a login would be surface without substance. This is intentionally public
  demo data, not a private guest-data deployment. RLS is enabled on all
  seven tables, and `anon` / `authenticated` have no direct table or
  sequence access. Reads go through the server-side database connection.
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
