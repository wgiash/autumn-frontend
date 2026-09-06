/* The chart markup generator: a TypeScript port of chartFor() from the
   prototype's build script (autumn-refined/build.mjs). Given one month's
   TrendData it emits the same pre-rendered fragment that used to ship as
   chart-markup.json: month bands, four axis blocks, the SVG plot (bars,
   four series with ghost/fore/line paths, hover columns, tooltip groups),
   the annotation layer, and the months row.

   Fidelity notes, verified against the shipped markup by
   scripts/compare-chart.ts:
   - Week hotspot ids are ALWAYS 74 + index (74..125 for 52 weeks) — the
     hover rules in chart.tsx are generated for that fixed range.
   - The x grid is purely date-derived from trend.month (a 13-calendar-month
     window: 12 history months ending with the viewed month, plus one
     forecast month), so the CSS stretch constants in chart.css keep holding.
   - Ghost paths are a centered 4-week mean of the prior year. The original
     reached 2 weeks before the window; TrendData only carries the 52
     in-window priors, so the mean clamps at the edges (a ~1.7px residual on
     the revenue ghost's first point, within rounding elsewhere).
   - Missing prior observations remain gaps. Forecast shapes are normalized
     to the same monthly expectations displayed by the legend.
   - The action-mark machinery (marks, action dots/tips, the :has() style
     rules) is dormant in this app; pass marks to emit it, omit for none. */

import type { TrendData } from "@/lib/contracts";
import { forecastValues, METRIC_FIELD as FIELD, type Metric } from "./chart-series";

export type ChartMark = {
  date: string; // ISO date
  label: string;
  plannedLabel?: string; // shown instead of label once the date is next month
  railId?: string; // rail-feed id: emits mk-/action-dot-/action-tip- wiring
};

const DAY = 86400000;
const WEEK = 7 * DAY;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const W = 1000;
const H = 258;
const Y_TOP = 34;
const Y_BASE = 190;
const BAR_BASE = 236;
const BAR_H = 38;
const MONTH_GAP = 4;
const SLOT_GAP = 2.8;
const TIP_W = 235;

const f = (n: number) => Math.round(n * 100) / 100;
const escape = (value: string | number) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");
const fmtDate = (t: number) => {
  const d = new Date(t);
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
};
const yearOf = (t: number) => new Date(t).getUTCFullYear();

/* Fritsch-Carlson-style monotone cubic, straight from the prototype. */
function monotone(pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (!n) return "";
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1].x - pts[i].x; m[i] = (pts[i + 1].y - pts[i].y) / dx[i]; }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const tau = 3 / Math.sqrt(s); t[i] = tau * a * m[i]; t[i + 1] = tau * b * m[i]; }
  }
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i];
    d += ` C${f(pts[i].x + h / 3)} ${f(pts[i].y + (t[i] * h) / 3)} ${f(pts[i + 1].x - h / 3)} ${f(pts[i + 1].y - (t[i + 1] * h) / 3)} ${f(pts[i + 1].x)} ${f(pts[i + 1].y)}`;
  }
  return d;
}

const AXIS_STEP: Record<Metric, number> = { seen: 500, visited: 100, booked: 2, revenue: 1000 };

