/* Deterministic seed for the Autumn dashboard database.

   Canonical sources (imported, never re-typed):
   - src/components/bookings-data.ts  — the 59 August 2026 reservations, verbatim
   - src/components/chart-data.ts     — 52 canonical weeks + forecast + legend constants
   August's action feed and visibility checks are copied verbatim from
   src/components/rail.tsx and src/components/savings.tsx (not exported there).

   Everything random flows from one mulberry32 PRNG with a fixed literal seed,
   so re-running the script always produces byte-identical data. No Date.now,
   no Math.random.

   Run: npm run seed  (node --env-file=.env.local + tsx) */

import postgres from "postgres";
import { assertDemoReset } from "./demo-safety";
import { replaceDemoData } from "./replace-demo-data";
import { BOOKINGS, type Booking } from "../src/components/bookings-data";
import { FORECAST, WEEKS } from "../src/components/chart-data";

/* ── deterministic PRNG ── */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260831);
const jitter = (lo: number, hi: number) => lo + rand() * (hi - lo);
const randInt = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const pickWeighted = <T,>(entries: [T, number][]): T => {
  const total = entries.reduce((t, [, w]) => t + w, 0);
  let r = rand() * total;
  for (const [v, w] of entries) if ((r -= w) < 0) return v;
  return entries[entries.length - 1][0];
};

/* ── date helpers (all UTC, ISO strings) ── */
const DAY = 86400000;
const ts = (iso: string) => Date.parse(iso + "T00:00:00Z");
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => toIso(ts(iso) + n * DAY);
/* a week belongs to the month its Thursday falls in */
const weekMonth = (monday: string) => addDays(monday, 3).slice(0, 7);
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthShort = (iso: string) => MONTHS_SHORT[Number(iso.slice(5, 7)) - 1];
const monthLong = (iso: string) => MONTHS_LONG[Number(iso.slice(5, 7)) - 1];

/* Largest-remainder split of an integer total across weights; entries with
   zero weight receive zero. */
function distribute(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const base = raw.map(Math.floor);
  let rem = total - base.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ frac: r - base[i], w: weights[i], i }))
    .filter((e) => e.w > 0)
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; rem > 0; k = (k + 1) % order.length, rem--) base[order[k].i]++;
  return base;
}
/* Rescale integers to hit an exact total, preserving proportions. */
const scaleToExact = (vals: number[], target: number) => distribute(target, vals);

/* ═══════════════ 1. weekly canon, current and reconstructed prior year ═══ */

type WeekAgg = { start: string; bookings: number; revCents: number; visits: number; adViews: number };

const currentWeeks: WeekAgg[] = WEEKS.map((w) => ({
  start: w.start,
  bookings: w.bookings,
  revCents: w.rev * 100,
  visits: w.visits,
  adViews: w.adViews,
}));

/* Prior year (Sep 2024 – Aug 2025): bookings/revenue are canonical
   (priorBookings/priorRev shifted back 364 days, so YoY joins are exact);
   visits/adViews are back-derived at the current year's conversion rates. */
const priorWeeks: WeekAgg[] = WEEKS.map((w) => {
  const visits = Math.max(20, Math.round(w.visits * (w.priorRev / w.rev) * jitter(0.95, 1.05)));
  const adViews = Math.max(visits, Math.round(visits * (w.adViews / w.visits) * jitter(0.95, 1.05)));
  return { start: addDays(w.start, -364), bookings: w.priorBookings, revCents: w.priorRev * 100, visits, adViews };
});

/* Force prior-August (the four weeks of Aug 2025) to the legend's exact
   totals: 6,509 ad views and 975 visits. */
{
  const augIdx = priorWeeks.flatMap((w, i) => (weekMonth(w.start) === "2025-08" ? [i] : []));
  if (augIdx.length !== 4) throw new Error(`expected 4 prior-August weeks, got ${augIdx.length}`);
  const vis = scaleToExact(augIdx.map((i) => priorWeeks[i].visits), 975);
  const ads = scaleToExact(augIdx.map((i) => priorWeeks[i].adViews), 6509);
  augIdx.forEach((i, k) => {
    priorWeeks[i].visits = vis[k];
    priorWeeks[i].adViews = ads[k];
  });
}

/* ═══════════════ 2. bookings: canonical August + generated months ═══════ */

