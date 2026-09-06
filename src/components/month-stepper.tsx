"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "@/components/icons";

/* Steps through the report months. Display-only for now: the page content
   stays on August regardless of the selection. */
const MONTHS = [
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
  "August 2026",
];

const EASE = [0.22, 0.61, 0.36, 1] as const;

const stepButton =
  "grid size-7 place-items-center rounded text-ink-56 enabled:cursor-pointer enabled:hover:bg-ink-5 enabled:hover:text-ink enabled:active:bg-ink-5 enabled:active:text-ink disabled:opacity-25 max-[1000px]:size-9";

/* the nav sheet's inverse tint: white on the dark glass, and the buttons
   and chevrons match the sheet's close button */
const stepButtonDark =
  "grid size-[2.125rem] place-items-center rounded text-white/70 enabled:cursor-pointer enabled:hover:bg-white/10 enabled:hover:text-white enabled:active:bg-white/10 enabled:active:text-white disabled:opacity-25";

export function MonthStepper({ onDark }: { onDark?: boolean }) {
  const [index, setIndex] = useState(MONTHS.length - 1);
  const [direction, setDirection] = useState(1);

  const step = (delta: number) => {
    setDirection(delta);
    setIndex((current) => current + delta);
  };

  const stepClass = onDark ? stepButtonDark : stepButton;
  const chevron = onDark ? 16 : 14;

  return (
    <nav
      aria-label="Report month"
      className={`flex items-center gap-1 ${onDark ? "text-white" : ""}`}
    >
      <button
        type="button"
        aria-label="Previous month"
        disabled={index === 0}
        onClick={() => step(-1)}
        className={stepClass}
      >
        <ChevronLeft size={chevron} strokeWidth={2.75} />
      </button>
      {/* both labels share one grid cell, so enter and exit scale about the
          exact same center point */}
      <span className="grid min-w-30 px-1">
        <AnimatePresence initial={false} custom={direction}>
          <motion.span
            key={MONTHS[index]}
            custom={direction}
            variants={{
              enter: (d: number) => ({
                y: 16 * d,
                opacity: 0,
                scale: 0.9,
                filter: "blur(5px)",
              }),
              center: { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
              exit: (d: number) => ({
                y: -16 * d,
                opacity: 0,
                scale: 0.9,
                filter: "blur(5px)",
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
            className="block text-center text-sm/4 font-medium whitespace-nowrap [grid-area:1/1]"
          >
            {MONTHS[index]}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        aria-label="Next month"
        disabled={index === MONTHS.length - 1}
        onClick={() => step(1)}
        className={stepClass}
      >
        <ChevronRight size={chevron} strokeWidth={2.75} />
      </button>
    </nav>
  );
}
