"use client";
import { useEffect, useRef, useState } from "react";
import markup from "@/components/chart-markup.json";
import {
  WEEKS,
  LAST_AUGUST_TOTAL,
  SEPTEMBER_EXPECTED,
} from "@/components/chart-data";
import { ArrowUpRight, Close } from "@/components/icons";

/* Per-week hover wiring, regenerated from the prototype's inline style
   block: hovering a week's hotspot shows its tooltip, lights its bar, and
   raises the guide ruler. Week ids run 74-125 in the generated markup. */
const HOVER_RULES =
  /* hover devices only: on touch, emulated hover sticks after a tap, so
     the lit week comes from the pinned selection instead */
  `@media (hover: hover){` +
  Array.from({ length: 52 }, (_, k) => {
    const i = 74 + k;
    return (
      `.chart-port svg:has(#hr-${i}:hover) .bar[data-week="${i}"]{fill:var(--accent)}` +
      `.chart-port svg:has(#hr-${i}:hover) #tp-${i} .tip-guide{opacity:1}`
    );
  }).join("") +
  `}` +
  Array.from({ length: 52 }, (_, k) => {
    const i = 74 + k;
    return (
      `.chart-port [data-sel="${i}"] .bar[data-week="${i}"]{fill:var(--accent)}` +
      `.chart-port [data-sel="${i}"] #tp-${i} .tip-guide{opacity:1}`
    );
  }).join("") +
  /* the build pipeline strips backdrop-filter from imported CSS, so the
     tooltip glass and the dialog backdrop's blur live here instead */
  `.chart-port .chart-tip{backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}` +
  `.figures-dialog::backdrop{-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px);transition:background 200ms ease,-webkit-backdrop-filter 200ms ease,backdrop-filter 200ms ease,overlay 200ms allow-discrete,display 200ms allow-discrete}` +
  `.figures-dialog[open]::backdrop{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}` +
  `@starting-style{.figures-dialog[open]::backdrop{-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px)}}`;

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const money = (n: number) => "$" + n.toLocaleString("en-US");
const ts = (iso: string) => Date.parse(iso + "T00:00:00Z");

