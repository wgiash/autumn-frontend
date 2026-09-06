"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "@/components/icons";

import { EASE } from "@/components/ui/motion";

/* ── a real context menu on the tooltip's dark glass ── */
export function FilterSelect({
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
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const open = phase === "open";
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep the existing exit animation mounted without consulting refs during render.
  useEffect(() => {
    if (phase !== "closing") return;
    const timer = setTimeout(() => setPhase("closed"), 160);
    return () => clearTimeout(timer);
  }, [phase]);

  /* every close path funnels here: focus returns to the trigger whenever
     it was inside the widget, so closing never drops focus to <body> */
  const closeMenu = useCallback(() => {
    if (ref.current?.contains(document.activeElement)) {
      btnRef.current?.focus({ preventScroll: true });
    }
    setPhase("closing");
  }, []);

  /* The panel is fixed-positioned from the trigger's viewport box — it
     escapes any scroll container's clipping (the pills row scrolls
     sideways on phones) and never leaves the viewport: it slides along
     an edge it would poke past, and stays ANCHORED to the trigger when
     room runs out — shrinking to the space that exists and scrolling
     inside, rather than drifting up over its own pill. It only flips
     above the trigger when below is truly cramped and above is roomier. */
  const [pos, setPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxH?: number;
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
      const below = window.innerHeight - pad - (t.bottom + 6);
      const above = t.top - 6 - pad;
      /* flip only when below can't even fit a few options and above can
         fit meaningfully more; otherwise shrink in place below */
      if (h > below && below < 160 && above > below) {
        setPos({
          left,
          bottom: window.innerHeight - (t.top - 6),
          maxH: Math.min(above, window.innerHeight - 2 * pad),
        });
      } else {
        setPos({
          left,
          top: t.bottom + 6,
          maxH: Math.min(below, window.innerHeight - 2 * pad),
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
      if (!ref.current?.contains(e.target as Node)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      /* roving focus over the menu items; arrows wrap at the ends */
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        const items = Array.from(
          menuRef.current?.querySelectorAll<HTMLButtonElement>(
            '[role="menuitemradio"]',
          ) ?? [],
        );
        if (!items.length) return;
        e.preventDefault();
        const at = items.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? items.length - 1
              : e.key === "ArrowDown"
                ? at < 0
                  ? 0
                  : (at + 1) % items.length
                : at < 0
                  ? items.length - 1
                  : (at - 1 + items.length) % items.length;
        items[next]?.focus({ preventScroll: true });
      }
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
  }, [open, closeMenu]);

  /* opening lands focus on the checked option, so arrows start from the
     current value; preventScroll keeps the fixed panel's placement math */
  useEffect(() => {
    if (!open) return;
    const m = menuRef.current;
    const target =
      m?.querySelector<HTMLButtonElement>(
        '[role="menuitemradio"][aria-checked="true"]',
      ) ?? m?.querySelector<HTMLButtonElement>('[role="menuitemradio"]');
    target?.focus({ preventScroll: true });
  }, [open]);

  const current = options.find((o) => o.value === value) ?? options[0];

  /* the label swap borrows the month stepper's interaction, sliding
     toward the picked option */
  const idx = options.findIndex((o) => o.value === value);
  const [selection, setSelection] = useState({ index: idx, direction: 1 });
  if (selection.index !== idx) {
    setSelection({ index: idx, direction: idx > selection.index ? 1 : -1 });
  }
  const dir = selection.direction;

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
        onClick={() => (open ? closeMenu() : setPhase("open"))}
        className={`flex cursor-pointer items-center gap-1.5 overflow-clip rounded-full border border-hairline py-1.5 pr-3 pl-3 text-xs/4 font-medium text-ink-72 outline-none transition-colors duration-200 max-[1000px]:text-sm/4.5 hover:bg-ink-5 focus-visible:bg-ink-5 active:bg-ink-5 active:transition-none ${
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
      {phase !== "closed" && (
        <div
          ref={menuRef}
          role="menu"
          className={`menu-in fixed z-20 min-w-44 rounded p-1 ${
            open ? "" : "menu-out"
          }`}
          /* glassier than the tooltip: thinner ink, deeper blur */
          style={
            {
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              maxHeight: pos.maxH ?? "calc(100dvh - 16px)",
              overflowY: "auto",
              background: "color(display-p3 0.05 0.05 0.05 / 0.55)",
              backdropFilter: "blur(20px) saturate(1.15)",
              WebkitBackdropFilter: "blur(20px) saturate(1.15)",
              border: "0.5px solid rgb(255 255 255 / 0.16)",
              boxShadow: "0 4px 16px rgb(0 0 0 / 0.18)",
            } as React.CSSProperties
          }
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={o.value === value}
              onClick={() => {
                onChange(o.value);
                closeMenu();
              }}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[3px] px-2.5 py-1.5 text-left text-xs/4 font-medium whitespace-nowrap text-white/85 outline-none transition-colors duration-150 max-[1000px]:text-sm/4.5 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white active:bg-white/10 active:transition-none"
            >
              {o.label}
              {o.value === value && (
                <span
                  aria-hidden="true"
                  className="size-1 rounded-full bg-white/85"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
