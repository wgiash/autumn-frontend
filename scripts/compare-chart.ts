/* Throwaway acceptance test: regenerate the August 2026 chart markup from
   the canonical chart-data via generateChartMarkup() and diff it against
   the shipped src/components/chart-markup.json.

   Run: node scripts/compare-chart.ts

   The bar: identical element structure, and numeric attributes within
   ±0.05 (SVG user units / percent points). Residuals the contract cannot
   avoid (TrendData carries no prior-year traffic and no out-of-window
   prior weeks) are expected in exactly four places — the seen/visited
   ghost and fore paths, and the first two revenue-ghost segments — and are
   measured and reported precisely; anything else fails the run. */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
/* node runs TS via type stripping, which wants real .ts extensions; the
   app's tsconfig (bundler resolution, no allowImportingTsExtensions) does
   not — this script is a throwaway, so the two runtime imports carry
   expect-errors instead of a config change */
// @ts-expect-error -- .ts extension for node's type stripping
import { generateChartMarkup, type ChartMark } from "../src/lib/chart-gen.ts";
// @ts-expect-error -- .ts extension for node's type stripping
import { WEEKS, FORECAST, LAST_AUGUST_TOTAL, SEPTEMBER_EXPECTED } from "../src/components/chart-data.ts";
import type { TrendData } from "../src/lib/contracts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shippedHtml: string = JSON.parse(
  readFileSync(join(root, "src/components/chart-markup.json"), "utf8")
).html;

/* ── TrendData for August 2026, mirroring chart.tsx's current LEGEND ── */
const aug = (f: (w: (typeof WEEKS)[number]) => number) =>
  WEEKS.slice(-4).reduce((t, w) => t + f(w), 0);

const trend: TrendData = {
  month: "2026-08",
  stages: [
    { key: "seen", value: aug((w) => w.adViews), delta: { value: 14, kind: "percent" } },
    { key: "visited", value: aug((w) => w.visits), delta: { value: 21, kind: "percent" } },
    { key: "booked", value: aug((w) => w.bookings), delta: { value: 9, kind: "absolute" } },
    { key: "revenue", value: aug((w) => w.rev), delta: { value: 32, kind: "percent" } },
  ],
  weeks: WEEKS,
  forecast: FORECAST,
  legend: {
    priorMonth: { adViews: 6509, visits: 975, rev: LAST_AUGUST_TOTAL },
    nextExpected: {
      adViews: 6402,
      visits: 1018,
      bookings: 35,
      rev: SEPTEMBER_EXPECTED,
      staysBookedCount: 14,
      staysBookedValue: 6900,
    },
  },
};

/* ── recover the dormant action marks from the shipped markup itself ──
   (they came from the prototype's rail feed, which this app doesn't have;
   date is inverted from the day-linear guide x, label from the aria-label,
   railId from the mk- id) */
const unescapeHtml = (s: string) =>
  s.replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
const DAY = 86400000;
const windowStart = Date.UTC(2025, 8, 1);
const marks: ChartMark[] = [...shippedHtml.matchAll(
  /<g class="mark[^"]*" tabindex="[^"]*" aria-label="([^"]*)"(?: id="mk-([^"]*)")?>\s*<line class="action-guide" x1="([\d.]+)"/g
)].map((m) => {
  const label = unescapeHtml(m[1]).replace(/^[A-Z][a-z]{2} \d+ · /, "");
  const days = Math.round((Number(m[3]) * 395) / 1000);
  const date = new Date(windowStart + days * DAY).toISOString().slice(0, 10);
  return { date, label, plannedLabel: label, railId: m[2] };
});
console.log(`recovered ${marks.length} marks from the shipped markup`);

const generated = generateChartMarkup(trend, marks);

