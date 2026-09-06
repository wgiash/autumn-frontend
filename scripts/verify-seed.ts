/* Verifies the seeded database against the repo's canonical data — through
   the real query layer (src/lib/queries.ts) for everything the dashboard
   renders, plus direct SQL for the daily-metrics invariants. Prints
   PASS/FAIL per assertion and exits non-zero on any failure.

   Run: npm run verify  (node --env-file=.env.local + tsx) */
import { isDeepStrictEqual } from "node:util";
import { BOOKINGS } from "../src/components/bookings-data";
import { FORECAST, SEPTEMBER_EXPECTED, WEEKS } from "../src/components/chart-data";
import { getSql } from "../src/lib/db";
import { getAvailableMonths, getMonthData } from "../src/lib/queries";

/* The canonical August 2026 aggregates, as the prototype's
   insight-data.ts recorded them (that module now reads from the DB, so the
   canon lives here as the fixed point the database must reproduce). */
const FEE_ROWS = [
  { name: "Your website", count: 41, value: 21380, fee: 1965.6, kind: "13% on Autumn-attributed bookings" },
  { name: "Booking.com", count: 11, value: 5778, fee: 866.7, kind: "15% channel commission" },
  { name: "Expedia", count: 7, value: 4032, fee: 725.76, kind: "18% channel commission" },
];
const AHEAD_BINS: [string, number][] = [
  ["0–7", 1],
  ["8–14", 7],
  ["15–21", 11],
  ["22–30", 8],
  ["31–45", 21],
  ["46–60", 11],
  ["61+", 0],
];
const NIGHT_BINS: [string, number][] = [
  ["1 night", 0],
  ["2 nights", 41],
  ["3 nights", 18],
];
const CITY_TOP: [string, number, number][] = [
  ["Boston", 14, 6791],
  ["New York", 9, 4477],
  ["Hartford", 5, 3594],
];
const CITY_MORE: [string, number, number][] = [
  ["Burlington", 5, 2456],
  ["Montreal", 4, 2039],
  ["Albany", 2, 1022],
  ["Portland", 1, 436],
  ["Providence", 1, 565],
];
const FOUND_YOU: [string, number, number][] = [
  ["Searching by name", 24, 12600],
  ["Discovering Stowe", 13, 6790],
  ["Seasonal offer", 4, 1990],
];
const BOOKED_ON: [string, number, number][] = [
  ["Phone", 25, 13155],
  ["Computer", 14, 7100],
  ["Tablet", 2, 1125],
];

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  if (isDeepStrictEqual(actual, expected)) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      actual:   ${JSON.stringify(actual)}`);
  }
}
const checkTrue = (name: string, cond: boolean, note = "") => {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.log(`FAIL  ${name}${note ? ` — ${note}` : ""}`);
  }
};

const DAY = 86400000;
const ts = (iso: string) => Date.parse(iso + "T00:00:00Z");
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => toIso(ts(iso) + n * DAY);
function lastMondayOfMonth(month: string): string {
  /* last Monday whose Thursday still falls in `month` */
  let best = "";
  for (let d = ts(`${month}-01`) - 6 * DAY, end = ts(`${month}-01`) + 37 * DAY; d < end; d += DAY) {
    const iso = toIso(d);
    if (new Date(d).getUTCDay() === 1 && addDays(iso, 3).slice(0, 7) === month) best = iso;
  }
  return best;
}

async function main() {
  const sql = getSql();

  /* ═══ August 2026 through the query layer ═══ */
  const august = await getMonthData("2026-08");
  const b = august.bookings;

  check("August: 59 bookings", b.length, 59);
  check("August: total value $31,190", b.reduce((t, x) => t + x.value, 0), 31190);
  check("August: direct count 41", august.outcomes.directCount, 41);
  check("August: direct value $21,380", august.outcomes.directValue, 21380);
  check("August: attributed count 29", august.outcomes.attributedCount, 29);
  check("August: attributed value $15,120", august.outcomes.attributedValue, 15120);
  check("August: attributed fees $1,965.60", august.outcomes.attributedFees, 1965.6);
  check("August: total count 59", august.outcomes.totalCount, 59);
  check("August: actions completed 6", august.outcomes.actionsCompleted, 6);
  check("August: fee rows (channel count/value/fee/kind)", august.insights.fees.channels, FEE_ROWS);
  check("August: no-referral direct count 5 (reviewCount)", august.actions.reviewCount, 5);
  check("August: windowed 7", b.filter((x) => x.windowed).length, 7);
  check("August: AHEAD_BINS", august.insights.stay.aheadBins, AHEAD_BINS);
  check("August: NIGHT_BINS", august.insights.stay.nightBins, NIGHT_BINS);
  check("August: CITY_TOP", august.insights.guests.cityTop, CITY_TOP);
  check("August: CITY_MORE", august.insights.guests.cityMore, CITY_MORE);
  check("August: FOUND_YOU", august.insights.guests.foundYou, FOUND_YOU);
  check("August: BOOKED_ON", august.insights.guests.bookedOn, BOOKED_ON);
  check("August: guests direct count/value", [august.insights.guests.directCount, august.insights.guests.directValue], [41, 21380]);

  /* every canonical booking comes back identically, labels included */
  const sortById = <T extends { id: string }>(rows: T[]) => [...rows].sort((x, y) => x.id.localeCompare(y.id));
  check("August: bookings match bookings-data.ts verbatim (labels included)", sortById(b), sortById([...BOOKINGS]));

  /* Calendar-month KPIs include boundary days, unlike the old four-week totals. */
  check(
    "August: calendar-month stage totals and deltas",
    august.trend.stages,
    [
      { key: "seen", value: 8220, delta: { value: 15, kind: "percent" } },
      { key: "visited", value: 1307, delta: { value: 22, kind: "percent" } },
      { key: "booked", value: 41, delta: { value: 5, kind: "absolute" } },
      { key: "revenue", value: 21380, delta: { value: 17, kind: "percent" } },
    ],
  );
  check("August: calendar-month prior-year legend", august.trend.legend.priorMonth, {
    adViews: 7135,
    visits: 1073,
    rev: 18295.49,
  });
  check("August: legend next expected (September)", august.trend.legend.nextExpected, {
    adViews: 6402,
    visits: 1018,
    bookings: 35,
    rev: SEPTEMBER_EXPECTED,
    staysBookedCount: 14,
    staysBookedValue: 6900,
  });
  check(
    "August: 52 chart weeks match chart-data.ts (all fields incl. priors)",
    /* compare only the canonical fields — the query layer also returns
       prior-year traffic (priorAdViews/priorVisits) for the ghost curves,
       which the canon file never carried */
    august.trend.weeks.map((w) => ({
      start: w.start,
      adViews: w.adViews,
      visits: w.visits,
      bookings: w.bookings,
      rev: w.rev,
      priorBookings: w.priorBookings,
      priorRev: w.priorRev,
    })),
    WEEKS.map((w) => ({
      start: w.start,
      adViews: w.adViews,
      visits: w.visits,
      bookings: w.bookings,
      rev: w.rev,
      priorBookings: w.priorBookings,
      priorRev: w.priorRev,
    })),
  );
  check(
    "August: every chart week carries prior-year traffic for the ghosts",
    august.trend.weeks.every(
      (w) => typeof w.priorAdViews === "number" && typeof w.priorVisits === "number",
    ),
    true,
  );
  check("August: forecast matches chart-data FORECAST", august.trend.forecast, FORECAST.map((f) => ({ start: f.start, rev: f.rev })));

  /* visibility + actions canon */
  check(
    "August: visibility checks (8/12, 5/10, 24/26)",
    august.visibility.map((v) => [v.key, v.title, v.value, v.of]),
    [
      ["google", "Google visibility", 8, 12],
      ["ai", "AI visibility (GEO)", 5, 10],
      ["seo", "Website SEO checks", 24, 26],
    ],
  );
  check("August: 3 planned actions, dated Sep 3/7/14", august.actions.planned.map((a) => a.date), ["Sep 3", "Sep 7", "Sep 14"]);
  check(
    "August: 6 completed actions, newest first",
    august.actions.completed.map((a) => [a.verb, a.date]),
    [
      ["Switched", "Aug 26"],
      ["Updated", "Aug 21"],
      ["Raised", "Aug 19"],
      ["Published", "Aug 12"],
      ["Sent", "Aug 6"],
      ["Answered", "Aug 5"],
    ],
  );
  check(
    "August: pricing action carries its detail and result kind",
    [august.actions.completed[2].result?.kind, august.actions.completed[2].detail?.rows.length],
    ["pricing", 6],
  );

  /* ═══ daily metrics invariants (direct SQL) ═══ */
  const weekly = await sql<{ start: string; ad_views: number; visits: number; bookings: number; rev: number }[]>`
    select (date_trunc('week', date))::date::text as start,
           sum(ad_views)::int as ad_views, sum(visits)::int as visits,
           sum(direct_bookings)::int as bookings, (sum(direct_revenue_cents) / 100)::int as rev
    from daily_metrics group by 1 order by 1`;
  const weeklyByStart = new Map(weekly.map((w) => [w.start, w]));
  let weeklyMismatches = 0;
  for (const w of WEEKS) {
    const row = weeklyByStart.get(w.start);
    if (
      !row ||
      row.ad_views !== w.adViews ||
      row.visits !== w.visits ||
      row.bookings !== w.bookings ||
      row.rev !== w.rev
    ) {
      weeklyMismatches++;
      console.log(`      week ${w.start}: canon ${JSON.stringify(w)} got ${JSON.stringify(row)}`);
    }
  }
  checkTrue("daily_metrics: weekly sums equal all 52 canonical weeks (every field)", weeklyMismatches === 0, `${weeklyMismatches} weeks off`);

  const [{ n: dayCount }] = await sql<{ n: number }[]>`select count(*)::int as n from daily_metrics`;
  checkTrue(`daily_metrics: ${dayCount} rows >= 720`, dayCount >= 720);

  /* ═══ the stepper range: 12 months, each fully populated ═══ */
  const months = await getAvailableMonths();
  check(
    "stepper: last 12 months, oldest first",
    months.map((m) => m.value),
    ["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"],
  );
  check("stepper: labels", [months[0].label, months[11].label], ["September 2025", "August 2026"]);

  for (const { value: month } of months) {
    const first = `${month}-01`;
    const next = toIso(new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).getTime());
    const lastWeek = lastMondayOfMonth(month);
    const [row] = await sql<
      { bookings: number; expectations: number; next_expectations: number; forecast: number; visibility: number; actions: number }[]
    >`
      select
        (select count(*) from bookings where booked >= ${first} and booked < ${next})::int as bookings,
        (select count(*) from monthly_expectations where month = ${first})::int as expectations,
        (select count(*) from monthly_expectations where month = ${next})::int as next_expectations,
        (select count(*) from weekly_forecast where week_start > ${lastWeek})::int as forecast,
        (select count(*) from visibility_checks where month = ${first})::int as visibility,
        (select count(*) from actions where month = ${first})::int as actions`;
    checkTrue(
      `${month}: bookings ${row.bookings}, expectations ${row.expectations}+${row.next_expectations}, forecast ${row.forecast}, visibility ${row.visibility}, actions ${row.actions}`,
      row.bookings > 0 &&
        row.expectations === 1 &&
        row.next_expectations === 1 &&
        row.forecast >= 4 &&
        row.visibility === 3 &&
        row.actions > 0,
    );
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  await sql.end();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
