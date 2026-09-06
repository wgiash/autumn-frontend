"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BOOKINGS, type Booking } from "@/components/bookings-data";
import { CarouselFades } from "@/components/carousel-fades";
import { ArrowUpRight, ChevronDown, Close, Download } from "@/components/icons";
import insights from "./booking-insights.module.css";
import { TabButton } from "@/components/ui/tab-button";
import { DisclosureSummary } from "@/components/ui/disclosure-summary";

const BACKDROP_BLUR =
  ".figures-dialog::backdrop{-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px);transition:background 200ms ease,-webkit-backdrop-filter 200ms ease,backdrop-filter 200ms ease,overlay 200ms allow-discrete,display 200ms allow-discrete}" +
  ".figures-dialog[open]::backdrop{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}" +
  "@starting-style{.figures-dialog[open]::backdrop{-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px)}}";

const EASE = [0.22, 0.61, 0.36, 1] as const;

const money = (n: number) => "$" + n.toLocaleString("en-US");
const money2 = (n: number) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ── channel totals drive the filter list ── */
const CHANNELS = ["Your website", "Booking.com", "Expedia"] as const;
const BY_CHANNEL = [
  { key: "all", label: "All bookings", count: BOOKINGS.length },
  ...CHANNELS.map((c) => ({
    key: c,
    label: c,
    count: BOOKINGS.filter((b) => b.channel === c).length,
  })),
];

const CITIES = [...new Set(BOOKINGS.map((b) => b.city))].sort();
const DEVICES = ["Phone", "Computer", "Tablet", "Not recorded"];
const REFERRALS = [
  ...new Set(
    BOOKINGS.filter((b) => b.channel === "Your website").map((b) => b.referral)
  ),
].sort();

/* Column-header sorting, the tasks table's pattern: click a column to
   sort by it, click again to flip. The first click sorts the way that
   column reads — names A-Z, dates soonest, money highest. */
type SortCol = "guest" | "stay" | "channel" | "value" | "booked";
type Sort = { col: SortCol; dir: 1 | -1 };
const SORT_DEFAULT: Record<SortCol, 1 | -1> = {
  guest: 1,
  stay: 1,
  channel: 1,
  value: -1,
  booked: -1,
};
const SORT_CMP: Record<SortCol, (a: Booking, b: Booking) => number> = {
  guest: (a, b) => a.guest.localeCompare(b.guest),
  stay: (a, b) => a.arrival.localeCompare(b.arrival),
  channel: (a, b) => a.channel.localeCompare(b.channel),
  value: (a, b) => a.value - b.value,
  booked: (a, b) => a.booked.localeCompare(b.booked),
};

const HEAD_BTN =
  "flex cursor-pointer items-center gap-1 outline-none transition-colors duration-150 hover:text-ink focus-visible:text-ink active:text-ink";

/* the stacked chevrons: the active direction at full strength, its
   opposite dimmed; both mid-tone while the column is not driving */
function SortMark({ dir }: { dir: 0 | 1 | -1 }) {
  const dim = (on: boolean) => (on ? "opacity-30" : dir === 0 ? "opacity-55" : "");
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 18 18"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M12.75 6L9 2.25 5.25 6"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={dim(dir === -1)}
      />
      <path
        d="M12.75 12L9 15.75 5.25 12"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={dim(dir === 1)}
      />
    </svg>
  );
}

const PAGE = 10;

const ROOM_IMG: Record<string, string> = {
  "Meadow Room": "/rooms/thumb-1.jpg",
  "Lantern Suite": "/rooms/thumb-2.jpg",
  "Garden Room": "/rooms/thumb-3.jpg",
};

/* ── analytics content, transcribed from the prototype and aligned to the
      overview's canon (29 attributed → $1,965.60 fee → $1,241 saved) ── */
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

const NESTED_SUMMARY =
  "touch-hit flex w-fit cursor-pointer list-none items-center gap-[7px] py-1 text-xs/4 font-medium text-ink-56 outline-none transition-colors duration-200 max-[1000px]:text-sm/5 hover:text-ink focus-visible:text-ink active:text-ink [&::-webkit-details-marker]:hidden";