type BookingRow = {
  id: string;
  guest: string;
  city: string;
  channel: string;
  referral: string;
  attributed: boolean;
  windowed: boolean;
  booked: string;
  arrival: string;
  nights: number;
  guests: number;
  room: string;
  status: string;
  device: string;
  value_cents: number;
  rate: number;
  fee_cents: number;
  days_ahead: number;
  category: string | null;
};

const CATEGORIES = ["Searching by name", "Discovering Stowe", "Seasonal offer"] as const;
const DEFAULT_CATEGORY: Record<string, string> = {
  "Google Search": "Searching by name",
  "Google Maps": "Searching by name",
  "Not recorded": "Searching by name",
  "ChatGPT referral": "Discovering Stowe",
  Instagram: "Discovering Stowe",
  "Returning-guest email": "Seasonal offer",
};

/* Assign a guest-intent category to each canonical August direct booking so
   that grouping by category reproduces the canonical FOUND_YOU aggregates
   EXACTLY (24/$12,600 · 13/$6,790 · 4/$1,990). A pure referral→category
   mapping provably cannot produce those totals (the referral group counts
   are {15,6,5,5,5,5}; no subset sums to 24 or 4), so the assignment is
   per-booking: a deterministic search finds a 4-set summing $1,990 and a
   13-set summing $6,790, preferring the semantically closest sources. */
function solveAugustCategories(direct: Booking[]): Map<string, string> {
  const pref: Record<string, number> = {
    "Returning-guest email": 0,
    Instagram: 1,
    "ChatGPT referral": 2,
    "Not recorded": 3,
    "Google Maps": 4,
    "Google Search": 5,
  };
  const order = direct.map((_, i) => i).sort((a, b) => pref[direct[a].referral] - pref[direct[b].referral] || a - b);
  const n = order.length;
  /* choose 4 (Seasonal offer, $1,990) */
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      for (let c = b + 1; c < n; c++)
        for (let d = c + 1; d < n; d++) {
          const four = [order[a], order[b], order[c], order[d]];
          if (four.reduce((t, i) => t + direct[i].value, 0) !== 1990) continue;
          /* choose 13 of the rest (Discovering Stowe, $6,790) via count+sum DP */
          const rest = direct.map((_, i) => i).filter((i) => !four.includes(i));
          let dp = new Map<string, number[]>([["0,0", []]]);
          for (const i of rest) {
            const next = new Map(dp);
            for (const [key, sel] of dp) {
              const [cnt, sum] = key.split(",").map(Number);
              if (cnt >= 13) continue;
              const nk = `${cnt + 1},${sum + direct[i].value}`;
              if (!next.has(nk)) next.set(nk, [...sel, i]);
            }
            dp = next;
          }
          const thirteen = dp.get("13,6790");
          if (!thirteen) continue;
          const map = new Map<string, string>();
          direct.forEach((bk, i) =>
            map.set(bk.id, four.includes(i) ? CATEGORIES[2] : thirteen.includes(i) ? CATEGORIES[1] : CATEGORIES[0]),
          );
          return map;
        }
  throw new Error("no per-booking category assignment reproduces FOUND_YOU — refusing to seed");
}

const augustCategories = solveAugustCategories(BOOKINGS.filter((b) => b.channel === "Your website"));

const canonicalRows: BookingRow[] = BOOKINGS.map((b) => ({
  id: b.id,
  guest: b.guest,
  city: b.city,
  channel: b.channel,
  referral: b.referral,
  attributed: b.attributed,
  windowed: b.windowed,
  booked: b.booked,
  arrival: b.arrival,
  nights: b.nights,
  guests: b.guests,
  room: b.room,
  status: b.status,
  device: b.device,
  value_cents: b.value * 100,
  rate: b.rate,
  fee_cents: Math.round(b.fee * 100),
  days_ahead: b.daysAhead,
  category: augustCategories.get(b.id) ?? null,
}));

