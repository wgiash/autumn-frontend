"use client";
import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/components/ui/motion";

/* The month name blur-emerges in place — on first load and again on every
   stepped month (the screen remounts per month). The server paints the
   initial hidden state inline, so the word never flashes visible first;
   the loading skeleton holds a month-shaped shimmer in the meantime. */
export function MonthWord({ children }: { children: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className="inline-block">{children}</span>;
  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.span>
  );
}
