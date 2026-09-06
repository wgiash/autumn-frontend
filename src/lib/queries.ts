/* The query layer: implements the contract in src/lib/contracts.ts against
   the seeded Postgres database. Aggregation happens in SQL (GROUP BYs,
   filtered sums, percentiles); TypeScript only shapes rows, converts cents
   to dollars, and precomputes display labels.

   Week semantics: a week is a Monday-started ISO week, and it belongs to
   the month its Thursday falls in — so August 2026 is the four weeks
   Aug 3 – Aug 30, matching the canonical dashboard figures. Year-over-year
   comparisons join each week to the week 364 days earlier. */
import { cache } from "react";
import type { Booking } from "@/components/bookings/model";
import type {
  ActionItem,
  ActionsData,
  InsightsData,
  LegendDatum,
  MonthData,
  MonthKey,
  MonthOption,
  OutcomeData,
  StageDatum,
  TrendData,
  VisibilityCheck,
  WeekDatum,
} from "@/lib/contracts";
import { getSql } from "@/lib/db";

/* ── date helpers (UTC, ISO strings) ── */
const DAY = 86400000;
const ts = (iso: string) => Date.parse(iso + "T00:00:00Z");
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => toIso(ts(iso) + n * DAY);
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthShort = (iso: string) => MONTHS_SHORT[Number(iso.slice(5, 7)) - 1];
const dayOfMonth = (iso: string) => Number(iso.slice(8, 10));
const dayLabel = (iso: string) => `${monthShort(iso)} ${dayOfMonth(iso)}`;
const monthLabel = (month: MonthKey) => `${MONTHS_LONG[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;

/* first day of the month after `month` ("2026-08" -> "2026-09-01") */
function nextMonthFirst(month: string) {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

/* the Mondays of the weeks belonging to a month (week month = Thursday's month) */
function mondaysOfMonth(month: string): string[] {
  const mondays: string[] = [];
  for (let d = ts(`${month}-01`) - 6 * DAY, end = ts(nextMonthFirst(month)); d < end; d += DAY) {
    const iso = toIso(d);
    if (new Date(d).getUTCDay() === 1 && addDays(iso, 3).slice(0, 7) === month) mondays.push(iso);
  }
  return mondays;
}

function assertMonthKey(month: string): asserts month is MonthKey {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error(`invalid month key: ${month}`);
}

/* "Aug 10–12" within a month, "Sep 29 – Oct 1" across months */
function stayLabel(arrival: string, nights: number) {
  const departure = addDays(arrival, nights);
  return arrival.slice(0, 7) === departure.slice(0, 7)
    ? `${monthShort(arrival)} ${dayOfMonth(arrival)}–${dayOfMonth(departure)}`
    : `${dayLabel(arrival)} – ${dayLabel(departure)}`;
}

const pctDelta = (cur: number, prior: number) => (prior > 0 ? Math.round((cur / prior - 1) * 100) : 0);

/* ═══════════════ the contract surface ═══════════════ */

export const getAvailableMonths = cache(async (): Promise<MonthOption[]> => {
  const sql = getSql();
  const rows = await sql<{ m: string }[]>`
    select to_char(date_trunc('month', booked), 'YYYY-MM') as m
    from bookings group by 1 order by 1 desc limit 12`;
  return rows
    .map((r) => r.m as MonthKey)
    .reverse()
    .map((m) => ({ value: m, label: monthLabel(m) }));
});

export const getMonthData = cache(async (month: MonthKey): Promise<MonthData> => {
  assertMonthKey(month);
  const sql = getSql();
  const first = `${month}-01`;
  const nextFirst = nextMonthFirst(month);
  const monthMondays = mondaysOfMonth(month);
  const lastWeek = monthMondays[monthMondays.length - 1];
  const firstWeek = addDays(lastWeek, -357); // 52 weeks ending with the month's last week

  const [weekRows, forecastRows, expectedRows, outcomeRows, visibilityRows, actionRows, bookingRows, channelRows, stayRows, aheadRows, nightRows, cityRows, foundRows, deviceRows, reviewRows] =
    await Promise.all([
      sql<{
        start: string; ad_views: number; visits: number; bookings: number; rev_cents: number;
        prior_ad_views: number; prior_visits: number; prior_bookings: number; prior_rev_cents: number;
      }[]>`
        with weekly as (
          select (date_trunc('week', date))::date as start,
                 sum(ad_views)::int as ad_views,
                 sum(visits)::int as visits,
                 sum(direct_bookings)::int as bookings,
                 sum(direct_revenue_cents)::int as rev_cents
          from daily_metrics
          group by 1
        )
        select w.start::text as start, w.ad_views, w.visits, w.bookings, w.rev_cents,
               coalesce(p.ad_views, 0)::int as prior_ad_views,
               coalesce(p.visits, 0)::int as prior_visits,
               coalesce(p.bookings, 0)::int as prior_bookings,
               coalesce(p.rev_cents, 0)::int as prior_rev_cents
        from weekly w
        left join weekly p on p.start = w.start - 364
        where w.start >= ${firstWeek} and w.start <= ${lastWeek}
        order by w.start`,
      sql<{ start: string; rev_cents: number }[]>`
        select week_start::text as start, expected_revenue_cents as rev_cents
        from weekly_forecast where week_start > ${lastWeek}
        order by week_start limit 4`,
      sql<{ ad: number; vis: number; book: number; rev: number; stays: number; stays_value: number }[]>`
        select expected_ad_views as ad, expected_visits as vis, expected_bookings as book,
               expected_revenue_cents as rev, stays_booked_count as stays,
               stays_booked_value_cents as stays_value
        from monthly_expectations where month = ${nextFirst}`,
      sql<{
        total_count: number; direct_count: number; direct_value: number;
        attributed_count: number; attributed_value: number; attributed_fees: number;
      }[]>`
        select count(*)::int as total_count,
               count(*) filter (where channel = 'Your website')::int as direct_count,
               coalesce(sum(value_cents) filter (where channel = 'Your website'), 0)::int as direct_value,
               count(*) filter (where attributed)::int as attributed_count,
               coalesce(sum(value_cents) filter (where attributed), 0)::int as attributed_value,
               coalesce(sum(fee_cents) filter (where attributed), 0)::int as attributed_fees
        from bookings where booked >= ${first} and booked < ${nextFirst}`,
      sql<{ key: VisibilityCheck["key"]; value: number; of_total: number; note: string }[]>`
        select key, value, of_total, note from visibility_checks where month = ${first}`,
      sql<{
        planned: boolean; verb: string; text: string; so: string | null;
        detail: ActionItem["detail"] | null; result_text: string | null;
        result_kind: string | null; status: string | null; action_date: string;
      }[]>`
        select planned, verb, text, so, detail, result_text, result_kind, status,
               action_date::text as action_date
        from actions where month = ${first}
        order by action_date`,
      sql<{
        id: string; guest: string; city: string; channel: Booking["channel"]; referral: string;
        attributed: boolean; windowed: boolean; booked: string; arrival: string; nights: number;
        guests: number; room: string; status: string; device: string; value_cents: number;
        rate: number; fee_cents: number; days_ahead: number;
      }[]>`
        select id, guest, city, channel, referral, attributed, windowed,
               booked::text as booked, arrival::text as arrival, nights, guests, room, status,
               device, value_cents, rate::float8 as rate, fee_cents, days_ahead
        from bookings where booked >= ${first} and booked < ${nextFirst}
        order by booked, id`,
      sql<{ channel: string; n: number; value: number; fee: number }[]>`
        select channel, count(*)::int as n, sum(value_cents)::int as value, sum(fee_cents)::int as fee
        from bookings where booked >= ${first} and booked < ${nextFirst}
        group by channel`,
      sql<{ median_lead: number; avg_nights: number; avg_value: number; total_nights: number; total: number }[]>`
        select coalesce(percentile_cont(0.5) within group (order by days_ahead), 0)::float8 as median_lead,
               coalesce(avg(nights), 0)::float8 as avg_nights,
               coalesce(avg(value_cents), 0)::float8 as avg_value,
               coalesce(sum(nights), 0)::int as total_nights,
               count(*)::int as total
        from bookings where booked >= ${first} and booked < ${nextFirst}`,
      sql<{ bucket: number; n: number }[]>`
        select width_bucket(days_ahead, array[8, 15, 22, 31, 46, 61])::int as bucket, count(*)::int as n
        from bookings where booked >= ${first} and booked < ${nextFirst}
        group by 1`,
      sql<{ nights: number; n: number }[]>`
        select nights, count(*)::int as n
        from bookings where booked >= ${first} and booked < ${nextFirst}
        group by nights`,
      sql<{ city: string; n: number; value: number }[]>`
        select city, count(*)::int as n, sum(value_cents)::int as value
        from bookings where booked >= ${first} and booked < ${nextFirst} and channel = 'Your website'
        group by city`,
      sql<{ category: string | null; n: number; value: number }[]>`
        select category, count(*)::int as n, sum(value_cents)::int as value
        from bookings where booked >= ${first} and booked < ${nextFirst} and channel = 'Your website'
        group by category
        order by n desc, value desc`,
      sql<{ device: string; n: number; value: number }[]>`
        select device, count(*)::int as n, sum(value_cents)::int as value
        from bookings where booked >= ${first} and booked < ${nextFirst} and channel = 'Your website'
        group by device
        order by n desc, value desc`,
      sql<{ n: number }[]>`
        select count(*)::int as n
        from bookings where booked >= ${first} and booked < ${nextFirst}
          and channel = 'Your website' and referral = 'Not recorded'`,
    ]);

  /* ── trend ── */
  const monthWeekSet = new Set(monthMondays);
  const monthWeeks = weekRows.filter((w) => monthWeekSet.has(w.start));
  const sum = (f: (w: (typeof weekRows)[number]) => number) => monthWeeks.reduce((t, w) => t + f(w), 0);
  const cur = {
    seen: sum((w) => w.ad_views),
    visited: sum((w) => w.visits),
    booked: sum((w) => w.bookings),
    revenue: sum((w) => w.rev_cents) / 100,
  };
  const prior = {
    seen: sum((w) => w.prior_ad_views),
    visited: sum((w) => w.prior_visits),
    booked: sum((w) => w.prior_bookings),
    revenue: sum((w) => w.prior_rev_cents) / 100,
  };
  const stages: StageDatum[] = [
    { key: "seen", value: cur.seen, delta: { value: pctDelta(cur.seen, prior.seen), kind: "percent" } },
    { key: "visited", value: cur.visited, delta: { value: pctDelta(cur.visited, prior.visited), kind: "percent" } },
    { key: "booked", value: cur.booked, delta: { value: cur.booked - prior.booked, kind: "absolute" } },
    { key: "revenue", value: cur.revenue, delta: { value: pctDelta(cur.revenue, prior.revenue), kind: "percent" } },
  ];
  const weeks: WeekDatum[] = weekRows.map((w) => ({
    start: w.start,
    adViews: w.ad_views,
    visits: w.visits,
    bookings: w.bookings,
    rev: w.rev_cents / 100,
    priorBookings: w.prior_bookings,
    priorRev: w.prior_rev_cents / 100,
  }));
  const expected = expectedRows[0];
  const legend: LegendDatum = {
    priorMonth: { adViews: prior.seen, visits: prior.visited, rev: prior.revenue },
    nextExpected: {
      adViews: expected?.ad ?? 0,
      visits: expected?.vis ?? 0,
      bookings: expected?.book ?? 0,
      rev: (expected?.rev ?? 0) / 100,
      staysBookedCount: expected?.stays ?? 0,
      staysBookedValue: (expected?.stays_value ?? 0) / 100,
    },
  };
  const trend: TrendData = {
    month,
    stages,
    weeks,
    forecast: forecastRows.map((f) => ({ start: f.start, rev: f.rev_cents / 100 })),
    legend,
  };

  /* ── outcomes ── */
  const o = outcomeRows[0];
  const completed = actionRows.filter((a) => !a.planned);
  const outcomes: OutcomeData = {
    attributedValue: o.attributed_value / 100,
    attributedCount: o.attributed_count,
    directCount: o.direct_count,
    totalCount: o.total_count,
    directValue: o.direct_value / 100,
    attributedFees: o.attributed_fees / 100,
    actionsCompleted: completed.length,
  };

  /* ── visibility ── */
  const VISIBILITY_TITLES: Record<VisibilityCheck["key"], string> = {
    google: "Google visibility",
    ai: "AI visibility (GEO)",
    seo: "Website SEO checks",
  };
  const KEY_ORDER: VisibilityCheck["key"][] = ["google", "ai", "seo"];
  const visibility: VisibilityCheck[] = KEY_ORDER.flatMap((key) => {
    const row = visibilityRows.find((v) => v.key === key);
    return row ? [{ key, title: VISIBILITY_TITLES[key], value: row.value, of: row.of_total, note: row.note }] : [];
  });

  /* ── actions (planned soonest-first, completed newest-first) ── */
  const toActionItem = (a: (typeof actionRows)[number]): ActionItem => ({
    verb: a.verb,
    text: a.text,
    ...(a.so ? { so: a.so } : {}),
    ...(a.detail ? { detail: a.detail } : {}),
    ...(a.result_text
      ? { result: { text: a.result_text, ...(a.result_kind === "pricing" ? { kind: "pricing" as const } : {}) } }
      : {}),
    ...(a.status ? { status: a.status } : {}),
    date: dayLabel(a.action_date),
    datetime: a.action_date,
  });
  const actions: ActionsData = {
    planned: actionRows.filter((a) => a.planned).map(toActionItem),
    completed: completed.map(toActionItem).reverse(),
    reviewCount: reviewRows[0].n,
  };

  /* ── bookings, in the client model shape with labels precomputed ── */
  const bookings: Booking[] = bookingRows.map((b) => ({
    id: b.id,
    guest: b.guest,
    city: b.city,
    channel: b.channel,
    referral: b.referral,
    attributed: b.attributed,
    windowed: b.windowed,
    booked: b.booked,
    bookedLabel: dayLabel(b.booked),
    arrival: b.arrival,
    stayLabel: stayLabel(b.arrival, b.nights),
    nights: b.nights,
    guests: b.guests,
    room: b.room,
    status: b.status,
    device: b.device,
    value: b.value_cents / 100,
    rate: b.rate,
    fee: b.fee_cents / 100,
    daysAhead: b.days_ahead,
  }));

  /* ── insights ── */
  const CHANNEL_KINDS: Record<string, string> = {
    "Your website": "13% on Autumn-attributed bookings",
    "Booking.com": "15% channel commission",
    Expedia: "18% channel commission",
  };
  const channels = ["Your website", "Booking.com", "Expedia"].flatMap((name) => {
    const row = channelRows.find((c) => c.channel === name);
    return row
      ? [{ name, count: row.n, value: row.value / 100, fee: row.fee / 100, kind: CHANNEL_KINDS[name] }]
      : [];
  });
  const stay = stayRows[0];
  const AHEAD_LABELS = ["0–7", "8–14", "15–21", "22–30", "31–45", "46–60", "61+"];
  const aheadBins: [string, number][] = AHEAD_LABELS.map((label, i) => [
    label,
    aheadRows.find((r) => r.bucket === i)?.n ?? 0,
  ]);
  const maxNights = Math.max(3, ...nightRows.map((r) => r.nights));
  const nightBins: [string, number][] = Array.from({ length: maxNights }, (_, i) => [
    `${i + 1} night${i === 0 ? "" : "s"}`,
    nightRows.find((r) => r.nights === i + 1)?.n ?? 0,
  ]);
  /* top three cities by count (value breaks ties), the rest listed by
     count then name — matching the canonical August ordering */
  const citySorted = [...cityRows].sort((a, b) => b.n - a.n || b.value - a.value || a.city.localeCompare(b.city));
  const cityTuple = (c: (typeof cityRows)[number]): [string, number, number] => [c.city, c.n, c.value / 100];
  const cityTop = citySorted.slice(0, 3).map(cityTuple);
  const cityMore = citySorted
    .slice(3)
    .sort((a, b) => b.n - a.n || a.city.localeCompare(b.city))
    .map(cityTuple);
  const insights: InsightsData = {
    fees: {
      channels,
      comparisonRate: 0.15,
      autumnRate: 0.13,
      attributedCount: o.attributed_count,
    },
    stay: {
      medianLeadDays: Math.round(stay.median_lead),
      avgNights: Math.round(stay.avg_nights * 10) / 10,
      avgValue: Math.round(stay.avg_value / 100),
      totalNights: stay.total_nights,
      totalReservations: stay.total,
      aheadBins,
      nightBins,
    },
    guests: {
      directCount: o.direct_count,
      directValue: o.direct_value / 100,
      cityTop,
      cityMore,
      foundYou: foundRows
        .filter((f) => f.category !== null)
        .map((f) => [f.category as string, f.n, f.value / 100]),
      bookedOn: deviceRows.map((d) => [d.device, d.n, d.value / 100]),
    },
  };

  return {
    month,
    monthLabel: monthLabel(month),
    outcomes,
    trend,
    visibility,
    actions,
    bookings,
    insights,
  };
});