/* distributions drawn from the canonical August rows */
const REFERRALS: [string, number][] = [
  ["Google Search", 15],
  ["Google Maps", 6],
  ["ChatGPT referral", 5],
  ["Instagram", 5],
  ["Returning-guest email", 5],
  ["Not recorded", 5],
];
const CITIES: [string, number][] = [
  ["Boston", 14],
  ["New York", 9],
  ["Hartford", 5],
  ["Burlington", 5],
  ["Montreal", 4],
  ["Albany", 2],
  ["Portland", 1],
  ["Providence", 1],
];
const DEVICES: [string, number][] = [
  ["Phone", 25],
  ["Computer", 14],
  ["Tablet", 2],
];
const ROOMS = ["Garden Room", "Meadow Room", "Lantern Suite"];
const AHEAD_RANGES: [[number, number], number][] = [
  [[5, 7], 2],
  [[8, 14], 7],
  [[15, 21], 11],
  [[22, 30], 8],
  [[31, 45], 21],
  [[46, 60], 11],
];
const FIRST_NAMES = [
  "Clara", "Miles", "Ruth", "Victor", "June", "Harold", "Ivy", "Felix", "Nadia", "Owen",
  "Pearl", "Simon", "Tessa", "Hugo", "Wren", "Ezra", "Lena", "Marcus", "Opal", "Reid",
  "Sylvia", "Tobias", "Vera", "Wallace", "Ada", "Byron", "Celia", "Dexter", "Edith", "Flynn",
];
const LETTERS = "ABCDEFGHJKLMNPRSTVW";
const guestName = () => `${FIRST_NAMES[randInt(0, FIRST_NAMES.length - 1)]} ${LETTERS[randInt(0, LETTERS.length - 1)]}.`;

/* Generate one earlier month's worth of direct bookings, week by week, so
   each week's direct count AND direct revenue equal the canonical weekly
   figures exactly. Weeks are generated through 2026-07-27; that week spans
   into August, so its bookings stay on Jul 27–31 (August is canonical). */
const generatedRows: BookingRow[] = [];
for (const week of currentWeeks) {
  if (week.start >= "2026-08-01") continue; // August is the canonical set
  const lastOffset = week.start === "2026-07-27" ? 4 : 6;
  const n = week.bookings;
  if (n === 0) continue;
  const nights: number[] = [];
  const provisional: number[] = [];
  for (let i = 0; i < n; i++) {
    const nt = rand() < 0.7 ? 2 : 3;
    nights.push(nt);
    provisional.push(nt === 2 ? randInt(360, 580) : randInt(620, 730));
  }
  const cents = scaleToExact(provisional.map((v) => v * 100), week.revCents);
  for (let i = 0; i < n; i++) {
    const offset = Math.min(lastOffset, Math.floor((i * (lastOffset + 1)) / n));
    const booked = addDays(week.start, offset);
    const referral = pickWeighted(REFERRALS);
    const attributed = referral === "Not recorded" ? false : rand() < 29 / 36;
    const windowed = referral !== "Not recorded" && !attributed;
    const [aheadLo, aheadHi] = pickWeighted(AHEAD_RANGES);
    const daysAhead = randInt(aheadLo, aheadHi);
    const valueCents = cents[i];
    generatedRows.push({
      id: `GEN-${week.start}-${i + 1}`,
      guest: guestName(),
      city: pickWeighted(CITIES),
      channel: "Your website",
      referral,
      attributed,
      windowed,
      booked,
      arrival: addDays(booked, daysAhead),
      nights: nights[i],
      guests: 2,
      room: ROOMS[randInt(0, 2)],
      status: "Confirmed",
      device: pickWeighted(DEVICES),
      value_cents: valueCents,
      rate: attributed ? 0.13 : 0,
      fee_cents: attributed ? Math.round(valueCents * 0.13) : 0,
      days_ahead: daysAhead,
      category: DEFAULT_CATEGORY[referral],
    });
  }
}

/* OTA share for the generated months: ~30% of each month's total bookings,
   Booking.com ~60% / Expedia ~40% of that, mirroring August's fee rates. */
