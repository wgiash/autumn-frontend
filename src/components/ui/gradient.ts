export function smoothstepStops(color: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const t = index / 6;
    const alpha = t * t * (3 - 2 * t);
    return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent) ${Math.round(t * 100)}%`;
  }).join(", ");
}
