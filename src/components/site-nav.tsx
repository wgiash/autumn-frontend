"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import type { MonthOption } from "@/lib/contracts";
import { Download } from "@/components/icons";
import { MonthStepper } from "@/components/month-stepper";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

import { EASE } from "@/components/ui/motion";
import { Leaf } from "@/components/leaf";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/bookings", label: "Bookings" },
] as const;

/* the homepage's hamburger, ported 1:1 — the outer lines fold into an X,
   the middle one dissolves */
function Burger({ open }: { open: boolean }) {
  const line = { transformBox: "fill-box", transformOrigin: "center" } as const;
  return (
    <svg width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M3 5H21"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        style={line}
        animate={{ rotate: open ? 45 : 0, y: open ? 7 : 0 }}
        transition={{ duration: 0.35, ease: EASE }}
      />
      <motion.path
        d="M3 12H21"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        style={line}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: 0.2, ease: EASE }}
      />
      <motion.path
        d="M3 19H21"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        style={line}
        animate={{ rotate: open ? -45 : 0, y: open ? -7 : 0 }}
        transition={{ duration: 0.35, ease: EASE }}
      />
    </svg>
  );
}

export function SiteNav({ months }: { months: MonthOption[] }) {
  const pathname = usePathname();
  /* the report month lives in the URL; anything unknown means the latest */
  const raw = useSearchParams().get("month");
  const selected = months.some((m) => m.value === raw)
    ? (raw as MonthOption["value"])
    : months[months.length - 1].value;
  const monthName = months
    .find((m) => m.value === selected)!
    .label.split(" ")[0];
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  /* Escape closes the sheet and hands focus back to the burger */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    /* the header's box extends past the nav row (the pb is blur zone), so
       it must not eat taps meant for content pinned beneath — only its
       actual controls take pointer events */
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 pb-7">
      {/* Backdrop: content scrolling under the bar blurs and tints toward
          paper at the top edge, fading out by the bar's bottom edge. */}
      <ProgressiveBlur
        position="top"
        backgroundColor="var(--paper)"
        height="100%"
        blurAmount="24px"
        className="nav-veil"
      />
      {/* goes solid the moment a pinned table header connects beneath
          (data-nav-solid on the root, set by the page); it covers only the
          nav row — the connected header's own fill continues from there */}
      <div
        aria-hidden="true"
        className="nav-solid-fill pointer-events-none absolute inset-x-0 top-0 h-(--nav-h) bg-paper opacity-0 transition-opacity duration-150"
      />

      {/* the phone sheet, ported from the homepage nav — static: it simply
          appears, under the bar row so the brand and burger stay up */}
      {menuOpen && (
        <nav
          aria-label="Menu"
          className="pointer-events-auto fixed inset-0 z-[5] flex flex-col px-(--margin) pb-6 pt-[calc(var(--nav-h)+16px)]"
          style={{
            background: "color(display-p3 0.075 0.063 0.063 / 90%)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
          }}
        >
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              aria-current={pathname === href ? "page" : undefined}
              /* the divider is its own layer so the wash's radius can't
                 curl its ends — it stays a square-ended straight rule */
              className="relative py-[1.125rem] text-[1.0625rem]/[1.375rem] font-normal tracking-[-0.01em] text-white outline-none focus-visible:bg-white/10 active:bg-white/10 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[rgb(255_255_255/0.16)]"
            >
              {label}
            </Link>
          ))}
          {/* pinned bottom, like the homepage sheet's CTA row */}
          <a
            href={`/api/report/${selected}`}
            download
            onClick={() => setMenuOpen(false)}
            className="mt-auto flex items-center justify-between rounded-lg border-[0.5px] border-white/20 px-3.5 py-3 text-sm/5 font-medium text-white outline-none transition-colors duration-200 hover:border-white/35 hover:bg-white/10 focus-visible:border-white/35 focus-visible:bg-white/10 active:bg-white/10 active:transition-none"
          >
            Download {monthName} report
            <Download size={14} />
          </a>
          <div className="mt-9 flex justify-center">
            <MonthStepper months={months} selected={selected} onDark />
          </div>
        </nav>
      )}

      <div className="pointer-events-auto relative z-10 mx-(--margin) flex h-(--nav-h) items-center gap-10 max-md:gap-5">
        {/* the brand is a mark, not a control */}
        <div
          className={`flex items-center gap-1.5 select-none ${menuOpen ? "text-white" : "text-ink"}`}
        >
          <Leaf />
          <span className="h-[1.6875rem] font-display text-xl/6 font-light tracking-[-0.04em]">
            autumn
          </span>
        </div>

        <nav
          aria-label="Main"
          className="flex items-center gap-6 max-md:gap-4.5 max-[600px]:hidden"
        >
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className="nav-link text-sm/4 font-medium outline-none"
            >
              <span className="nav-underline" aria-hidden="true">
                {label}
              </span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto max-[600px]:hidden">
          <MonthStepper months={months} selected={selected} />
        </div>

        <button
          ref={burgerRef}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className={`ml-auto hidden size-[2.125rem] cursor-pointer place-items-center rounded outline-none transition-colors duration-250 active:transition-none max-[600px]:grid ${
            menuOpen
              ? "bg-white/10 text-white hover:bg-white/15 focus-visible:bg-white/15 active:bg-white/15"
              : "text-ink hover:bg-ink-5 focus-visible:bg-ink-5 active:bg-ink-5"
          }`}
        >
          <Burger open={menuOpen} />
        </button>
      </div>
    </header>
  );
}