export function generateChartMarkup(trend: TrendData, marks: ChartMark[] = []): string {
  if (!trend.weeks.length) {
    return '<div class="chart-scroll" role="region" aria-label="Performance chart"><p class="py-8 text-sm text-ink-56">No weekly figures available.</p></div>';
  }
  const [yy, mm] = trend.month.split("-").map(Number);
  const nowM = Date.UTC(yy, mm - 1, 1);
  const nd = new Date(nowM);
  const windowStart = Date.UTC(nd.getUTCFullYear(), nd.getUTCMonth() - 11, 1);
  const yearEnd = Date.UTC(nd.getUTCFullYear(), nd.getUTCMonth() + 1, 1);
  const end = Date.UTC(nd.getUTCFullYear(), nd.getUTCMonth() + 2, 1);
  const TOTAL = (end - windowStart) / DAY;
  const xOf = (t: number) => ((t - windowStart) / DAY / TOTAL) * W;

  /* the observed weeks and the forecast weeks, on the shared grid */
  const t0Of = (start: string) => Date.parse(start + "T00:00:00Z");
  const hist = trend.weeks.map((w, k) => ({ ...w, k, t0: t0Of(w.start), tm: t0Of(w.start) + 3.5 * DAY }));
  const fore = trend.forecast.map((w, k) => ({ ...w, k: hist.length + k, t0: t0Of(w.start), tm: t0Of(w.start) + 3.5 * DAY }));
  const all = [...hist, ...fore];

  /* Weekly observations share centered slots inside their reporting month. */
  const weekSlots = new Map<number, { x: number; width: number; barWidth: number; left: number; right: number }>();
  for (let month = 0; month < 13; month++) {
    const start = Date.UTC(nd.getUTCFullYear(), nd.getUTCMonth() - 11 + month, 1);
    const stop = Date.UTC(nd.getUTCFullYear(), nd.getUTCMonth() - 10 + month, 1);
    const weeks = all.filter((w) => w.tm >= start && w.tm < stop);
    const left = xOf(start) + (month === 0 ? 0 : MONTH_GAP / 2), right = xOf(stop) - (month === 12 ? 0 : MONTH_GAP / 2);
    const gap = SLOT_GAP;
    const barWidth = (right - left - gap * (weeks.length - 1)) / weeks.length;
    weeks.forEach((w, index) => weekSlots.set(w.k, { x: left + index * (barWidth + gap) + barWidth / 2, width: barWidth + gap, barWidth, left, right }));
  }
  const xWeek = (w: { k: number }) => weekSlots.get(w.k)!.x;
  const yScale = (max: number) => (v: number) => Y_BASE - (v / max) * (Y_BASE - Y_TOP);

  const priorOf = (metric: Metric, j: number): number | null => {
    const w = hist[j];
    if (metric === "booked") return w.priorBookings;
    if (metric === "revenue") return w.priorRev;
    if (metric === "seen") return w.priorAdViews ?? null;
    return w.priorVisits ?? null;
  };
  const comparisonAt = (metric: Metric, k: number): number | null => {
    if (k < hist.length) return priorOf(metric, k);
    const week = fore[k - hist.length];
    return hist.find((row) => row.t0 === week?.t0 - 364 * DAY)?.[FIELD[metric]] ?? null;
  };
  // Smooth only known values, and leave a gap wherever the comparison is missing.
  const smooth = (metric: Metric, k: number) => {
    if (comparisonAt(metric, k) === null) return null;
    const values = [k - 2, k - 1, k, k + 1]
      .filter((j) => j >= 0 && j < all.length)
      .map((j) => comparisonAt(metric, j))
      .filter((value): value is number => value !== null);
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const axes: string[] = [];
  const currentDots: string[] = [];

  function series(metric: Metric, fmt: (v: number) => string, unit: string) {
    const field = FIELD[metric];
    const ghost = [...hist, ...fore.slice(0, 1)].map((w, k) => ({ x: xWeek(w), v: smooth(metric, k) }));
    const forecasts = forecastValues(trend, metric);
    const expected = fore.map((w, j) => ({ x: xWeek(w), v: forecasts[j] }));
    const rawMax = Math.max(...hist.map((w) => w[field]), ...ghost.map((p) => p.v ?? 0), ...expected.map((p) => p.v)) * 1.04;
    const step = AXIS_STEP[metric];
    const max = Math.max(step, Math.ceil(rawMax / step) * step);
    const y = yScale(max);
    axes.push(`<div class="chart-axis focus-unit unit-${unit}">${[0, .5, 1].map(ratio => `<span style="top:${f(y(max * ratio) / H * 100)}%">${metric === "revenue" && ratio ? "$" + max * ratio / 1000 + "k" : fmtNum(max * ratio)}</span>`).join("")}</div>`);
    const pts = hist.map((w) => ({ x: xWeek(w), y: y(w[field] as number) }));
    const ghostPaths: string[] = [];
    let segment: { x: number; y: number }[] = [];
    for (const point of ghost) {
      if (point.v === null) {
        if (segment.length) ghostPaths.push(monotone(segment));
        segment = [];
      } else segment.push({ x: point.x, y: y(point.v) });
    }
    if (segment.length) ghostPaths.push(monotone(segment));
    const last = hist[hist.length - 1];
    currentDots.push(`<span class="now-dot focus-unit unit-${unit}" style="left:${f(xWeek(last) / W * 100)}%;top:${f(y(last[field] as number) / H * 100)}%" aria-hidden="true"></span>`);
    const fpts = [{ x: xWeek(last), y: y(last[field] as number) }, ...expected.map((p) => ({ x: p.x, y: y(p.v) }))];
    const peak = hist.reduce((a, b) => ((b[field] as number) > (a[field] as number) ? b : a));
    const px = f(xWeek(peak)), py = f(y(peak[field] as number) - 12);
    const anchor = px > W - 150 ? "end" : px < 150 ? "start" : "middle";
    const yr = yearOf(peak.t0) !== yearOf(nowM) ? `, ${yearOf(peak.t0)}` : "";
    return `
      <g class="series s-${unit}">
        ${[0, .5, 1].map((ratio) => `<line class="horizontal" x1="0" y1="${f(y(max * ratio))}" x2="${W}" y2="${f(y(max * ratio))}"/>`).join("")}
        <path class="ghost" d="${ghostPaths.join(" ")}"/>
        <path class="fore" d="${monotone(fpts)}"/>
        <path class="line" pathLength="1" d="${monotone(pts)}"/>
        <text class="peak" x="${px}" y="${py}" text-anchor="${anchor}">${fmt(peak[field] as number)} <tspan class="peak-k">· week of ${fmtDate(peak.t0)}${yr}</tspan></text>
      </g>`;
  }

  const maxB = Math.max(1, ...hist.map((w) => w.bookings));
  const bars = hist.map((w, k) => {
    const barWidth = weekSlots.get(w.k)!.barWidth;
    const x0 = xWeek(w) - barWidth / 2;
    const h = (w.bookings / maxB) * BAR_H;
    const lit = w.tm >= nowM && w.tm < yearEnd;
    return `<rect class="bar${lit ? " is-lit" : ""}" data-week="${74 + k}" style="--i:${k}" x="${f(x0)}" y="${f(BAR_BASE - h)}" width="${f(barWidth)}" height="${f(h)}" rx="1"/>`;
  }).join("\n        ");

  /* Action markers appear inside the plot when their rail entry is hovered
     or focused — dormant here until a rail feed passes marks. */
  const dated = marks.map((m) => ({ ...m, d: t0Of(m.date) }));
  const marksIn = dated.filter((m) => m.d >= windowStart && m.d < end);
  const markEls = marksIn.map((m) => {
    const x = f(xOf(m.d));
    const id = m.railId;
    const planned = m.d >= yearEnd;
    const text = `${fmtDate(m.d)} · ${planned ? m.plannedLabel || m.label : m.label}`;
    const w = text.length * 5.5 + 16;
    let lx = x - w / 2;
    if (lx < 0) lx = 0;
    if (lx + w > W) lx = W - w;
    return `
      <g class="mark${planned ? " mark-next" : ""}" tabindex="${id ? "0" : "-1"}" aria-label="${escape(text)}"${id ? ` id="mk-${id}"` : ""}>
        <line class="action-guide" x1="${x}" y1="${Y_TOP}" x2="${x}" y2="${BAR_BASE}"/>
        <g class="mark-label">
          <rect class="mark-label-bg" x="${f(lx)}" y="${BAR_BASE - 29}" width="${f(w)}" height="20" rx="0"/>
          <text x="${f(lx + 8)}" y="${BAR_BASE - 15}">${escape(text)}</text>
        </g>
      </g>`;
  }).join("");

  /* hover columns and their tooltips: the week, this year, last year, and
     what Autumn did that week if anything */
  const hovers = hist.map((w, k) => {
    const slot = weekSlots.get(w.k)!;
    return `<rect class="hr" id="hr-${74 + k}" x="${f(slot.x - slot.width / 2)}" y="${Y_TOP}" width="${f(slot.width)}" height="${BAR_BASE - Y_TOP}" role="img" aria-label="Week of ${fmtDate(w.t0)}: ${w.bookings} bookings, ${fmtMoney(w.rev)}"></rect>`;
  }).join("\n        ");
  const tips = hist.map((w, k) => {
    const x = f(xWeek(w));
    const act = dated.find((m) => m.d >= w.t0 && m.d < w.t0 + WEEK);
    const lines = [
      `<text class="tip-t tip-k" x="{x}" y="{y}">Week of ${fmtDate(w.t0)}${yearOf(w.t0) !== yearOf(nowM) ? ", " + yearOf(w.t0) : ""}</text>`,
      `<text class="tip-t" x="{x}" y="{y}">${w.bookings} bookings <tspan class="tip-k">·</tspan> ${fmtMoney(w.rev)}</text>`,
      `<text class="tip-t tip-k" x="{x}" y="{y}">${w.priorBookings === null || w.priorRev === null ? "Prior year unavailable" : `Last year ${w.priorBookings} bookings · ${fmtMoney(w.priorRev)}`}</text>`,
      `<text class="tip-t tip-k" x="{x}" y="{y}">${fmtNum(w.visits)} visits · ${fmtNum(w.adViews)} ad views</text>`,
    ];
    if (act) {
      const words = act.label.split(" ");
      let line = "Autumn: ";
      for (const word of words) {
        if ((line + word).length > 38) { lines.push(`<text class="tip-t tip-a" x="{x}" y="{y}">${line}</text>`); line = ""; }
        line += word + " ";
      }
      lines.push(`<text class="tip-t tip-a" x="{x}" y="{y}">${line}</text>`);
    }
    const h = 22 + lines.length * 15;
    const bx = x + 12 + TIP_W > W ? x - 12 - TIP_W : x + 12;
    const body = lines.map((l, j) => l.replace("{x}", String(f(bx + 12))).replace("{y}", String(46 + j * 15))).join("\n        ");
    return `
      <g class="tip" id="tp-${74 + k}">
        <line class="tip-guide" x1="${x}" y1="${Y_TOP}" x2="${x}" y2="${BAR_BASE}"/>
        <rect class="tip-box" x="${f(bx)}" y="28" width="${TIP_W}" height="${h}" rx="8"/>
        ${body}
      </g>`;
  }).join("");
  const railMarks = marksIn.filter((m) => m.railId);
  const actionCss = railMarks.map((m) => {
    const id = m.railId;
    return `.hero:has(#fd-${id}:hover) #mk-${id},.hero:has(#fd-${id}:focus-within) #mk-${id},.hero:has(#fd-${id}:hover) #action-tip-${id},.hero:has(#fd-${id}:focus-within) #action-tip-${id},.hero:has(#fd-${id}:hover) #action-dot-${id},.hero:has(#fd-${id}:focus-within) #action-dot-${id},.hero:has(#mk-${id}:focus-visible) #action-dot-${id},.hero:has(#mk-${id}:focus-visible) #action-tip-${id}{opacity:1}`;
  }).join("");
  const actionDots = railMarks.map((m) => `<span class="action-dot${m.d >= yearEnd ? " is-planned" : ""}" id="action-dot-${m.railId}" style="left:${f(xOf(m.d) / W * 100)}%;top:${f(BAR_BASE / H * 100)}%" aria-hidden="true"></span>`).join("");
  const htmlTips = hist.map((w, k) => `<div class="chart-tip" id="week-tip-${74 + k}" style="--anchor:${f(xWeek(w) / W * 100)}%"><strong>Week of ${fmtDate(w.t0)}</strong><span>${w.bookings} direct bookings &middot; ${fmtMoney(w.rev)}</span><small>${w.priorBookings === null || w.priorRev === null ? "Prior year unavailable" : `Prior year: ${w.priorBookings} &middot; ${fmtMoney(w.priorRev)}`}</small></div>`).join("") +
    railMarks.map((m) => `<div class="chart-tip action-tip" id="action-tip-${m.railId}" style="--anchor:${f(xOf(m.d) / W * 100)}%"><strong>${fmtDate(m.d)} &middot; Autumn</strong><span>${escape(m.d >= yearEnd ? m.plannedLabel || m.label : m.label)}</span></div>`).join("");
  const fadeStart = xWeek(hist[hist.length - 1]);
  const fadeEnd = fore.length ? xWeek(fore[0]) : fadeStart;

  const svg = `          <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The last twelve months by week: the selected stage as a line, bookings as bars, and next month expected">
            <style>${actionCss}</style>
            <defs>
              <linearGradient id="comparison-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${f(fadeEnd)}" y2="0"><stop offset="0" stop-color="#969995" stop-opacity=".5"/><stop offset="${f(fadeStart / fadeEnd * 100)}%" stop-color="#969995" stop-opacity=".5"/><stop offset="100%" stop-color="#969995" stop-opacity="0"/></linearGradient>
              <clipPath id="plot-bounds"><rect x="0" y="${Y_TOP}" width="${W}" height="${BAR_BASE - Y_TOP}"/></clipPath>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line class="hatch-line" x1="0" y1="0" x2="0" y2="6"/>
              </pattern>
            </defs>
            <line class="bars-base" x1="0" y1="${BAR_BASE}" x2="${W}" y2="${BAR_BASE}"/>
            ${bars}
            <text class="bars-unit" x="0" y="${BAR_BASE - BAR_H - 8}">Bookings</text>
${series("seen", (v) => fmtNum(v) + " times", "seen")}
${series("visited", fmtNum, "visited")}
${series("booked", fmtNum, "booked")}
${series("revenue", fmtMoney, "revenue")}
${markEls}
            <g>
            ${hovers}${tips}
            </g>
          </svg>`;

  let months = "", bands = "";
  for (let k = 0; k < 13; k++) {
    const t = Date.UTC(nd.getUTCFullYear(), nd.getUTCMonth() - 11 + k, 1);
    const d = new Date(t);
    const isNow = t === nowM, isNext = t === yearEnd;
    const yr = k === 0 || d.getUTCMonth() === 0 ? ` ${d.getUTCFullYear()}` : "";
    const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
    const left = xOf(t) + (k === 0 ? 0 : MONTH_GAP / 2), right = xOf(next) - (k === 12 ? 0 : MONTH_GAP / 2);
    const position = `left:${f(left / W * 100)}%;width:${f((right - left) / W * 100)}%`;
    const label = `${MON[d.getUTCMonth()]}${isNext || !yr ? "" : `<small class="month-year">${yr}</small>`}`;
    months += `<span class="${isNow ? "is-now" : isNext ? "is-next" : ""}" style="${position}">${label}</span>`;
    bands += `<span class="month-band${isNow ? " is-selected" : isNext ? " is-forecast" : ""}" style="${position}"></span>`;
  }

  return `<div class="chart-scroll" tabindex="0" role="region" aria-label="Performance chart"><div class="chart-inner">
            <div class="plot-backdrop" aria-hidden="true">${bands}</div>
            <div class="chart-plot">${axes.join("")}${svg}<div class="chart-annotations">${currentDots.join("")}${actionDots}${htmlTips}</div></div>
            <div class="months">${months}</div>
          </div></div>`;
}