function weekLabel(iso: string) {
  const d = new Date(ts(iso));
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

type Mode = "seen" | "visited" | "booked" | "revenue";

const UNIT_LABELS: Record<Mode, string> = {
  seen: "Weekly ad views",
  visited: "Weekly website visits",
  booked: "Weekly direct bookings",
  revenue: "Weekly direct-booking revenue",
};

/* Legend figures per metric. Current values and the booked prior are sums
   over WEEKS; the seen/visited priors back out of the stage tabs' deltas
   (↑14%, ↑21% vs last August), and the non-revenue expectations apply the
   revenue expectation's seasonal ratio ($18,444 / $21,380). */
const aug = (f: (w: (typeof WEEKS)[number]) => number) =>
  WEEKS.slice(-4).reduce((t, w) => t + f(w), 0);

const LEGEND: Record<
  Mode,
  { now: number; prior: number; next: number; money?: boolean; note?: string }
> = {
  seen: { now: aug((w) => w.adViews), prior: 6509, next: 6402 },
  visited: { now: aug((w) => w.visits), prior: 975, next: 1018 },
  booked: {
    now: aug((w) => w.bookings),
    prior: aug((w) => w.priorBookings),
    next: 35,
    note: "14 stays already booked",
  },
  revenue: {
    now: aug((w) => w.rev),
    prior: LAST_AUGUST_TOTAL,
    next: SEPTEMBER_EXPECTED,
    money: true,
    note: "14 stays booked · $6,900",
  },
};

export function Chart({ mode }: { mode: Mode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const figuresRef = useRef<HTMLDialogElement>(null);
  const [tip, setTip] = useState<{ i: number; left: number } | null>(null);
  const [tipVisible, setTipVisible] = useState(false);
  const [hlWeek, setHlWeek] = useState<string | null>(null);
  /* touch: the tapped week stays selected and its tooltip stays pinned */
  const [selWeek, setSelWeek] = useState<number | null>(null);
  const selRef = useRef<number | null>(null);
  const lastPointerType = useRef("mouse");

  const select = (i: number | null) => {
    selRef.current = i;
    setSelWeek(i);
  };

  const nearest = (clientX: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    let best = -1;
    let bestD = Infinity;
    let bestX = 0;
    wrap.querySelectorAll(".hr").forEach((hr, idx) => {
      const b = hr.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      const d = Math.abs(cx - clientX);
      if (d < bestD) {
        bestD = d;
        best = idx;
        bestX = cx;
      }
    });
    return best < 0 || bestD > 16 ? null : { best, bestX };
  };

  const placeTip = (best: number, bestX: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const tipW = tipRef.current?.offsetWidth || 210;
    const left = Math.min(Math.max(bestX - r.left - 60, 0), r.width - tipW - 6);
    setTip({ i: best, left });
    setTipVisible(true);
  };

  /* a tap outside the plot releases the pinned selection */
  useEffect(() => {
    if (selWeek === null) return;
    const onDocDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        selRef.current = null;
        setSelWeek(null);
        setTipVisible(false);
      }
    };
    document.addEventListener("pointerdown", onDocDown, true);
    return () => document.removeEventListener("pointerdown", onDocDown, true);
  }, [selWeek]);

  const openFigures = (weekStart: string) => {
    setHlWeek(weekStart);
    const dlg = figuresRef.current;
    dlg?.showModal();
    requestAnimationFrame(() => {
      const row = dlg?.querySelector<HTMLTableRowElement>(
        `tr[data-week="${weekStart}"]`
      );
      const scroller = dlg?.querySelector<HTMLElement>(".square-scroll");
      if (row && scroller)
        scroller.scrollTop =
          row.offsetTop - scroller.clientHeight / 2 + row.clientHeight / 2;
    });
  };

  /* mouse: clicking a bar opens the weekly figures scrolled to that week.
     touch: a tap anywhere on the plot selects the week and pins its
     tooltip; the tooltip's button is the way into the figures */
  const onClick = (e: React.MouseEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if ((e.target as Element).closest?.(".chart-tip")) return;
    if (lastPointerType.current === "touch") {
      const r = wrap.getBoundingClientRect();
      if (e.clientY - r.top >= r.height - 30) return;
      const hit = nearest(e.clientX);
      if (!hit) return;
      if (selRef.current === hit.best) {
        select(null);
        setTipVisible(false);
        return;
      }
      placeTip(hit.best, hit.bestX);
      select(hit.best);
      return;
    }
    const bars = wrap.querySelectorAll<SVGRectElement>(".bar");
    if (!bars.length) return;
    const base = bars[0].getBoundingClientRect().bottom;
    if (e.clientY < base - 48 || e.clientY > base + 6) return;
    let best = -1;
    let bestD = Infinity;
    bars.forEach((bar, i) => {
      const r = bar.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - e.clientX);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best < 0 || bestD > 14) return;
    openFigures(WEEKS[best].start);
  };

  const onMove = (e: React.PointerEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    /* the pointer travelling onto the tooltip freezes tracking, so its
       button stays reachable */
    if ((e.target as Element).closest?.(".chart-tip")) return;
    const r = wrap.getBoundingClientRect();
    const inPlot = e.clientY - r.top < r.height - 30;
    if (e.pointerType === "touch") {
      /* a horizontal drag scrubs the selection; pan-y leaves vertical
         swipes to the page's scroll */
      if (e.buttons === 0 || !inPlot) return;
      const hit = nearest(e.clientX);
      if (!hit) return;
      placeTip(hit.best, hit.bestX);
      select(hit.best);
      return;
    }
    const hit = nearest(e.clientX);
    if (!hit || !inPlot) return setTipVisible(false);
    placeTip(hit.best, hit.bestX);
  };

  /* the visible series is one carrier whose paths morph toward the selected
     metric's geometry; all four generated series share command structure, so
     the d transition interpolates */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const target = wrap.querySelector(`.s-${mode}`);
    const carrier = wrap.querySelector(".s-revenue");
    if (!target || !carrier) return;
    ["line", "ghost", "fore"].forEach((cls) => {
      const from = carrier.querySelector<SVGPathElement>(`path.${cls}`);
      const to = target.querySelector<SVGPathElement>(`path.${cls}`);
      if (from && to)
        from.style.setProperty("d", `path("${to.getAttribute("d")}")`);
    });
  }, [mode]);

  /* the tooltip's data persists while hidden, so fading out never snaps it
     to the corner */
  const week = tip ? WEEKS[tip.i] : null;

  const legend = LEGEND[mode];
  const fmt = (n: number) =>
    legend.money ? money(n) : n.toLocaleString("en-US");

  return (
    <section className={`chart-port mode-${mode}`}>
      <div className="mt-6 mb-0 text-xs/4 font-medium text-ink-56">
        {UNIT_LABELS[mode]}
      </div>

      <style>{HOVER_RULES}</style>
      <div
        ref={wrapRef}
        className="relative"
        style={{ touchAction: "pan-y" }}
        data-sel={selWeek !== null ? 74 + selWeek : undefined}
        onPointerDown={(e) => {
          lastPointerType.current = e.pointerType;
        }}
        onPointerMove={onMove}
        onPointerLeave={() => {
          if (selRef.current === null) setTipVisible(false);
        }}
        onClick={onClick}
      >
        <div dangerouslySetInnerHTML={{ __html: markup.html }} />
        {/* one live tooltip gliding between weeks */}
        <div
          ref={tipRef}
          className="chart-tip is-live"
          style={{
            left: tip?.left ?? 0,
            opacity: tipVisible ? 1 : 0,
            pointerEvents: tipVisible ? "auto" : "none",
          }}
        >
          {week && (
            <>
              <strong>Week of {weekLabel(week.start)}</strong>
              <span>
                {week.bookings} direct bookings · {money(week.rev)}
              </span>
              <small>
                Prior year: {week.priorBookings} · {money(week.priorRev)}
              </small>
              <button
                type="button"
                className="tip-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (tip) openFigures(WEEKS[tip.i].start);
                }}
              >
                View figures
              </button>
            </>
          )}
        </div>
      </div>

      {/* grounded figures: the legend's numbers follow the selected metric;
          on phones it grids 2-up so a wrapped item can't float strangely */}
      <div className="mt-4 flex flex-wrap items-start gap-10 max-[600px]:grid max-[600px]:grid-cols-2 max-[600px]:gap-x-8 max-[600px]:gap-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-2xs/3.5 font-medium text-ink-56">
            <span className="h-[1.5px] w-3.5 bg-accent" /> This August
          </div>
          <div className="mt-1.5 text-sm/5 font-medium">{fmt(legend.now)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-2xs/3.5 font-medium text-ink-56">
            <span className="w-3.5 border-t border-dashed border-ink-40" /> Last August
          </div>
          <div className="mt-1.5 text-sm/5 font-medium">{fmt(legend.prior)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-2xs/3.5 font-medium text-ink-56">
            <span className="w-3.5 border-t border-dashed border-accent" />{" "}
            September, expected
          </div>
          <div className="mt-1.5 text-sm/5 font-medium">{fmt(legend.next)}</div>
          {/* height held so the row below never jumps between modes */}
          <div className="mt-0.5 min-h-3.5 text-2xs/3.5 font-medium text-ink-56">
            {legend.note}
          </div>
        </div>
      </div>

      {/* weekly figures, as a dialog: 52 rows are lookup material; the
          trigger right-aligns like the hero's action row */}
      <div className="mt-1 flex justify-end">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => figuresRef.current?.showModal()}
          className="touch-hit -mr-1 flex cursor-pointer items-center gap-1.5 rounded px-1 py-2 text-xs/4 font-medium text-ink-56 underline decoration-1 underline-offset-[0.08em] transition-colors duration-200 max-[1000px]:text-sm/5 hover:text-ink active:text-ink"
        >
          Weekly figures <ArrowUpRight size={11} />
        </button>
      </div>

      <dialog
        ref={figuresRef}
        aria-labelledby="weekly-figures-title"
        onClose={() => setHlWeek(null)}
        onClick={(e) => {
          if (e.target === figuresRef.current) figuresRef.current.close();
        }}
        className="figures-dialog m-auto w-[min(560px,calc(100%-32px))] border border-hairline bg-paper py-4 pl-5 pr-[2px] text-ink max-[600px]:pl-4"
      >
        <header className="mr-[18px] mb-3 flex shrink-0 items-center justify-between gap-4 max-[600px]:mr-4">
          <h2 id="weekly-figures-title" className="text-sm/4.5 font-medium">
            Weekly figures
          </h2>
          <button
            type="button"
            aria-label="Close weekly figures"
            autoFocus
            onClick={() => figuresRef.current?.close()}
            /* unfilled at rest, the stepper buttons' radius; the halo
               carries the 44px reach and -my keeps the header text-height;
               the -mr backs out the hit area's centering inset so the icon
               sits on the content's right margin */
            className="touch-hit grid size-7 cursor-pointer place-items-center rounded text-ink-56 transition-colors duration-200 -mr-[calc((1.75rem-15px)/2)] max-[1000px]:-my-2 max-[1000px]:size-9 max-[1000px]:-mr-[calc((2.25rem-15px)/2)] max-[600px]:-mr-[calc((2.25rem-1.125rem)/2)] hover:bg-ink-5 hover:text-ink active:bg-ink-5 active:text-ink"
          >
            <Close size={15} className="max-[600px]:size-[1.125rem]" />
          </button>
        </header>
        {/* plain block sizing: flex-1 + h-full resolve a hair short of the
            content in an auto-height dialog, forcing a needless scrollbar */}
        <div className="relative">
        <div
          className="square-scroll max-h-[min(64vh,620px)]"
          style={{ "--scroll-inset-top": "0px" } as React.CSSProperties}
        >
          <table className="w-full table-fixed text-sm/5">
            <thead>
              <tr className="text-left text-xs/4 font-medium text-ink-56">
                <th className="w-[28%] py-2 font-medium">Week of</th>
                <th className="py-2 text-right font-medium">Bookings</th>
                <th className="py-2 text-right font-medium">Value</th>
                <th className="py-2 text-right font-medium">Visits</th>
                {/* phones drop the widest column so the rest can breathe */}
                <th className="py-2 text-right font-medium max-[600px]:hidden">
                  Ad views
                </th>
              </tr>
            </thead>
            <tbody>
              {WEEKS.map((w) => (
                <tr
                  key={w.start}
                  data-week={w.start}
                  className={`border-t border-hairline-2 ${
                    hlWeek === w.start ? "row-hl" : ""
                  }`}
                >
                  {/* single-line cell: too narrow truncates, never wraps */}
                  <td className="truncate py-2 whitespace-nowrap">
                    {weekLabel(w.start)},{" "}
                    {new Date(ts(w.start)).getUTCFullYear()}
                  </td>
                  <td className="py-2 text-right">{w.bookings}</td>
                  <td className="py-2 text-right">{money(w.rev)}</td>
                  <td className="py-2 text-right">{w.visits.toLocaleString()}</td>
                  <td className="py-2 text-right max-[600px]:hidden">
                    {w.adViews.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* bottom fade: clears the scrollbar lane and disappears at the end */}
        <div className="figures-fade pointer-events-none absolute bottom-0 left-0 right-[30px] h-5 bg-gradient-to-t from-paper to-transparent transition-opacity duration-200 max-[600px]:right-0" />
        </div>
      </dialog>
    </section>
  );
}
