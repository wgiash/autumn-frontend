import { DIALOG_BACKDROP_CSS } from "../ui/dialog-backdrop";

/* Per-week hover wiring, regenerated from the prototype's inline style
   block: hovering a week's hotspot shows its tooltip, lights its bar, and
   raises the guide ruler. Week ids run 74-125 in the generated markup. */
export const HOVER_RULES =
  /* hover devices only: on touch, emulated hover sticks after a tap, so
     the lit week comes from the pinned selection instead */
  `@media (hover: hover){` +
  Array.from({ length: 52 }, (_, k) => {
    const i = 74 + k;
    return (
      `.chart-port svg:has(#hr-${i}:hover) .bar[data-week="${i}"]{fill:var(--accent)}` +
      `.chart-port svg:has(#hr-${i}:hover) #tp-${i} .tip-guide{opacity:1}`
    );
  }).join("") +
  `}` +
  Array.from({ length: 52 }, (_, k) => {
    const i = 74 + k;
    return (
      `.chart-port [data-sel="${i}"] .bar[data-week="${i}"]{fill:var(--accent)}` +
      `.chart-port [data-sel="${i}"] #tp-${i} .tip-guide{opacity:1}`
    );
  }).join("") +
  /* the build pipeline strips backdrop-filter from imported CSS, so the
     tooltip glass and the dialog backdrop's blur live here instead */
  `.chart-port .chart-tip{backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}` +
  DIALOG_BACKDROP_CSS;