const GENERATED_MONTHS: string[] = [];
for (let m = ts("2025-09-01"); m < ts("2026-08-01"); ) {
  const iso = toIso(m);
  GENERATED_MONTHS.push(iso.slice(0, 7));
  const d = new Date(m);
  d.setUTCMonth(d.getUTCMonth() + 1);
  m = d.getTime();
}
for (const month of GENERATED_MONTHS) {
  const directCount = generatedRows.filter((r) => r.booked.slice(0, 7) === month).length;
  const otaCount = Math.round((directCount * 3) / 7);
  const bcomCount = Math.round(otaCount * 0.6);
  for (let j = 0; j < otaCount; j++) {
    const channel = j < bcomCount ? "Booking.com" : "Expedia";
    const rate = channel === "Booking.com" ? 0.15 : 0.18;
    const day = 2 + Math.floor((j * 26) / Math.max(1, otaCount - 1 || 1));
    const booked = `${month}-${String(Math.min(day, 28)).padStart(2, "0")}`;
    const nightsN = rand() < 0.6 ? 2 : 3;
    const valueCents = (nightsN === 2 ? randInt(400, 470) : randInt(600, 680)) * 100;
    const daysAhead = randInt(10, 50);
    generatedRows.push({
      id: `GEN-OTA-${month}-${j + 1}`,
      guest: guestName(),
      city: pickWeighted(CITIES),
      channel,
      referral: "Booking-site referral unavailable",
      attributed: false,
      windowed: false,
      booked,
      arrival: addDays(booked, daysAhead),
      nights: nightsN,
      guests: 2,
      room: ROOMS[randInt(0, 2)],
      status: "Confirmed",
      device: "Not recorded",
      value_cents: valueCents,
      rate,
      fee_cents: Math.round(valueCents * rate),
      days_ahead: daysAhead,
      category: null,
    });
  }
}

const allBookings = [...canonicalRows, ...generatedRows];

/* ═══════════════ 3. daily metrics (2024-09-01 .. 2026-08-31) ═══════════ */

type DailyRow = { date: string; ad_views: number; visits: number; direct_bookings: number; direct_revenue_cents: number };
const daily = new Map<string, DailyRow>();
for (let d = ts("2024-09-01"); d <= ts("2026-08-31"); d += DAY) {
  const date = toIso(d);
  daily.set(date, { date, ad_views: 0, visits: 0, direct_bookings: 0, direct_revenue_cents: 0 });
}

/* weekday shape for traffic: quiet early week, Fri/Sat peaks */
const TRAFFIC_SHAPE = [0.92, 0.88, 0.9, 0.98, 1.12, 1.3, 0.9];
function spreadTraffic(week: WeekAgg) {
  const weights = TRAFFIC_SHAPE.map((w) => w * jitter(0.9, 1.1));
  const ads = distribute(week.adViews, weights);
  const vis = distribute(week.visits, weights);
  for (let i = 0; i < 7; i++) {
    const row = daily.get(addDays(week.start, i));
    if (!row) continue; // week tail outside the 730-day range
    row.ad_views = ads[i];
    row.visits = vis[i];
  }
}
for (const w of priorWeeks) spreadTraffic(w);
for (const w of currentWeeks) spreadTraffic(w);

/* prior-year direct bookings/revenue: distributed across each week's days
   (there are no booking rows that far back) */
const BOOKING_SHAPE = [1, 0.8, 0.9, 1, 1.2, 1.4, 1.1];
for (const w of priorWeeks) {
  const counts = distribute(w.bookings, BOOKING_SHAPE.map((x) => x * jitter(0.85, 1.15)));
  const revs = distribute(w.revCents, counts);
  for (let i = 0; i < 7; i++) {
    const row = daily.get(addDays(w.start, i));
    if (!row) continue;
    row.direct_bookings = counts[i];
    row.direct_revenue_cents = revs[i];
  }
}

/* current-year direct bookings/revenue come straight from the bookings
   table, so the two stay consistent by construction */
for (const b of allBookings) {
  if (b.channel !== "Your website") continue;
  const row = daily.get(b.booked);
  if (!row) continue;
  row.direct_bookings++;
  row.direct_revenue_cents += b.value_cents;
}

/* the two days no canonical or reconstructed week covers */
{
  const first = daily.get("2024-09-01")!; // Sunday before the first prior week
  first.ad_views = 182;
  first.visits = 27;
  const last = daily.get("2026-08-31")!; // Monday after the last canonical week
  last.ad_views = 291;
  last.visits = 46;
}

/* ═══════════════ 4. expectations, forecast, visibility, actions ════════ */

