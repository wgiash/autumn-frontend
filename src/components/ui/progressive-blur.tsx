import React from "react";

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
  const veil = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const a = t * t * (3 - 2 * t);
    return `color-mix(in srgb, ${backgroundColor} ${Math.round(a * 100)}%, transparent) ${Math.round(t * 100)}%`;
  }).join(", ");

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
            `rgba(255, 255, 255, ${stopIndex === 1 || stopIndex === 2 ? 1 : 0}) ${pos * 100}%`
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

const Skiper41 = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-[#f5f4f3] text-black/40">
      <ProgressiveBlur position="top" backgroundColor="#f5f4f3" />
      <ProgressiveBlur position="bottom" backgroundColor="#f5f4f3" />

      <div className="flex h-[calc(100vh-1rem)] w-full flex-col items-center overflow-scroll">
        <div className="mt-42 grid content-start justify-items-center gap-6 text-center text-black">
          <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-white after:to-black after:content-['']">
            Scroll down to see the effect
          </span>
        </div>

        <div className="mt-24 w-full max-w-lg space-y-20 px-5 text-justify">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index}>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Obcaecati, reiciendis eum vitae nostrum, temporibus repudiandae
              voluptatibus, natus iure ipsa velit odit quibusdam illum. Quaerat
              cumque laudantium libero reprehenderit perferendis quo nulla
              voluptate? Repellat tenetur labore exercitationem dicta libero
              voluptate suscipit, iusto ea assumenda. Ipsa enim, quidem atque
              modi error eaque, debitis perferendis, hic iste libero dignissimos
              ea! Quod inventore beatae aspernatur nulla rem perferendis aperiam
              at debitis delectus odit quia animi ex mollitia vero molestias
              itaque deleniti, quos exercitationem consequatur assumenda dolor?
              Quod reiciendis in similique reprehenderit commodi quo blanditiis
              nobis hic ea optio illum placeat officia alias quasi autem earum
              quos obcaecati, voluptatum corporis quisquam. Quisquam iste, quas
              explicabo omnis harum aut quam adipisci, voluptatem saepe
              accusantium doloribus repellendus amet culpa magnam ex et dolores
              accusamus commodi facere aliquam voluptatum alias? Officia
              expedita ut vel? Beatae deserunt sequi id eos libero suscipit
              totam cum, sed architecto atque quisquam et incidunt quod fuga
              ullam repellat assumenda quos ab, voluptatum sint nesciunt? Ad
              sapiente est laborum quam sint eius sequi. Eum, veniam
              dignissimos.
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { ProgressiveBlur, Skiper41 };
