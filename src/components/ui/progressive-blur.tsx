import { smoothstepStops } from "./gradient";

type ProgressiveBlurProps = {
  className?: string;
  backgroundColor?: string;
  position?: "top" | "bottom";
  height?: string;
  /** Blur at the strong edge; it falls off progressively toward the other edge. */
  blurAmount?: string;
  layers?: number;
};

const ProgressiveBlur = ({
  className = "",
  backgroundColor = "#f5f4f3",
  position = "top",
  height = "150px",
  blurAmount = "24px",
  layers = 8,
}: ProgressiveBlurProps) => {
  const isTop = position === "top";
  const maxBlur = parseFloat(blurAmount) || 24;
  const count = Math.max(layers, 2);
  const segment = 1 / (count + 1);
  // 0deg runs bottom-to-top, so higher mask stops sit closer to the top edge.
  const angle = isTop ? 0 : 180;

  // The veil eases in (smoothstep) so it has no visible starting line.
  const veil = smoothstepStops(backgroundColor);

  return (
    <div
      className={`pointer-events-none absolute left-0 w-full select-none ${className}`}
      style={{
        [isTop ? "top" : "bottom"]: 0,
        height,
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${isTop ? "to top" : "to bottom"}, ${veil})`,
        }}
      />
      {Array.from({ length: count }).map((_, index) => {
        const stops = [
          index * segment,
          (index + 1) * segment,
          (index + 2) * segment,
          (index + 3) * segment,
        ].map(
          (pos, stopIndex) =>
            `rgba(255, 255, 255, ${stopIndex === 1 || stopIndex === 2 ? 1 : 0}) ${pos * 100}%`,
        );
        const mask = `linear-gradient(${angle}deg, ${stops.join(", ")})`;
        // Halving per layer: the weak edge lands at sub-pixel blur, so the
        // zone's boundary never shows as a sharp line.
        const blur = maxBlur / 2 ** (count - 1 - index);

        return (
          <div
            key={index}
            className="absolute inset-0"
            style={{
              maskImage: mask,
              WebkitMaskImage: mask,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
            }}
          />
        );
      })}
    </div>
  );
};

export { ProgressiveBlur };