const EXPECTATION_MONTHS = [...GENERATED_MONTHS, "2026-08", "2026-09"];
type ExpectationRow = {
  month: string;
  expected_ad_views: number;
  expected_visits: number;
  expected_bookings: number;
  expected_revenue_cents: number;
  stays_booked_count: number;
  stays_booked_value_cents: number;
};
const expectations: ExpectationRow[] = EXPECTATION_MONTHS.map((month) => {
  if (month === "2026-09")
    /* the canonical September expectation shown in August's legend */
    return {
      month: "2026-09-01",
      expected_ad_views: 6402,
      expected_visits: 1018,
      expected_bookings: 35,
      expected_revenue_cents: 1844400, // SEPTEMBER_EXPECTED * 100
      stays_booked_count: 14,
      stays_booked_value_cents: 690000,
    };
  const weeks = currentWeeks.filter((w) => weekMonth(w.start) === month);
  const sum = (f: (w: WeekAgg) => number) => weeks.reduce((t, w) => t + f(w), 0);
  const stays = Math.max(4, Math.round(sum((w) => w.bookings) * 0.35 * jitter(0.8, 1.2)));
  return {
    month: `${month}-01`,
    expected_ad_views: Math.round(sum((w) => w.adViews) * jitter(0.93, 1.05)),
    expected_visits: Math.round(sum((w) => w.visits) * jitter(0.93, 1.05)),
    expected_bookings: Math.round(sum((w) => w.bookings) * jitter(0.9, 1.08)),
    expected_revenue_cents: Math.round((sum((w) => w.revCents) * jitter(0.93, 1.05)) / 100) * 100,
    stays_booked_count: stays,
    stays_booked_value_cents: stays * randInt(430, 520) * 100,
  };
});

/* every Monday any viewed month's 4-week forecast can reach: expected
   revenue near the eventual actual for data weeks, canonical for the four
   post-August weeks */
const forecastRows: { week_start: string; expected_revenue_cents: number }[] = [
  ...currentWeeks
    .filter((w) => w.start >= "2025-09-29")
    .map((w) => ({
      week_start: w.start,
      expected_revenue_cents: Math.round((w.revCents * jitter(0.92, 1.08)) / 100) * 100,
    })),
  ...FORECAST.map((f) => ({ week_start: f.start, expected_revenue_cents: f.rev * 100 })),
];

/* visibility: August is canonical; earlier months trend up toward it */
const VISIBILITY_NOTES: Record<string, { of: number; note: string }> = {
  google: { of: 12, note: "Tracked searches show your site in the top 10." },
  ai: { of: 10, note: "Test answers mention your inn on ChatGPT or Perplexity." },
  seo: { of: 26, note: "Page, metadata and structured-data checks passed." },
};
type VisibilityRow = { month: string; key: string; value: number; of_total: number; note: string };
const visibilityRows: VisibilityRow[] = [];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
[...GENERATED_MONTHS, "2026-08"].forEach((month, i) => {
  const august = month === "2026-08";
  const values = august
    ? { google: 8, ai: 5, seo: 24 }
    : {
        google: clamp(5 + Math.floor(i / 3) + randInt(0, 1), 4, 8),
        ai: clamp(2 + Math.floor(i / 3) + randInt(0, 1), 1, 5),
        seo: clamp(19 + Math.floor(i / 2) + randInt(0, 1), 18, 24),
      };
  for (const key of ["google", "ai", "seo"] as const)
    visibilityRows.push({
      month: `${month}-01`,
      key,
      value: values[key],
      of_total: VISIBILITY_NOTES[key].of,
      note: VISIBILITY_NOTES[key].note,
    });
});

/* ── actions ── */
type ActionRow = {
  month: string;
  planned: boolean;
  verb: string;
  text: string;
  so: string | null;
  detail: object | null;
  result_text: string | null;
  result_kind: string | null;
  status: string | null;
  action_date: string;
};
const actionRows: ActionRow[] = [];
const act = (month: string, planned: boolean, a: Partial<ActionRow> & { verb: string; text: string; action_date: string }) =>
  actionRows.push({
    month: `${month}-01`,
    planned,
    so: null,
    detail: null,
    result_text: null,
    result_kind: null,
    status: null,
    ...a,
  });

