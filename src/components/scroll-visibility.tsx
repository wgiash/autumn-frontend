"use client";
import { useEffect } from "react";

/* Tags any .square-scroll region with .is-scrolling while it scrolls, so its
   scrollbar thumb shows during keyboard or momentum scrolling too, not just
   under the pointer. Renders nothing. */
export function ScrollVisibility() {
  useEffect(() => {
    const timers = new Map<Element, number>();
    /* horizontal rows tag both edges; the carousel fades key off them */
    const tagEdgesX = (el: Element) => {
      el.classList.toggle(
        "at-end",
        el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
      );
      el.classList.toggle("off-start", el.scrollLeft > 2);
    };
    const onScroll = (e: Event) => {
      const el = e.target;
      if (!(el instanceof Element)) return;
      const isX =
        el.classList.contains("square-scroll-x") ||
        el.classList.contains("stage-scroll");
      if (!isX && !el.classList.contains("square-scroll")) return;
      el.classList.add("is-scrolling");
      if (isX) tagEdgesX(el);
      else {
        el.classList.toggle(
          "at-end",
          el.scrollTop + el.clientHeight >= el.scrollHeight - 2,
        );
        el.classList.toggle("off-start", el.scrollTop > 2);
      }
      window.clearTimeout(timers.get(el));
      timers.set(
        el,
        window.setTimeout(() => {
          el.classList.remove("is-scrolling");
          timers.delete(el);
        }, 700),
      );
    };
    /* a region with nothing to scroll forwards the wheel to the main
       column, so the rail never feels like a dead zone */
    const onWheel = (e: WheelEvent) => {
      const region = (e.target as Element).closest?.(".square-scroll");
      if (!region || region.scrollHeight > region.clientHeight + 1) return;
      const main = document.querySelector("main > .square-scroll");
      if (main && main !== region) main.scrollTop += e.deltaY;
    };
    /* Tapping anything in a horizontal card/pill row brings that item
       fully into view — the metric tabs' behavior, everywhere. "Nearest"
       keeps it minimal: an already-visible item doesn't move. (The stage
       tabs keep their own start-docking handler.) */
    const dockItem = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest?.("button, a, summary")) return;
      const row = t.closest(".square-scroll-x");
      if (!row || row.scrollWidth <= row.clientWidth + 1) return;
      let item: Element | null = t;
      while (item && item.parentElement !== row) item = item.parentElement;
      item?.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    };
    document.addEventListener("click", dockItem);
    document.addEventListener("scroll", onScroll, true);
    document.addEventListener("wheel", onWheel, { passive: true });
    /* rows start life untagged, and their sizes change without scrolling
       (a details opening, a breakpoint move), so edges retag on resize;
       rows mounted later (route changes) are picked up by the observer */
    const ro = new ResizeObserver((entries) =>
      entries.forEach((entry) => tagEdgesX(entry.target)),
    );
    const observed = new Set<Element>();
    const scan = () => {
      // ResizeObserver retains its targets. Release rows removed during navigation.
      for (const row of observed) {
        if (row.isConnected) continue;
        ro.unobserve(row);
        observed.delete(row);
        window.clearTimeout(timers.get(row));
        timers.delete(row);
        row.classList.remove("is-scrolling");
      }
      document
        .querySelectorAll(".square-scroll-x, .stage-scroll")
        .forEach((row) => {
          if (observed.has(row)) return;
          observed.add(row);
          tagEdgesX(row);
          ro.observe(row);
        });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("click", dockItem);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("wheel", onWheel);
      ro.disconnect();
      mo.disconnect();
      observed.clear();
      for (const [element, timer] of timers) {
        window.clearTimeout(timer);
        element.classList.remove("is-scrolling");
      }
      timers.clear();
    };
  }, []);
  return null;
}
