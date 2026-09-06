/* Both edge fades of a horizontal scroll row: a smoothstep gradient into
   paper, no blur. They must follow the row element as siblings so its
   at-end / off-start tags can drive them. The left side sits directly on
   card surface once scrolled, so it stays narrower than the trailing edge. */

const smoothstep = (to: string) =>
  `linear-gradient(${to}, ${Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const a = t * t * (3 - 2 * t);
    return `color-mix(in srgb, var(--paper) ${Math.round(a * 100)}%, transparent) ${Math.round(t * 100)}%`;
  }).join(", ")})`;

const LEFT = smoothstep("to left");
const RIGHT = smoothstep("to right");

export function CarouselFades() {
  return (
    <>
      <div
        aria-hidden="true"
        className="carousel-fade carousel-fade-l pointer-events-none absolute inset-y-0 left-0 w-10"
        style={{ background: LEFT }}
      />
      <div
        aria-hidden="true"
        className="carousel-fade carousel-fade-r pointer-events-none absolute inset-y-0 right-0 w-16"
        style={{ background: RIGHT }}
      />
    </>
  );
}
