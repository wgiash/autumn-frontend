"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateChartMarkup } from "@/lib/chart-gen";
import type { TrendData } from "@/lib/contracts";
import { ArrowUpRight } from "@/components/icons";
import { money } from "./ui/format";
import { weekLabel } from "./chart/format";
import { HOVER_RULES } from "./chart/styles";
import { useChartInteraction } from "./chart/use-chart-interaction";
import { WeeklyFigures } from "./chart/weekly-figures";
import type { Mode } from "./chart/types";

const MONTHS_FULL =
  "January February March April May June July August September October November December".split(
    " "
  );

const UNIT_LABELS: Record<Mode, string> = {
  seen: "Weekly ad views",
  visited: "Weekly website visits",
  booked: "Weekly direct bookings",
  revenue: "Weekly direct-booking revenue",
};

/* Legend figures per metric, from the contract: current values are the
   stage tabs' monthly sums, priors and expectations ride data.legend (the
   booked prior backs out of its absolute year-over-year delta). */
function legendFor(
  data: TrendData
): Record<Mode, { now: number; prior: number | null; next: number; money?: boolean; note?: string }> {
  const stage = (key: Mode) => data.stages.find((s) => s.key === key);
  const value = (key: Mode) => stage(key)?.value ?? 0;
  const booked = stage("booked");
  const bookedPrior =
    !booked || booked.delta.value === null ? null : booked.delta.kind === "absolute"
      ? booked.value - booked.delta.value
      : Math.round((booked?.value ?? 0) / (1 + (booked?.delta.value ?? 0) / 100));
  const { priorMonth, nextExpected } = data.legend;
  return {
    seen: { now: value("seen"), prior: priorMonth.adViews, next: nextExpected.adViews },
    visited: { now: value("visited"), prior: priorMonth.visits, next: nextExpected.visits },
    booked: {
      now: value("booked"),
      prior: bookedPrior,
      next: nextExpected.bookings,
      note: `${nextExpected.staysBookedCount} stays already booked`,
    },
    revenue: {
      now: value("revenue"),
      prior: priorMonth.rev,
      next: nextExpected.rev,
      money: true,
      note: `${nextExpected.staysBookedCount} stays booked · ${money(nextExpected.staysBookedValue)}`,
    },
  };
}

export function Chart({ mode, data }: { mode: Mode; data: TrendData }) {
  const figuresRef = useRef<HTMLDialogElement>(null);
  const [hlWeek, setHlWeek] = useState<string | null>(null);

  /* the pre-rendered plot, regenerated only when the month's data changes */
  const markup = useMemo(() => generateChartMarkup(data), [data]);
  const weeks = data.weeks;
  const monthName = MONTHS_FULL[Number(data.month.split("-")[1]) - 1];
  const nextMonthName = MONTHS_FULL[Number(data.month.split("-")[1]) % 12];

  const openFigures = (weekStart: string) => {
    setHlWeek(weekStart);
    const dlg = figuresRef.current;
    dlg?.showModal();
    requestAnimationFrame(() => {
      const row = dlg?.querySelector<HTMLTableRowElement>(
        `tr[data-week="${weekStart}"]`,
      );
      const scroller = dlg?.querySelector<HTMLElement>(".square-scroll");
      if (row && scroller)
        scroller.scrollTop =
          row.offsetTop - scroller.clientHeight / 2 + row.clientHeight / 2;
    });
  };

  /* the tooltip's data persists while hidden, so fading out never snaps it
     to the corner */
  const {
    wrapRef,
    tipRef,
    tip,
    tipVisible,
    selWeek,
    onClick,
    onMove,
    onPointerDown,
    onPointerLeave,
  } = useChartInteraction(mode, weeks, openFigures);

  /* like the context menus, the tooltip never hides under the chrome:
     when its spot scrolls beneath the nav it rides down inside the plot,
     pinned just under the bar */
  const [tipTop, setTipTop] = useState<number | null>(null);
  useEffect(() => {
    if (!tipVisible) return;
    const clamp = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const navH =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-h"
          )
        ) || 60;
      const wrapTop = wrap.getBoundingClientRect().top;
      setTipTop(Math.max(6, navH + 6 - wrapTop));
    };
    clamp();
    document.addEventListener("scroll", clamp, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", clamp);
    return () => {
      document.removeEventListener("scroll", clamp, true);
      window.removeEventListener("resize", clamp);
    };
  }, [tipVisible, wrapRef]);

  const week = tip ? weeks[tip.i] : null;

  const legend = legendFor(data)[mode];
  const fmt = (n: number | null) =>
    n === null ? "Unavailable" : legend.money ? money(n) : n.toLocaleString("en-US");

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
        onPointerDown={onPointerDown}
        onPointerMove={onMove}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
      >
        <div dangerouslySetInnerHTML={{ __html: markup }} />
        {/* one live tooltip gliding between weeks */}
        <div
          ref={tipRef}
          className="chart-tip is-live"
          style={{
            left: tip?.left ?? 0,
            top: tipTop ?? undefined,
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
                {week.priorBookings === null || week.priorRev === null
                  ? "Prior year unavailable"
                  : `Prior year: ${week.priorBookings} · ${money(week.priorRev)}`}
              </small>
              <button
                type="button"
                className="tip-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (tip) openFigures(weeks[tip.i].start);
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
            <span className="h-[1.5px] w-3.5 bg-accent" /> This {monthName}
          </div>
          <div className="mt-1.5 text-sm/5 font-medium">{fmt(legend.now)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-2xs/3.5 font-medium text-ink-56">
            <span className="w-3.5 border-t border-dashed border-ink-40" /> Last{" "}
            {monthName}
          </div>
          <div className="mt-1.5 text-sm/5 font-medium">
            {fmt(legend.prior)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-2xs/3.5 font-medium text-ink-56">
            <span className="w-3.5 border-t border-dashed border-accent" />{" "}
            {nextMonthName}, expected
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
          className="touch-hit -mr-1 flex cursor-pointer items-center gap-1.5 rounded px-1 py-2 text-xs/4 font-medium text-ink-56 underline decoration-1 underline-offset-[0.08em] outline-none transition-colors duration-200 max-[1000px]:text-sm/5 hover:text-ink focus-visible:text-ink active:text-ink"
        >
          Weekly figures <ArrowUpRight size={11} />
        </button>
      </div>

      <WeeklyFigures
        figuresRef={figuresRef}
        hlWeek={hlWeek}
        onClose={() => setHlWeek(null)}
        weeks={weeks}
      />
    </section>
  );
}
