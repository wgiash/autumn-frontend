"use client";
import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/components/ui/motion";

/* The month name in the hero blur-emerges in place when a stepped month's
   screen mounts — one word, no slide, the house emergence. */
export function MonthWord({ children }: { children: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="inline-block"
      initial={reduce ? false : { opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.span>
  );
}