/* ── a real context menu on the tooltip's dark glass ── */
function MenuSelect({
  label,
  value,
  options,
  onChange,
  align = "left",
  active,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
  align?: "left" | "right";
  /* a filter holding a non-default value fills its chip */
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* the panel stays mounted through its exit fade; the ref bridges the
     render where open flips off, so it never remount-flashes */
  const [closing, setClosing] = useState(false);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) {
      setClosing(true);
      const t = setTimeout(() => setClosing(false), 160);
      wasOpen.current = open;
      return () => clearTimeout(t);
    }
    wasOpen.current = open;
  }, [open]);

  /* The panel is fixed-positioned from the trigger's viewport box — it
     escapes any scroll container's clipping (the pills row scrolls
     sideways on phones) and never leaves the viewport: it slides along
     an edge it would poke past, and opens upward when below runs out. */
  const [pos, setPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
  }>({ left: -9999, top: 0 });
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const m = menuRef.current;
      const b = btnRef.current;
      if (!m || !b) return;
      const t = b.getBoundingClientRect();
      const w = m.offsetWidth;
      const h = m.offsetHeight;
      const pad = 8;
      let left = align === "right" ? t.right - w : t.left;
      left = Math.min(left, window.innerWidth - pad - w);
      left = Math.max(left, pad);
      const overBelow = t.bottom + 6 + h > window.innerHeight - pad;
      if (overBelow && t.top - 6 - h > pad) {
        setPos({ left, bottom: window.innerHeight - (t.top - 6) });
      } else {
        setPos({
          left,
          top: Math.min(t.bottom + 6, window.innerHeight - pad - h),
        });
      }
    };
    place();
    /* opening a half-cut pill also docks it into view — the panel rides
       along while its trigger glides */
    const row = btnRef.current?.closest(".square-scroll-x");
    row?.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      row?.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    /* an open menu gates page scrolling: the panel is anchored to its
       trigger, and the page sliding under it would tear them apart —
       scrolling within the panel itself stays allowed */
    const block = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) e.preventDefault();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    document.addEventListener("wheel", block, { passive: false });
    document.addEventListener("touchmove", block, { passive: false });
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("wheel", block);
      document.removeEventListener("touchmove", block);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) ?? options[0];

  /* the label swap borrows the month stepper's interaction, sliding
     toward the picked option */
  const idx = options.findIndex((o) => o.value === value);
  const prevIdx = useRef(idx);
  const dir = idx >= prevIdx.current ? 1 : -1;
  useEffect(() => {
    prevIdx.current = idx;
  }, [idx]);

  /* The label wrapper animates to the incoming label's measured width, so
     the chevron sits in real flow and rides the moving edge — it always
     knows the width and can never overlap the text. The observer re-reads
     the measurement when the type scale changes it. */
  const measureRef = useRef<HTMLSpanElement>(null);
  const [labelW, setLabelW] = useState<number>();
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    setLabelW(el.offsetWidth);
    const ro = new ResizeObserver(() => setLabelW(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [current.value]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={`flex cursor-pointer items-center gap-1.5 overflow-clip rounded-full border border-hairline py-1.5 pr-3 pl-3 text-xs/4 font-medium text-ink-72 transition-colors duration-200 max-[1000px]:text-sm/4.5 hover:bg-ink-5 active:bg-ink-5 active:transition-none ${
          open || active ? "bg-ink-5 text-ink" : ""
        }`}
      >
        {/* clips sideways only: a wider incoming label reveals as the
            width opens; the stepper's vertical slide stays visible */}
        <span
          className="relative block [overflow-x:clip] [overflow-y:visible] transition-[width] duration-300 ease-(--ease)"
          style={{ width: labelW }}
        >
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.span
              key={current.value}
              ref={measureRef}
              custom={dir}
              variants={{
                enter: (d: number) => ({
                  y: 12 * d,
                  opacity: 0,
                  scale: 0.9,
                  filter: "blur(4px)",
                }),
                center: { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
                exit: (d: number) => ({
                  y: -12 * d,
                  opacity: 0,
                  scale: 0.9,
                  filter: "blur(4px)",
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.3,
                ease: EASE,
                opacity: { duration: 0.18, ease: EASE },
              }}
              className="inline-block whitespace-nowrap"
            >
              {current.label}
            </motion.span>
          </AnimatePresence>
        </span>
        <ChevronDown
          size={11}
          className={`shrink-0 text-ink-56 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {(open || closing || wasOpen.current) && (
        <div
          ref={menuRef}
          role="menu"
          className={`menu-in fixed z-20 min-w-44 rounded p-1 ${
            open ? "" : "menu-out"
          }`}
          /* glassier than the tooltip: thinner ink, deeper blur */
          style={{
            left: pos.left,
            top: pos.top,
            bottom: pos.bottom,
            maxHeight: "calc(100dvh - 16px)",
            overflowY: "auto",
            background: "color(display-p3 0.05 0.05 0.05 / 0.55)",
            backdropFilter: "blur(20px) saturate(1.15)",
            WebkitBackdropFilter: "blur(20px) saturate(1.15)",
            border: "0.5px solid rgb(255 255 255 / 0.16)",
            boxShadow: "0 4px 16px rgb(0 0 0 / 0.18)",
          } as React.CSSProperties}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[3px] px-2.5 py-1.5 text-left text-xs/4 font-medium whitespace-nowrap text-white/85 transition-colors duration-150 max-[1000px]:text-sm/4.5 hover:bg-white/10 hover:text-white active:bg-white/10 active:transition-none"
            >
              {o.label}
              {o.value === value && (
                <span aria-hidden="true" className="size-1 rounded-full bg-white/85" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RankedRows({ rows }: { rows: [string, number, number][] }) {
  return (
    <>
      {rows.map(([name, count, value]) => (
        <div key={name} className="flex items-baseline gap-3 py-1 text-sm/5">
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <span className="w-6 text-right text-ink-56 tabular-nums">{count}</span>
          <span className="w-16 text-right font-medium tabular-nums">
            {money(value)}
          </span>
        </div>
      ))}
    </>
  );
}

function Histogram({ bins, peak }: { bins: [string, number][]; peak: number }) {
  const max = Math.max(...bins.map(([, n]) => n));
  return (
    /* the peak carries the accent, like the chart's selected column */
    <div className="mt-5 mb-2 max-w-[16rem]">
      <div className="flex h-10 items-end gap-1">
        {bins.map(([label, n], i) => (
          <span
            key={label}
            role="img"
            aria-label={`${label}: ${n} bookings`}
            className={`flex-1 ${i === peak ? "bg-accent" : "bg-ink-16"}`}
            style={{ height: `${Math.max((n / max) * 100, n > 0 ? 8 : 3)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {bins.map(([label]) => (
          <span key={label} className="flex-1 text-center text-2xs/3.5 text-ink-40">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* a rail stat: white card; `big` restores full stat type in the popup */
function StatBlock({
  title,
  value,
  unit,
  note,
  big,
  children,
}: {
  title: string;
  value: string;
  unit?: string;
  note: string;
  big?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-2 rounded border border-hairline bg-white px-3 py-4 first:mt-0">
      <h3 className="text-xs/4 font-medium text-ink-56">{title}</h3>
      {big ? (
        <p className="mt-2 text-2xl/7 font-normal tracking-[-0.01em]">
          {value}{" "}
          {unit && <span className="font-light text-ink-56">{unit}</span>}
        </p>
      ) : (
        <p className="mt-1.5 text-base/5 font-medium">
          {value}{" "}
          {unit && <span className="font-normal text-ink-56">{unit}</span>}
        </p>
      )}
      {children}
      <p className="mt-2 text-xs/4 text-ink-72">{note}</p>
    </div>
  );
}

function InsightMetrics({ items }: { items: { label: string; value: string; unit?: string }[] }) {
  return (
    <dl className={insights.metrics}>
      {items.map(({ label, value, unit }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}{unit && <span> {unit}</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

function InsightHistogram({ bins, unit }: { bins: [string, number][]; unit: string }) {
  const max = Math.max(...bins.map(([, count]) => count), 1);
  return (
    <div className={insights.histogram}>
      {bins.map(([label, count]) => (
        <div key={label} className={insights.bin} role="img" aria-label={`${label} ${unit}: ${count} bookings`}>
          <div className={insights.barTrack} aria-hidden="true">
            <div className={insights.bar} data-peak={count === max} style={{ height: `${count / max * 100}%` }}>
              <span>{count}</span>
            </div>
          </div>
          <span className={insights.binLabel} aria-hidden="true">{label}</span>
        </div>
      ))}
    </div>
  );
}

function InsightTable({ rows, label, caption }: { rows: [string, number, number][]; label: string; caption: string }) {
  return (
    <table className={insights.table}>
      <caption className="sr-only">{caption}</caption>
      <thead><tr><th scope="col">{label}</th><th scope="col">Bookings</th><th scope="col">Value</th></tr></thead>
      <tbody>
        {rows.map(([name, count, value]) => (
          <tr key={name}><th scope="row">{name}</th><td>{count}</td><td>{money(value)}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function FeeInsights() {
  const totalFees = FEE_ROWS.reduce((total, row) => total + row.fee, 0);
  const comparisonFee = FEE_ROWS[0].value * 0.15;
  const savings = comparisonFee - FEE_ROWS[0].fee;
  return (
    <>
      <InsightMetrics items={[
        { label: "Estimated channel fees", value: money2(totalFees) },
        { label: "Estimated direct savings", value: money2(savings) },
      ]} />
      <section className={insights.section} aria-labelledby="fees-by-channel">
        <h3 id="fees-by-channel">Fees by channel</h3>
        <table className={`${insights.table} ${insights.feeTable}`}>
          <caption className="sr-only">August booking values and estimated fees by channel</caption>
          <thead><tr><th scope="col">Channel</th><th scope="col" className={insights.desktopValue}>Booking value</th><th scope="col">Est. fee</th></tr></thead>
          <tbody>
            {FEE_ROWS.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  <span className={insights.channelName}>{row.name === "Your website" && <i aria-hidden="true" />}{row.name}</span>
                  <span className={insights.rowMeta}>{row.count} bookings<span className={insights.mobileValue}> · {money(row.value)}</span></span>
                  <span className={insights.rowMeta}>{row.kind}</span>
                </th>
                <td className={insights.desktopValue}>{money(row.value)}</td>
                <td>{money2(row.fee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <details className={insights.disclosure}>
        <DisclosureSummary>
          <span>How savings are estimated</span>
          <ChevronDown size={12} className="ml-auto" />
        </DisclosureSummary>
        <div className={insights.estimate}>
          <dl>
            <div><dt>Booking-site fees at 15%</dt><dd>{money2(comparisonFee)}</dd></div>
            <div><dt>Autumn&apos;s fee at 13%</dt><dd>−{money2(FEE_ROWS[0].fee)}</dd></div>
            <div className={insights.receiptTotal}><dt>Estimated savings</dt><dd>{money2(savings)}</dd></div>
          </dl>
          <p className={insights.note}>Compares a 15% booking-site fee on all 41 direct bookings with Autumn&apos;s 13% fee on the 29 bookings attributed to its marketing. No Autumn fee is charged on booking-site reservations.</p>
        </div>
      </details>
      <p className={insights.footnote}>Illustrative fees and savings, not settled charges or observed savings. Taxes and payment processing excluded.</p>
    </>
  );
}

function StayInsights() {
  return (
    <>
      <InsightMetrics items={[
        { label: "Typical lead time", value: "33", unit: "days" },
        { label: "Average stay", value: "2.3", unit: "nights" },
        { label: "Average booking", value: "$529" },
      ]} />
      <section className={insights.section} aria-labelledby="booking-lead-time">
        <div className={insights.sectionHeading}><h3 id="booking-lead-time">How far ahead they booked</h3><span>Bookings</span></div>
        <InsightHistogram bins={AHEAD_BINS} unit="days ahead" />
        <p className={insights.note}>Days before arrival. Half booked 33 days ahead or less.</p>
      </section>
      <section className={insights.section} aria-labelledby="booking-stay-length">
        <div className={insights.sectionHeading}><h3 id="booking-stay-length">How long they stayed</h3><span>Bookings</span></div>
        <InsightHistogram bins={NIGHT_BINS} unit="" />
        <p className={insights.note}>136 nights across 59 reservations.</p>
      </section>
      <p className={insights.footnote}>All booking channels. Based on reservations made in August, including future stays.</p>
    </>
  );
}

function GuestInsights() {
  const [selected, setSelected] = useState(0);
  const panelsRef = useRef<HTMLDivElement>(null);
  const previousHeight = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const tabs = ["City", "Source", "Device"];
  const selectTab = (index: number) => {
    if (index === selected) return;
    previousHeight.current = panelsRef.current?.getBoundingClientRect().height ?? null;
    setSelected(index);
  };

  useLayoutEffect(() => {
    const panels = panelsRef.current;
    const from = previousHeight.current;
    previousHeight.current = null;
    if (!panels || from === null || reduceMotion) return;
    const to = panels.getBoundingClientRect().height;
    if (Math.abs(to - from) < 1) return;

    // Return to intrinsic sizing after the tab switch so disclosures keep their native animation.
    const animation = panels.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      { duration: 300, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
    );
    return () => animation.cancel();
  }, [selected, reduceMotion]);

  const onTabKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectTab(next);
    document.getElementById(`guest-tab-${next}`)?.focus();
  };
  return (
    <>
      <InsightMetrics items={[
        { label: "Direct bookings", value: "41" },
        { label: "Direct booking value", value: "$21,380" },
      ]} />
      <div className={insights.tabs} role="tablist" aria-label="Direct guest breakdown">
        {tabs.map((label, index) => (
          <TabButton
            key={label}
            active={selected === index}
            id={`guest-tab-${index}`}
            role="tab"
            type="button"
            aria-selected={selected === index}
            aria-controls={`guest-panel-${index}`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => selectTab(index)}
            onKeyDown={(event) => onTabKey(event, index)}
            className="min-h-11 text-xs/4 font-medium"
          >{label}</TabButton>
        ))}
      </div>
      <div ref={panelsRef} className={insights.guestPanels}>
      <div className={insights.guestPanelsContent}>
      <section className={insights.guestSection} id="guest-panel-0" role="tabpanel" aria-labelledby="guest-tab-0" hidden={selected !== 0} tabIndex={0}>
        <h3 id="guest-cities">Where they came from</h3>
        <InsightTable rows={CITY_TOP} label="City" caption="Direct bookings by guest city" />
        <details className={insights.moreCities}>
          <DisclosureSummary>
            <span>5 more cities</span>
            <span className="ml-auto text-xs/4 font-normal text-ink-56">13 bookings</span>
            <ChevronDown size={12} />
          </DisclosureSummary>
          <InsightTable rows={CITY_MORE} label="City" caption="Direct bookings from five more cities" />
        </details>
      </section>
      <section className={insights.guestSection} id="guest-panel-1" role="tabpanel" aria-labelledby="guest-tab-1" hidden={selected !== 1} tabIndex={0}>
        <h3 id="guest-discovery">How they found you</h3>
        <InsightTable rows={FOUND_YOU} label="Source" caption="Direct bookings by discovery source" />
      </section>
      <section className={insights.guestSection} id="guest-panel-2" role="tabpanel" aria-labelledby="guest-tab-2" hidden={selected !== 2} tabIndex={0}>
        <h3 id="guest-devices">Booked on</h3>
        <InsightTable rows={BOOKED_ON} label="Device" caption="Direct bookings by device" />
      </section>
      </div>
      </div>
      <p className={insights.footnote}>Website bookings only. Booking.com and Expedia reservations are excluded. Illustrative guest data.</p>
    </>
  );
}

/* small tablets drop the Channel column — five columns leave the flexible
   ones too tiny to read; the accent square still marks booked-direct */
const ROW =
  "grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_5rem_4.375rem_1rem] items-center gap-4 max-[800px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5rem_4.375rem_1rem] max-[600px]:grid-cols-[minmax(0,1fr)_auto_1rem]";

/* ── one booking: a paper-2 segment that opens into a white card ── */
function BookingRow({ b }: { b: Booking }) {
  return (
    <details className="group/bk mb-1.5 rounded border border-transparent bg-paper-2 transition-colors duration-200 open:border-hairline open:bg-white">
      <summary
        /* padding backs out the card's 1px border so the columns land
           exactly on the header row's tracks */
        className={`${ROW} cursor-pointer list-none rounded px-[calc(0.75rem-1px)] py-3 outline-none transition-colors duration-200 [&::-webkit-details-marker]:hidden hover:bg-ink-5 focus-visible:bg-ink-5 active:bg-ink-5 active:transition-none group-open/bk:hover:bg-transparent group-open/bk:focus-visible:bg-transparent`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={ROOM_IMG[b.room]}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="size-10 shrink-0 rounded border border-hairline object-cover"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm/4.5 font-medium">
              {b.guest}
            </span>
            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs/4 text-ink-56">
              {/* the square means booked direct, as on the overview; a
                  whole-pixel size, like the hairlines — the rem size lands
                  on subpixels and renders a soft, lopsided edge */}
              {b.channel === "Your website" && (
                <span aria-hidden="true" className="size-[6px] shrink-0 bg-accent" />
              )}
              <span className="truncate">
                <span className="max-[600px]:hidden">{b.city}</span>
                <span className="hidden max-[600px]:inline">
                  {b.channel} · {b.stayLabel}
                </span>
              </span>
            </span>
          </span>
        </div>
        <div className="min-w-0 max-[600px]:hidden">
          <span className="block text-sm/4.5">{b.stayLabel}</span>
          <span className="mt-0.5 block truncate text-xs/4 text-ink-56">
            {b.nights} nights · {b.room}
          </span>
        </div>
        <div className="min-w-0 max-[800px]:hidden">
          <span className="block truncate text-sm/4.5">{b.channel}</span>
          <span className="mt-0.5 block truncate text-xs/4 text-ink-56">
            {b.channel === "Your website"
              ? b.referral === "Not recorded"
                ? "No recorded referral"
                : b.referral
              : "Not Autumn-attributed"}
          </span>
        </div>
        <div className="text-sm/4.5 font-medium max-[600px]:text-right">
          {money(b.value)}
          <span className="mt-0.5 hidden text-xs/4 font-normal text-ink-56 max-[600px]:block">
            {b.bookedLabel}
          </span>
        </div>
        <div className="text-right text-sm/4.5 text-ink-72 max-[600px]:hidden">
          {b.bookedLabel}
        </div>
        <ChevronDown
          size={12}
          className="text-ink-56 transition-transform group-open/bk:rotate-180"
        />
      </summary>
      <div className="mx-[calc(0.75rem-1px)] border-t border-hairline-2 pt-3 pb-4">
        {/* the fields ride the table's own column tracks */}
        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_5rem_4.375rem_1rem] items-start gap-4 max-[800px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5rem_4.375rem_1rem] max-[600px]:grid-cols-2 max-[600px]:gap-y-3">
          {(
            [
              ["Reservation", b.id],
              ["Status", b.status],
              ["Average nightly", money2(b.value / b.nights)],
              ["Device", b.device],
            ] as const
          ).map(([dt, dd], i) => (
            <div
              key={dt}
              /* Device starts on the Value column's track and may run
                 rightward under Booked */
              className={
                i === 3
                  ? "col-span-3 max-[800px]:col-span-2 max-[600px]:col-span-1"
                  : ""
              }
            >
              <div className="text-xs/4 font-medium text-ink-56">{dt}</div>
              <div className="mt-0.5 text-xs/4 text-ink-72">{dd}</div>
            </div>
          ))}
        </div>
        {b.fee > 0 && (
          /* the receipt sits apart, bottom right; tabular figures on the
             numbers only — the labels carry commas, which the tabular
             feature would widen to digit cells */
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-[20rem]">
              <dl className="text-sm/5">
                <div className="flex items-baseline justify-between gap-4 py-1">
                  <dt className="text-ink-56">Booking value</dt>
                  <dd className="text-ink-72 tabular-nums">{money2(b.value)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-1">
                  <dt className="text-ink-56">
                    {b.channel === "Your website"
                      ? "Autumn fee, estimated (13%)"
                      : `Channel commission, estimated (${Math.round(b.rate * 100)}%)`}
                  </dt>
                  <dd className="text-ink-72 tabular-nums">−{money2(b.fee)}</dd>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-hairline py-1.5 font-medium">
                  <dt>Value after estimated fee</dt>
                  <dd className="tabular-nums">{money2(b.value - b.fee)}</dd>
                </div>
                {b.attributed && (
                  <div className="flex items-baseline justify-between gap-4 py-1">
                    <dt className="text-ink-56">
                      Est. savings vs. 15% booking-site fee
                    </dt>
                    <dd className="text-ink-72 tabular-nums">
                      {money2(b.value * 0.15 - b.fee)}
                    </dd>
                  </div>
                )}
              </dl>
              <p className="mt-2.5 text-xs/4 text-ink-40">
                Sample fees, not a settled payout. Excludes taxes, payment
                processing and other costs.
              </p>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

export function BookingsView() {
  const [channel, setChannel] = useState<string>("all");
  const [city, setCity] = useState("");
  const [device, setDevice] = useState("");
  const [referral, setReferral] = useState("");
  const [sort, setSort] = useState<Sort>({ col: "booked", dir: -1 });
  const sortBy = (col: SortCol) =>
    setSort((s) => ({
      col,
      dir: s.col === col ? ((s.dir * -1) as 1 | -1) : SORT_DEFAULT[col],
    }));
  const [shown, setShown] = useState(PAGE);
  /* the header's fill fades in only once it actually sticks */
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    /* an IntersectionObserver here lags behind fast scrolling by a frame
       or more, leaving the pinned header see-through over the rows — the
       scroll event fires before paint, and flushSync commits the flip in
       that same frame */
    const el = sentinelRef.current;
    const scroller = el?.closest(".square-scroll");
    if (!el || !scroller) return;
    let last: boolean | null = null;
    /* flushSync is only legal outside React's own work — the mount check
       settles on the normal path */
    const check = (sync: boolean) => {
      const navH =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-h"
          )
        ) || 60;
      const next = el.getBoundingClientRect().top <= navH + 1;
      if (next !== last) {
        last = next;
        if (sync) flushSync(() => setStuck(next));
        else setStuck(next);
      }
    };
    check(false);
    const onEvent = () => check(true);
    scroller.addEventListener("scroll", onEvent, { passive: true });
    window.addEventListener("resize", onEvent);
    return () => {
      scroller.removeEventListener("scroll", onEvent);
      window.removeEventListener("resize", onEvent);
    };
  }, []);

  /* the nav's solid fill follows the header's pinned state, before paint */
  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-nav-solid", stuck);
    return () => document.documentElement.removeAttribute("data-nav-solid");
  }, [stuck]);

  /* mobile and tablet open the analytics as popups */
  const [panel, setPanel] = useState<"fees" | "stay" | "who" | null>(null);
  const panelRef = useRef<HTMLDialogElement>(null);
  const openPanel = (k: "fees" | "stay" | "who") => {
    setPanel(k);
    requestAnimationFrame(() => panelRef.current?.showModal());
  };


  const filtered = useMemo(() => {
    const rows = BOOKINGS.filter(
      (b) =>
        (channel === "all" || b.channel === channel) &&
        (city === "" || b.city === city) &&
        (device === "" || b.device === device) &&
        (referral === "" || b.referral === referral)
    );
    return rows.sort(
      (a, b) =>
        SORT_CMP[sort.col](a, b) * sort.dir || b.booked.localeCompare(a.booked)
    );
  }, [channel, city, device, referral, sort]);

  const visible = filtered.slice(0, shown);
  const filteredValue = filtered.reduce((t, b) => t + b.value, 0);
  const filteredFees = filtered.reduce((t, b) => t + b.fee, 0);
  const resetPage = () => {
    setShown(PAGE);
    /* A filter change rewrites the list. If the view is deep in the old
       rows, step back to the table's top deliberately — otherwise the
       shrinking page clamps the scroll wherever it happens to land. */
    const el = sentinelRef.current;
    const scroller = el?.closest(".square-scroll");
    if (el && scroller) {
      const navH =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-h"
          )
        ) || 60;
      const target =
        scroller.scrollTop + el.getBoundingClientRect().top - navH;
      if (scroller.scrollTop > target) scroller.scrollTop = target;
    }
  };

  /* Filter options come from the data alone: a value that appears in no
     booking is not offered, and that is the only rule. Filters never
     narrow each other's lists — an active filter with zero results must
     not empty the other menus. Device stays the full static set. */
  const channelOptions = BY_CHANNEL.filter(
    (c) => c.key === "all" || c.count > 0
  );
  const cityOptions = CITIES;
  const referralOptions = REFERRALS;

  const channelButtons = (
    <div role="group" aria-label="Filter bookings by channel">
      {channelOptions.map((c) => (
        <button
          key={c.key}
          type="button"
          aria-pressed={channel === c.key}
          onClick={() => {
            setChannel(c.key);
            resetPage();
          }}
          className="relative flex w-full cursor-pointer items-baseline justify-between gap-4 rounded-r py-2 pr-3 pl-3 text-left text-sm/4.5 text-ink-56 transition-colors duration-200 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:origin-top before:scale-y-0 before:bg-ink before:transition-transform before:duration-320 before:ease-(--ease) hover:bg-ink-5 active:bg-ink-5 active:transition-none aria-pressed:bg-ink-5 aria-pressed:font-medium aria-pressed:text-ink aria-pressed:before:scale-y-100"
        >
          <span className="min-w-0 truncate">{c.label}</span>
          <span className="text-ink-56 tabular-nums">{c.count}</span>
        </button>
      ))}
    </div>
  );

  const chips = (
    <>
      <MenuSelect
        label="City"
        active={city !== ""}
        value={city}
        onChange={(v) => {
          setCity(v);
          resetPage();
        }}
        options={[
          { value: "", label: "Any city" },
          ...cityOptions.map((c) => ({ value: c, label: c })),
        ]}
      />
      <MenuSelect
        label="Device"
        active={device !== ""}
        value={device}
        onChange={(v) => {
          setDevice(v);
          resetPage();
        }}
        options={[
          { value: "", label: "Any device" },
          ...DEVICES.map((d) => ({ value: d, label: d })),
        ]}
      />
      <MenuSelect
        label="Marketing referral"
        active={referral !== ""}
        value={referral}
        onChange={(v) => {
          setReferral(v);
          resetPage();
        }}
        options={[
          { value: "", label: "Any referral" },
          ...referralOptions.map((r) => ({ value: r, label: r })),
        ]}
      />
    </>
  );

  /* analytics bodies, shared by the rail's expanders and the popups */
  const feesBody = (
    <>
            {/* two tiers only: the row pair, and the small print */}
            <dl>
              {FEE_ROWS.map((r) => (
                <div
                  key={r.name}
                  className="flex items-baseline justify-between gap-4 py-1.5"
                >
                  <dt>
                    <span className="block text-sm/5 font-medium">{r.name}</span>
                    <span className="mt-0.5 block text-xs/4 text-ink-56">
                      {r.count} bookings · {money(r.value)}
                    </span>
                  </dt>
                  {/* no tabular figures: the digit-width commas make the
                      numbers read as a different face than the labels */}
                  <dd className="text-sm/5 font-medium">{money2(r.fee)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2.5 text-xs/4 text-ink-40">
              Sample rates: Booking.com 15%, Expedia 18%. Autumn 13% on
              attributed direct bookings only; no Autumn fee on booking-site
              reservations.
            </p>
            <details className="group/est mt-4">
              <summary className={`${NESTED_SUMMARY} group-open/est:text-ink`}>
                How savings are estimated
                <ChevronDown
                  size={11}
                  className="transition-transform group-open/est:rotate-180"
                />
              </summary>
              <div className="pt-1 pb-3">
                <dl className="max-w-[20rem] text-sm/5">
                  <div className="flex items-baseline justify-between py-1">
                    <dt className="text-ink-56">Booking-site fees at 15%</dt>
                    <dd className="text-ink-72">$3,207.00</dd>
                  </div>
                  <div className="flex items-baseline justify-between py-1">
                    <dt className="text-ink-56">Autumn&apos;s fee at 13%</dt>
                    <dd className="text-ink-72">−$1,965.60</dd>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between border-t border-hairline py-1.5 font-medium">
                    <dt>Estimated savings</dt>
                    <dd>$1,241.40</dd>
                  </div>
                </dl>
                <p className="mt-2.5 text-xs/4 text-ink-40">
                  Assumes all direct bookings would otherwise have used booking
                  sites charging 15%. Autumn&apos;s fee applies only to the 29
                  bookings linked to its marketing. Illustrative estimate, not
                  observed savings; taxes and payment processing excluded.
                </p>
              </div>
            </details>
    </>
  );

  const stayBody = (big: boolean) => (
    <>
            <StatBlock
              big={big}
              title="How far ahead"
              value="33"
              unit="days, typically"
              note="Half booked 33 days ahead or less."
            >
              <Histogram bins={AHEAD_BINS} peak={4} />
            </StatBlock>
            <StatBlock
              big={big}
              title="How long they stayed"
              value="2.3"
              unit="nights, on average"
              note="136 nights across 59 reservations."
            >
              <Histogram bins={NIGHT_BINS} peak={1} />
            </StatBlock>
            <StatBlock
              big={big}
              title="Average booking"
              value="$529"
              note="value per reservation"
            />
    </>
  );

  const whoBody = (
    /* each breakdown sits in a white card, the stay panel's treatment */
    <>
            <div className="rounded border border-hairline bg-white px-3 py-4">
              <h3 className="text-xs/4 font-medium text-ink-56">
                Where they came from
              </h3>
              <div className="mt-2">
                <RankedRows rows={CITY_TOP} />
              </div>
              <details className="group/more mt-1">
                <summary className={`${NESTED_SUMMARY} group-open/more:text-ink`}>
                  13 bookings from 5 other places
                  <ChevronDown
                    size={11}
                    className="transition-transform group-open/more:rotate-180"
                  />
                </summary>
                <div className="pt-1 pb-2">
                  <RankedRows rows={CITY_MORE} />
                </div>
              </details>
            </div>
            <div className="mt-2 rounded border border-hairline bg-white px-3 py-4">
              <h3 className="text-xs/4 font-medium text-ink-56">
                How they found you
              </h3>
              <div className="mt-2">
                <RankedRows rows={FOUND_YOU} />
              </div>
            </div>
            <div className="mt-2 rounded border border-hairline bg-white px-3 py-4">
              <h3 className="text-xs/4 font-medium text-ink-56">Booked on</h3>
              <div className="mt-2">
                <RankedRows rows={BOOKED_ON} />
              </div>
            </div>
    </>
  );

  /* the popup has room, so its stat type steps back up */
  const panels = [
    { key: "fees", title: "Channel fees & savings", scope: "59 reservations · All channels", body: feesBody, popupBody: <FeeInsights /> },
    { key: "stay", title: "Stay patterns", scope: "59 reservations · All channels", body: stayBody(false), popupBody: <StayInsights /> },
    { key: "who", title: "Direct guest breakdown", scope: "41 website bookings", body: whoBody, popupBody: <GuestInsights /> },
  ] as const;
  const active = panels.find((p) => p.key === panel);

  return (
    <>
      {/* ── the filter rail: the overview rail's mirror, on the left ── */}
      <aside
        aria-label="Filter bookings"
        className="square-scroll min-w-0 pt-29 pb-8 max-[1000px]:hidden"
      >
        <h2 className="mb-2 text-xs/4 font-medium text-ink-56">
          Booked through
        </h2>
        {channelButtons}
        <div className="mt-4 flex flex-wrap items-center gap-2">{chips}</div>
        <div className="mt-6 border-t border-hairline">
          {panels.map((p) => (
            <details key={p.key} className="group/an border-b border-hairline">
              <DisclosureSummary>
                <span>{p.title}</span>
                <ChevronDown
                  size={12}
                  className="ml-auto shrink-0 transition-transform group-open/an:rotate-180"
                />
              </DisclosureSummary>
              <div className="pb-4">{p.body}</div>
            </details>
          ))}
        </div>
      </aside>

      {/* ── the report column ── */}
      <div className="square-scroll min-w-0 pt-29 pb-8 max-[1000px]:px-(--margin) max-[1000px]:[scrollbar-gutter:auto]">
        <section aria-label="Your bookings">
          <p className="text-sm/5 text-ink-72">All time bookings</p>
          <h1 className="mt-2 max-w-[40.625rem] font-display text-display/[1.15] font-light tracking-[-0.02em] text-balance">
            See all of your bookings in one place.
          </h1>
          {/* the hero carries the rail's mobile row and the action row,
              then closes with its divider — the overview's anatomy */}
          <section
            aria-label="August report"
            className="mt-2 border-b border-hairline pb-6"
          >
            {/* on mobile and tablet the rail joins the hero: a horizontally
                scrolling row of its sections, with the edge fades */}
            <div className="mt-6 hidden max-[1000px]:block">
              <div className="relative -mx-(--margin)">
                <div className="square-scroll-x flex items-start gap-2 px-(--margin) pt-1 pb-2">
                  {panels.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => openPanel(p.key)}
                      className="flex w-60 shrink-0 cursor-pointer items-center gap-2 rounded border border-transparent bg-paper-2 px-3 py-4 text-left text-sm/4.5 font-medium transition-colors duration-200 hover:bg-ink-5 active:bg-ink-5 active:transition-none"
                    >
                      <span className="min-w-0 truncate">{p.title}</span>
                      <ArrowUpRight
                        size={12}
                        className="ml-auto shrink-0 text-ink-56"
                      />
                    </button>
                  ))}
                </div>
                <CarouselFades />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-4">
              <a
                href="/report-august.csv"
                download
                aria-label="Download bookings CSV"
                /* on phones the report lives in the nav sheet instead */
                className="touch-hit inline-flex items-center gap-1.5 text-xs/4 font-medium text-ink-56 max-[1000px]:text-sm/5 max-[600px]:hidden hover:text-ink active:text-ink"
              >
                <Download size={14} /> Download CSV
              </a>
            </div>
          </section>
        </section>

        <section aria-labelledby="list-title" className="mt-6 pb-2">
          {/* pins flush under the nav row itself — its pb-7 is blur zone,
              not spacing, so the header tucks into it. Sticky offsets
              resolve from the column's padding edge (pt-29 = 7.25rem), so
              the nav row height needs that backed out. */}
          {/* the count is read-once context: it scrolls away */}
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <div>
              <h2 id="list-title" className="text-base/5 font-medium">
                {filtered.length === BOOKINGS.length
                  ? "59 bookings this month"
                  : `${filtered.length} bookings of 59`}
              </h2>
              <p className="mt-1 text-xs/4 text-ink-56">
                {money(filteredValue)} value ·{" "}
                {money(Math.round(filteredFees))} est. fees
              </p>
            </div>
          </div>

          <div ref={sentinelRef} aria-hidden="true" />
          {/* pt keeps the pinned content off the nav's edge */}
          <div className="sticky top-[calc(var(--nav-h)-7.25rem)] z-10 pt-2">
            {/* the solid fill fades in fast once pinned — the speed is this
                opacity transition's duration; rows dissolve under its
                bottom edge on the dialog thead's paper fade */}
            {/* -top-px overlaps the nav's fill so rounding can't open a
                hairline seam between the two surfaces */}
            <div
              className={`pointer-events-none absolute inset-x-0 -top-px bottom-0 bg-paper transition-opacity duration-150 ${
                stuck ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="absolute inset-x-0 top-full h-3 bg-gradient-to-b from-paper to-transparent" />
            </div>

            {/* the filters ride the pinned header on mobile and tablet;
                the channel filter folds into a menu, ahead of the others.
                The row never wraps: it bleeds to the screen edges and
                scrolls sideways behind the edge fades, like the card rows */}
            <div className="relative -mx-(--margin) mb-5 hidden max-[1000px]:block">
              <div className="square-scroll-x flex items-center gap-2 px-(--margin)">
                <MenuSelect
                  label="Booked through"
                  active={channel !== "all"}
                  value={channel}
                  onChange={(v) => {
                    setChannel(v);
                    resetPage();
                  }}
                  options={channelOptions.map((c) => ({
                    value: c.key,
                    label: c.label,
                  }))}
                />
                {chips}
              </div>
              <CarouselFades />
            </div>
            <div
              /* pinned, the paper fade alone closes the header — the
                 hairline only draws in the flow state */
              className={`${ROW} relative border-b px-3 pb-2 text-xs/4 font-medium text-ink-56 transition-colors duration-150 ${
                stuck ? "border-transparent" : "border-hairline"
              }`}
            >
              {(
                [
                  ["guest", "Guest", ""],
                  ["stay", "Stay", "max-[600px]:hidden"],
                  ["channel", "Channel", "max-[800px]:hidden"],
                  ["value", "Value", ""],
                  ["booked", "Booked", "justify-end max-[600px]:hidden"],
                ] as [SortCol, string, string][]
              ).map(([col, label, cls]) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => sortBy(col)}
                  aria-label={`Sort by ${label.toLowerCase()}`}
                  className={`${HEAD_BTN} ${cls} ${
                    sort.col === col ? "text-ink" : ""
                  }`}
                >
                  {label}
                  <SortMark dir={sort.col === col ? sort.dir : 0} />
                </button>
              ))}
              <span />
            </div>
          </div>

          {/* the reserved height keeps the page from collapsing when a
              filter empties the list; the count line moves inside, top
              left, when there is nothing to list */}
          <div className="mt-2 min-h-[50dvh]">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs/4 text-ink-40">
                0 of 0 bookings shown
              </p>
            ) : (
              visible.map((b) => <BookingRow key={b.id} b={b} />)
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-4">
            {filtered.length > 0 && (
              <p className="text-xs/4 text-ink-40">
                {visible.length} of {filtered.length} bookings shown
              </p>
            )}
            {shown < filtered.length && (
              <button
                type="button"
                onClick={() => setShown((s) => s + 15)}
                className="touch-hit flex cursor-pointer items-center gap-1.5 py-1 text-xs/4 font-medium text-ink-56 transition-colors duration-200 max-[1000px]:text-sm/5 hover:text-ink active:text-ink"
              >
                Show more <ChevronDown size={11} />
              </button>
            )}
          </div>

          <p className="mt-6 max-w-[27.5rem] text-xs/4 text-ink-40">
            Reservations made in August 2026, including future stays. Each
            reservation is counted once by booking channel. Direct attribution
            uses a recorded marketing referral within 30 days; booking-site
            reservations are not credited to Autumn. Values exclude taxes and
            later cancellations. All reservations, referral records and channel
            fees are illustrative, not live synced data.
          </p>
        </section>
      </div>

      {/* the analytics popup, on the figures dialog's treatment */}
      <dialog
        ref={panelRef}
        aria-labelledby="booking-insight-title"
        aria-describedby="booking-insight-scope"
        /* no onClose reset: the body persists so the close animation keeps
           its height instead of collapsing on an emptied panel */
        onClick={(e) => {
          if (e.target === panelRef.current) panelRef.current.close();
        }}
        className={`figures-dialog ${insights.dialog}`}
      >
        <div className={insights.frame}>
        <header className={insights.header}>
          <div>
            <p className={insights.eyebrow}>August 2026</p>
            <h2 id="booking-insight-title">{active?.title}</h2>
            <p id="booking-insight-scope" className={insights.scope}>{active?.scope}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            title="Close"
            autoFocus
            onClick={() => panelRef.current?.close()}
            className={insights.close}
          >
            <Close size={18} />
          </button>
        </header>
          <div key={panel} className={insights.body}>
            {active?.popupBody}
          </div>
        </div>
      </dialog>
      {/* the build strips backdrop-filter from imported CSS; the dialog's
          backdrop blur rides along here like it does on the overview */}
      <style>{BACKDROP_BLUR}</style>
    </>
  );
}
