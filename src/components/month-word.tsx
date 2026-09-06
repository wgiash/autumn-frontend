/* The month name blur-emerges in place, on first load and on every
   stepped month (the screen remounts per month). Pure CSS on purpose:
   the animation starts with first paint, so there is no hydration seam
   for Chrome to stutter across, and reduced motion is honored in CSS. */
export function MonthWord({ children }: { children: string }) {
  return <span className="month-word-in inline-block">{children}</span>;
}
