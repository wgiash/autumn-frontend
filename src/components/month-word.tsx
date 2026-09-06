"use client";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/components/ui/motion";

/* The month name blur-emerges in place when a STEPPED month's screen
   mounts. The latch stays false through the first hydration, so the
   server-painted word never flashes a re-entrance over itself — only
   later mounts (client-side month swaps) animate. */
let pastHydration = false;

export function MonthWord({ children }: { children: string }) {
  const reduce = useReducedMotion();
  const [animates] = useState(() => pastHydration);
  useEffect(() => {
    pastHydration = true;
  }, []);
  if (!animates || reduce)
    return <span className="inline-block">{children}</span>;
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
