"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { MonthKey, MonthOption } from "@/lib/contracts";
import { ChevronLeft, ChevronRight } from "@/components/icons";

import { EASE } from "@/components/ui/motion";

const stepButton =
  "grid size-7 place-items-center rounded text-ink-56 outline-none enabled:cursor-pointer enabled:hover:bg-ink-5 enabled:hover:text-ink enabled:focus-visible:bg-ink-5 enabled:focus-visible:text-ink enabled:active:bg-ink-5 enabled:active:text-ink disabled:opacity-25 max-[1000px]:size-9";

/* the nav sheet's inverse tint: white on the dark glass, and the buttons
   and chevrons match the sheet's close button */
const stepButtonDark =
  "grid size-[2.125rem] place-items-center rounded text-white/70 outline-none enabled:cursor-pointer enabled:hover:bg-white/10 enabled:hover:text-white enabled:focus-visible:bg-white/10 enabled:focus-visible:text-white enabled:active:bg-white/10 enabled:active:text-white disabled:opacity-25";

/* Steps through the report months: the selection lives in the URL's
   ?month=, so stepping navigates and the server re-renders the report. */
export function MonthStepper({
  months,
  selected,
  onDark,
}: {
  months: MonthOption[];
  selected: MonthKey;
  onDark?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const found = months.findIndex((m) => m.value === selected);
  const index = found === -1 ? months.length - 1 : found;
  const [direction, setDirection] = useState(1);

  const step = (delta: number) => {
    setDirection(delta);
    const next = months[index + delta];
    if (next) router.push(pathname + "?month=" + next.value);
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
            key={months[index].label}
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
            {months[index].label}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        aria-label="Next month"
        disabled={index === months.length - 1}
        onClick={() => step(1)}
        className={stepClass}
      >
        <ChevronRight size={chevron} strokeWidth={2.75} />
      </button>
    </nav>
  );
}