/* August 2026: the rail's canonical feed, verbatim (src/components/rail.tsx) */
act("2026-08", true, {
  verb: "Review",
  text: "rates for Sep 11-13 against remaining rooms and local demand",
  detail: {
    label: "Pricing factors",
    rows: [
      ["Room / dates", "Garden Room, Sep 11-13"],
      ["Inputs", "Season, availability, events, weather"],
      ["Rate change", "Not set; awaiting the Sep 3 review"],
    ],
  },
  action_date: "2026-09-03",
});
act("2026-08", true, {
  verb: "Send",
  text: '"A few October weekends remain" to unbooked past guests',
  so: "Exclude anyone who already booked or unsubscribed.",
  action_date: "2026-09-07",
});
act("2026-08", true, {
  verb: "Publish",
  text: "the foliage room tour and restart Montreal search ads",
  action_date: "2026-09-14",
});
act("2026-08", false, {
  verb: "Switched",
  text: "foliage ads to the October availability page",
  result_text: "Ads updated · October availability",
  action_date: "2026-08-26",
});
act("2026-08", false, {
  verb: "Updated",
  text: "the foliage guide's room rates and hotel details",
  so: "The guide still showed spring prices ahead of foliage season.",
  detail: {
    label: "Work details",
    rows: [
      ["Page", "Stowe foliage guide"],
      ["Content", "Current rates, breakfast, parking, room links"],
      ["Validation", "Structured data matches the visible page"],
      ["Next check", "Google indexing and attributable AI referrals"],
    ],
  },
  result_text: "Website updated · Rates & hotel details",
  action_date: "2026-08-21",
});
act("2026-08", false, {
  verb: "Raised",
  text: "the Garden Room rate for Aug 21-22 from $189 to $229 a night",
  detail: {
    label: "Pricing factors",
    rows: [
      ["Season", "Peak summer weekend"],
      ["Availability", "2 of 8 rooms remaining"],
      ["Nearby events", "Outdoor concert on Aug 22"],
      ["Weather", "Dry weekend forecast; no extra uplift"],
      ["Your website", "$229 per night"],
      ["Booking.com / Expedia", "$254 / $264 per night"],
    ],
    note: "Illustrative pricing inputs. Guest-price differences are not the owner's commission savings.",
  },
  result_text: "Rate increased · +$40/night",
  result_kind: "pricing",
  action_date: "2026-08-19",
});
act("2026-08", false, {
  verb: "Published",
  text: "the lake-and-breakfast post on Instagram and Facebook",
  detail: {
    label: "Work details",
    rows: [
      ["Post", "A morning at the lake, breakfast back at the inn."],
      ["Platforms", "Instagram and Facebook"],
      ["Destination", "August weekday availability"],
    ],
  },
  result_text: "Published · 2 social channels",
  action_date: "2026-08-12",
});
act("2026-08", false, {
  verb: "Sent",
  text: '"October at the Inn" to past autumn guests',
  detail: {
    label: "Work details",
    rows: [
      ["Audience", "Past autumn guests, subscribed"],
      ["Subject", "October at the Inn"],
      ["Destination", "October direct-booking availability"],
      ["Attribution", "Email-link referrals, not email opens"],
    ],
  },
  result_text: "Email sent · Returning guests",
  action_date: "2026-08-06",
});
act("2026-08", false, {
  verb: "Answered",
  text: "six Google reviews, including the parking question",
  result_text: "Reviews answered · 6 replies",
  action_date: "2026-08-05",
});

