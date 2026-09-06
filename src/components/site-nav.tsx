"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Download } from "@/components/icons";
import { MonthStepper } from "@/components/month-stepper";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

const EASE = [0.22, 0.61, 0.36, 1] as const;

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/bookings", label: "Bookings" },
] as const;

function Leaf() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 14 12.5"
      width="0.875rem"
      height="0.78125rem"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M0.563 12.5L0.563 9.505 6.981 4.9 0.443 8.067C0.197 7.652 0.136 6.896 0.136 6.568 0.429 2.93 2.783 1.216 3.923 0.811 6.66-0.432 11.461 0.025 13.514 0.409 14.052 2.989 11.58 4.554 10.277 5.016L12.781 5.016C12.539 6.903 9.951 7.835 8.689 8.067L11.377 8.067C10.741 9.309 9.403 10.234 8.81 10.543 6.709 11.878 3.454 11.368 2.09 10.943L2.09 12.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

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

export function SiteNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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
              className="relative py-[1.125rem] text-[1.0625rem]/[1.375rem] font-normal tracking-[-0.01em] text-white active:bg-white/10 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[rgb(255_255_255/0.16)]"
            >
              {label}
            </Link>
          ))}
          {/* pinned bottom, like the homepage sheet's CTA row */}
          <a
            href="/report-august.csv"
            download
            onClick={() => setMenuOpen(false)}
            className="mt-auto flex items-center justify-between rounded-lg border-[0.5px] border-white/20 px-3.5 py-3 text-sm/5 font-medium text-white transition-colors duration-200 hover:border-white/35 hover:bg-white/10 active:bg-white/10 active:transition-none"
          >
            Download August report
            <Download size={14} />
          </a>
          <div className="mt-9 flex justify-center">
            <MonthStepper onDark />
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
              className="nav-link text-sm/4 font-medium"
            >
              <span className="nav-underline" aria-hidden="true">
                {label}
              </span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto max-[600px]:hidden">
          <MonthStepper />
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className={`ml-auto hidden size-[2.125rem] cursor-pointer place-items-center rounded transition-colors duration-250 active:transition-none max-[600px]:grid ${
            menuOpen
              ? "bg-white/10 text-white hover:bg-white/15 active:bg-white/15"
              : "text-ink hover:bg-ink-5 active:bg-ink-5"
          }`}
        >
          <Burger open={menuOpen} />
        </button>
      </div>
    </header>
  );
}