/* ── a tiny parser for this constrained markup ── */
type El = { tag: string; attrs: Record<string, string>; children: (El | string)[] };
function parse(html: string): El {
  const rootEl: El = { tag: "#root", attrs: {}, children: [] };
  const stack = [rootEl];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[a-zA-Z0-9-:]+(?:="[^"]*")?)*)\s*(\/?)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const VOID = new Set(["br", "img"]);
  while ((m = re.exec(html))) {
    const text = html.slice(last, m.index);
    if (text.trim()) stack[stack.length - 1].children.push(text);
    last = re.lastIndex;
    if (m[1]) {
      stack.pop();
      if (!stack.length) throw new Error("unbalanced at " + m.index);
    } else {
      const attrs: Record<string, string> = {};
      for (const a of m[3].matchAll(/([a-zA-Z0-9-:]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? "";
      const el: El = { tag: m[2], attrs, children: [] };
      stack[stack.length - 1].children.push(el);
      if (!m[4] && !VOID.has(m[2])) stack.push(el);
    }
  }
  if (stack.length !== 1) throw new Error("unclosed elements: " + stack.length);
  return rootEl;
}

/* ── comparison ── */
type Delta = { path: string; attr: string; kind: string; delta: number; a: string; b: string; all?: number[] };
const problems: string[] = [];
const numericDeltas: Delta[] = [];
let elements = 0;
let attrsCompared = 0;

const num = /^-?\d+(?:\.\d+)?$/;
function compareValue(path: string, attr: string, a: string, b: string) {
  attrsCompared++;
  if (a === b) return;
  if (num.test(a) && num.test(b)) {
    numericDeltas.push({ path, attr, kind: "attr", delta: Math.abs(+a - +b), a, b });
    return;
  }
  if (attr === "d") {
    const ta = a.match(/[A-Za-z]|-?[\d.]+/g) ?? [];
    const tb = b.match(/[A-Za-z]|-?[\d.]+/g) ?? [];
    if (ta.length !== tb.length) {
      problems.push(`${path} [d]: token count ${ta.length} vs ${tb.length}`);
      return;
    }
    let worst = 0;
    const all: number[] = [];
    for (let i = 0; i < ta.length; i++) {
      if (num.test(ta[i]) && num.test(tb[i])) {
        const d = Math.abs(+ta[i] - +tb[i]);
        all.push(d);
        worst = Math.max(worst, d);
      } else if (ta[i] !== tb[i]) {
        problems.push(`${path} [d]: command mismatch at token ${i}: ${ta[i]} vs ${tb[i]}`);
        return;
      }
    }
    numericDeltas.push({ path, attr, kind: "path", delta: worst, a: "", b: "", all });
    return;
  }
  if (attr === "style") {
    const pa = a.split(";"), pb = b.split(";");
    if (pa.length !== pb.length) return void problems.push(`${path} [style]: ${a} vs ${b}`);
    for (let i = 0; i < pa.length; i++) {
      const [ka, va] = pa[i].split(":"), [kb, vb] = pb[i].split(":");
      if (ka !== kb) return void problems.push(`${path} [style key]: ${pa[i]} vs ${pb[i]}`);
      const na = va?.match(/^(-?[\d.]+)(%?)$/), nb = vb?.match(/^(-?[\d.]+)(%?)$/);
      if (na && nb && na[2] === nb[2])
        numericDeltas.push({ path, attr: `style:${ka}`, kind: "attr", delta: Math.abs(+na[1] - +nb[1]), a: va, b: vb });
      else if (va !== vb) problems.push(`${path} [style val]: ${pa[i]} vs ${pb[i]}`);
    }
    return;
  }
  problems.push(`${path} [${attr}]: "${a}" vs "${b}"`);
}

function describe(el: El) {
  const id = el.attrs.id ? `#${el.attrs.id}` : "";
  const cls = el.attrs.class ? `.${el.attrs.class.split(" ").join(".")}` : "";
  return `${el.tag}${id}${cls}`;
}

function compareEl(a: El, b: El, path: string) {
  elements++;
  if (a.tag !== b.tag) return void problems.push(`${path}: tag ${a.tag} vs ${b.tag}`);
  const keys = new Set([...Object.keys(a.attrs), ...Object.keys(b.attrs)]);
  for (const k of keys) {
    if (!(k in a.attrs)) problems.push(`${path} [${k}]: only in generated ("${b.attrs[k]}")`);
    else if (!(k in b.attrs)) problems.push(`${path} [${k}]: only in shipped ("${a.attrs[k]}")`);
    else compareValue(path, k, a.attrs[k], b.attrs[k]);
  }
  const ea = a.children.filter((c): c is El => typeof c !== "string");
  const eb = b.children.filter((c): c is El => typeof c !== "string");
  const norm = (el: El) =>
    el.children.filter((c): c is string => typeof c === "string").join(" ").replace(/\s+/g, " ").trim();
  if (norm(a) !== norm(b)) problems.push(`${path} text: "${norm(a)}" vs "${norm(b)}"`);
  if (ea.length !== eb.length) {
    problems.push(`${path}: ${ea.length} vs ${eb.length} child elements (${ea.map(describe).join(",").slice(0, 200)} | ${eb.map(describe).join(",").slice(0, 200)})`);
    return;
  }
  for (let i = 0; i < ea.length; i++) compareEl(ea[i], eb[i], `${path} > ${describe(ea[i])}[${i}]`);
}

compareEl(parse(shippedHtml), parse(generated), "root");

/* ── report ── */
const TOLERANCE = 0.05;
const expected = (d: Delta) =>
  (/s-seen|s-visited/.test(d.path) && /ghost|fore/.test(d.path)) ||
  (/s-revenue/.test(d.path) && /ghost/.test(d.path));
const within = numericDeltas.filter((d) => d.delta <= TOLERANCE);
const over = numericDeltas.filter((d) => d.delta > TOLERANCE);
const overExpected = over.filter(expected);
const overUnexpected = over.filter((d) => !expected(d));

console.log(`\nelements compared: ${elements}, attributes compared: ${attrsCompared}`);
console.log(`numeric attrs differing at all: ${numericDeltas.filter((d) => d.delta > 0).length} (of those, ${within.filter((d) => d.delta > 0).length} within ±${TOLERANCE})`);

if (overExpected.length) {
  console.log(`\nEXPECTED residuals beyond ±${TOLERANCE} (contract lacks prior-year traffic + out-of-window prior weeks):`);
  const groups = new Map<string, Delta[]>();
  for (const d of overExpected) {
    const key = d.path.match(/s-(?:seen|visited|revenue)[^ >]*/)?.[0] + " " + (d.path.includes("ghost") || d.a === "" ? d.path.split(" > ").pop() : d.attr);
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(d);
  }
  for (const [key, ds] of groups) {
    for (const d of ds) {
      if (d.all) {
        const over = d.all.filter((x) => x > TOLERANCE);
        const mean = d.all.reduce((a, x) => a + x, 0) / d.all.length;
        console.log(
          `  ${key}: ${over.length}/${d.all.length} numbers over, max ${d.delta.toFixed(2)}, mean ${mean.toFixed(2)} SVG units (${((d.delta / 156) * 100).toFixed(1)}% of plot height at worst)`
        );
      } else {
        console.log(`  ${key} [${d.attr}]: delta ${d.delta.toFixed(2)} ("${d.a}" vs "${d.b}")`);
      }
    }
  }
}

let fail = false;
if (overUnexpected.length) {
  fail = true;
  console.log(`\nUNEXPECTED numeric deltas beyond ±${TOLERANCE}:`);
  for (const d of overUnexpected.slice(0, 40))
    console.log(`  ${d.path} [${d.attr}] delta ${d.delta}${d.a ? ` ("${d.a}" vs "${d.b}")` : ""}`);
}
if (problems.length) {
  fail = true;
  console.log(`\nSTRUCTURAL/TEXT problems: ${problems.length}`);
  for (const p of problems.slice(0, 40)) console.log("  " + p);
}
if (!fail) {
  console.log("\nPASS: structure identical; every numeric attribute within tolerance except the documented residuals above.");
} else {
  console.log("\nFAIL");
  process.exit(1);
}