/* earlier months: templated variants of the August vocabulary */
const seasonWord = (month: string) => {
  const m = Number(month.slice(5, 7));
  return m >= 9 && m <= 11 ? "foliage" : m === 12 || m <= 2 ? "winter" : m <= 5 ? "spring" : "summer";
};
const COUNT_WORDS = ["two", "three", "four", "five", "six", "seven", "eight"];
GENERATED_MONTHS.forEach((month, mi) => {
  const monthStart = `${month}-01`;
  const nextMonthStart = toIso(new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).getTime());
  const nm = monthShort(nextMonthStart);
  const season = seasonWord(month);
  const day = (d: number) => `${month}-${String(d).padStart(2, "0")}`;
  const templates: (() => void)[] = [
    () => {
      const n = randInt(2, 8);
      act(month, false, {
        verb: "Answered",
        text: `${COUNT_WORDS[n - 2]} Google reviews from recent guests`,
        result_text: `Reviews answered · ${n} replies`,
        action_date: day(randInt(3, 8)),
      });
    },
    () =>
      act(month, false, {
        verb: "Sent",
        text: `"${monthLong(nextMonthStart)} at the Inn" to past guests`,
        detail: {
          label: "Work details",
          rows: [
            ["Audience", "Past guests, subscribed"],
            ["Subject", `${monthLong(nextMonthStart)} at the Inn`],
            ["Destination", `${monthLong(nextMonthStart)} direct-booking availability`],
            ["Attribution", "Email-link referrals, not email opens"],
          ],
        },
        result_text: "Email sent · Returning guests",
        action_date: day(randInt(9, 14)),
      }),
    () =>
      act(month, false, {
        verb: "Published",
        text: `the ${season} availability post on Instagram and Facebook`,
        detail: {
          label: "Work details",
          rows: [
            ["Platforms", "Instagram and Facebook"],
            ["Destination", `${monthLong(monthStart)} availability`],
          ],
        },
        result_text: "Published · 2 social channels",
        action_date: day(randInt(15, 20)),
      }),
    () => {
      const from = randInt(159, 209);
      const bump = randInt(2, 5) * 10;
      const d1 = randInt(18, 26);
      act(month, false, {
        verb: "Raised",
        text: `the ${ROOMS[randInt(0, 2)]} rate for ${monthShort(monthStart)} ${d1}-${d1 + 1} from $${from} to $${from + bump} a night`,
        detail: {
          label: "Pricing factors",
          rows: [
            ["Season", `${season[0].toUpperCase()}${season.slice(1)} weekend`],
            ["Availability", `${randInt(1, 3)} of 8 rooms remaining`],
            ["Your website", `$${from + bump} per night`],
          ],
          note: "Illustrative pricing inputs. Guest-price differences are not the owner's commission savings.",
        },
        result_text: `Rate increased · +$${bump}/night`,
        result_kind: "pricing",
        action_date: day(randInt(15, 22)),
      });
    },
    () =>
      act(month, false, {
        verb: "Updated",
        text: `the ${season} guide's room rates and hotel details`,
        result_text: "Website updated · Rates & hotel details",
        action_date: day(randInt(10, 24)),
      }),
    () =>
      act(month, false, {
        verb: "Switched",
        text: `search ads to the ${monthLong(nextMonthStart)} availability page`,
        result_text: `Ads updated · ${monthLong(nextMonthStart)} availability`,
        action_date: day(randInt(22, 27)),
      }),
  ];
  /* three completed items, rotating through the vocabulary */
  templates[mi % 6]();
  templates[(mi + 2) % 6]();
  templates[(mi + 4) % 6]();
  /* one planned item, dated early next month */
  const pd = randInt(2, 6);
  act(month, true, {
    verb: "Review",
    text: `rates for ${nm} ${pd + 8}-${pd + 10} against remaining rooms and local demand`,
    detail: {
      label: "Pricing factors",
      rows: [
        ["Room / dates", `${ROOMS[randInt(0, 2)]}, ${nm} ${pd + 8}-${pd + 10}`],
        ["Inputs", "Season, availability, events, weather"],
        ["Rate change", `Not set; awaiting the ${nm} ${pd} review`],
      ],
    },
    action_date: addDays(nextMonthStart, pd - 1),
  });
});

/* ═══════════════ 5. write everything ═══════════════════════════════════ */

async function main() {
  assertDemoReset();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (use --env-file=.env.local)");
  const sql = postgres(url, { prepare: false, ssl: "require", max: 1 });
  try {
    await replaceDemoData(sql, async (sql) => {
    const chunk = <T,>(rows: T[], size: number) => {
      const out: T[][] = [];
      for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
      return out;
    };

    for (const part of chunk(allBookings, 100)) await sql`insert into bookings ${sql(part)}`;
    for (const part of chunk([...daily.values()], 200)) await sql`insert into daily_metrics ${sql(part)}`;
    await sql`insert into monthly_expectations ${sql(expectations)}`;
    await sql`insert into weekly_forecast ${sql(forecastRows)}`;
    await sql`insert into visibility_checks ${sql(visibilityRows)}`;
    for (const a of actionRows)
      await sql`insert into actions (month, planned, verb, text, so, detail, result_text, result_kind, status, action_date)
        values (${a.month}, ${a.planned}, ${a.verb}, ${a.text}, ${a.so},
                ${a.detail ? sql.json(a.detail as never) : null},
                ${a.result_text}, ${a.result_kind}, ${a.status}, ${a.action_date})`;
    await sql`insert into referral_categories ${sql(
      Object.entries(DEFAULT_CATEGORY).map(([referral, category]) => ({ referral, category })),
    )}`;
    });

    console.log(
      `seeded: ${allBookings.length} bookings (${canonicalRows.length} canonical August), ` +
        `${daily.size} daily metric rows, ${expectations.length} monthly expectations, ` +
        `${forecastRows.length} forecast weeks, ${visibilityRows.length} visibility checks, ` +
        `${actionRows.length} actions, ${Object.keys(DEFAULT_CATEGORY).length} referral categories`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
