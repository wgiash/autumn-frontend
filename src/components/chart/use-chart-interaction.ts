"use client";
import { useEffect, useRef, useState } from "react";
import type { WeekDatum as Week } from "@/lib/contracts";
import type { Mode } from "./types";

export function useChartInteraction(
  mode: Mode,
  weeks: readonly Week[],
  openFigures: (weekStart: string) => void,
) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const tipRef = useRef<HTMLDivElement>(null);

  const [tip, setTip] = useState<{ i: number; left: number } | null>(null);

  const [tipVisible, setTipVisible] = useState(false);

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
    openFigures(weeks[best].start);
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

  return {
    wrapRef,
    tipRef,
    tip,
    tipVisible,
    selWeek,
    onClick,
    onMove,
    onPointerDown: (event: React.PointerEvent) => {
      lastPointerType.current = event.pointerType;
    },
    onPointerLeave: () => {
      if (selRef.current === null) setTipVisible(false);
    },
  };
}
