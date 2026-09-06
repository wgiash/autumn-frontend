-- Autumn dashboard schema (The Brass Lantern, Stowe VT).
-- Plain Postgres DDL, re-runnable: every object is dropped first.
-- Money is stored as integer cents everywhere (value_cents, *_revenue_cents,
-- fee_cents, stays_booked_value_cents); the query layer converts to dollars.
--
-- Row Level Security is deliberately left DISABLED on all tables: this is a
-- public demo dataset with no per-user rows, read through a server-side
-- Postgres connection only (no client-side Supabase reads), so RLS policies
-- would add no protection here. A real multi-tenant deployment would enable
-- RLS and scope every table by hotel/account id.

drop table if exists bookings;
drop table if exists daily_metrics;
drop table if exists monthly_expectations;
drop table if exists weekly_forecast;
drop table if exists visibility_checks;
drop table if exists actions;
drop table if exists referral_categories;

-- One reservation. `category` is the per-booking guest-intent segment shown
-- in the "How direct guests found you" insight ("Searching by name" /
-- "Discovering Stowe" / "Seasonal offer"). It is recorded per booking, not
-- derived from `referral` alone, because a referral source (say, Google
-- Search) carries both branded and discovery intent; referral_categories
-- below holds the *default* segment the seed uses for a source.
create table bookings (
  id text primary key,
  guest text not null,
  city text not null,
  channel text not null,
  referral text not null,
  attributed boolean not null,
  windowed boolean not null,
  booked date not null,
  arrival date not null,
  nights int not null,
  guests int not null,
  room text not null,
  status text not null,
  device text not null,
  value_cents int not null,
  rate numeric not null,
  fee_cents int not null,
  days_ahead int not null,
  category text
);

create index bookings_booked_idx on bookings (booked);
create index bookings_arrival_idx on bookings (arrival);

-- One row per day: ad impressions, site visits, and the day's direct
-- (website) bookings and their revenue. 730 days of history.
create table daily_metrics (
  date date primary key,
  ad_views int not null,
  visits int not null,
  direct_bookings int not null,
  direct_revenue_cents int not null
);

-- What each month was expected to bring in, set before the month began.
-- The dashboard's "next month expected" legend reads the following month's
-- row. stays_booked_* describe stays already reserved for that month at the
-- time the expectation was set.
create table monthly_expectations (
  month date primary key, -- first of the month
  expected_ad_views int not null,
  expected_visits int not null,
  expected_bookings int not null,
  expected_revenue_cents int not null,
  stays_booked_count int not null,
  stays_booked_value_cents int not null
);

-- Expected direct revenue per upcoming week (the chart's dotted tail).
create table weekly_forecast (
  week_start date primary key, -- Monday
  expected_revenue_cents int not null
);

-- Monthly search/AI/SEO check results ("8 of 12 tracked searches", ...).
create table visibility_checks (
  month date not null, -- first of the month
  key text not null,   -- 'google' | 'ai' | 'seo'
  value int not null,
  of_total int not null,
  note text not null,
  primary key (month, key)
);

-- Autumn's action feed: planned queue and completed work, per report month.
create table actions (
  id serial primary key,
  month date not null,     -- the report month the item belongs to
  planned boolean not null,
  verb text not null,
  text text not null,
  so text,
  detail jsonb,
  result_text text,
  result_kind text,
  status text,
  action_date date not null
);

create index actions_month_idx on actions (month);

-- Default guest-intent segment for each referral source; the seed uses it
-- for generated months (August's canonical bookings carry recorded
-- per-booking segments instead — see bookings.category above).
create table referral_categories (
  referral text primary key,
  category text not null
);
