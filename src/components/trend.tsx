"use client";
import { useState } from "react";
import { CarouselFades } from "@/components/carousel-fades";
import { Chart } from "@/components/chart";
import { ArrowUp } from "@/components/icons";
import { TabButton } from "@/components/ui/tab-button";
import type { StageDatum, TrendData } from "@/lib/contracts";

const STAGE_LABELS: Record<StageDatum["key"], string> = {
  seen: "Seen",
  visited: "Visited",
  booked: "Booked direct",
  revenue: "Revenue",
};

type StageKey = StageDatum["key"];

/* the booked delta is an absolute count of reservations; the rest are
   year-over-year percentages */
const fmtValue = (s: StageDatum) =>
  (s.key === "revenue" ? "$" : "") + s.value.toLocaleString("en-US");
const fmtDelta = (s: StageDatum) =>
  s.delta.value === null ? "N/A" : s.delta.kind === "percent" ? `${s.delta.value}%` : `${s.delta.value}`;

export function Trend({ data }: { data: TrendData }) {
  const [stage, setStage] = useState<StageKey>("revenue");

  return (
    <section aria-labelledby="trend-title" className="mt-6">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 id="trend-title" className="text-base/5 font-medium">
          Your website, over time
        </h2>
      </div>

      <div className="stage-bleed relative">
        <div className="stage-scroll">
          <div
            role="group"
            aria-label="Chart metric for all website bookings"
            className="grid w-[min(100%,40rem)] grid-cols-[repeat(4,minmax(0,1fr))] max-[600px]:w-max max-[600px]:grid-cols-[repeat(4,max-content)]"
          >
            {data.stages.map((s) => {
              const { key } = s;
              return (
              <TabButton
                key={key}
                active={stage === key}
                aria-pressed={stage === key}
                onClick={(e) => {
                  setStage(key);
                  /* on the scrolling row, the tapped stage docks to the left
                     margin edge (scroll-padding); the last one can only
                     clamp to the row's end, so it lands right-aligned */
                  const row = e.currentTarget.closest(".stage-scroll");
                  if (row && row.scrollWidth > row.clientWidth)
                    e.currentTarget.scrollIntoView({
                      behavior: "smooth",
                      inline: "start",
                      block: "nearest",
                    });
                }}
                className="group/stage grid grid-rows-[16px_28px] gap-2 max-[600px]:pr-6"
              >
                <span className="text-xs/4 font-medium">
                  {STAGE_LABELS[key]}
                </span>
                <span className="flex min-h-7 items-baseline gap-2 text-2xl/7 font-light tracking-[-0.01em] whitespace-nowrap group-aria-pressed/stage:font-normal">
                  {fmtValue(s)}
                  <span className="inline-flex h-5 items-center gap-[3px] self-center rounded-full border border-hairline px-[7px] text-2xs/3.5 font-medium text-ink-72 whitespace-nowrap">
                    {s.delta.value !== null && <ArrowUp size={9} />}
                    {fmtDelta(s)}
                  </span>
                </span>
              </TabButton>
              );
            })}
          </div>
        </div>
        <CarouselFades />
      </div>

      <Chart mode={stage} data={data} />
    </section>
  );
}
