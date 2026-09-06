import type { OutcomeData, VisibilityCheck } from "@/lib/contracts";
import { ChevronDown } from "@/components/icons";
import { DisclosureSummary } from "@/components/ui/disclosure-summary";
import { money, money2 } from "@/components/bookings/format";

export function Savings({
  outcomes,
  visibility,
  monthLabel,
}: {
  outcomes: OutcomeData;
  visibility: VisibilityCheck[];
  monthLabel: string;
}) {
  /* the receipt: what booking sites would have charged on the direct
     bookings, less Autumn's fee on the attributed ones */
  const comparisonFee = outcomes.directValue * 0.15;
  const savings = comparisonFee - outcomes.attributedFees;
  const directPct = Math.round(
    (outcomes.directCount / outcomes.totalCount) * 100,
  );
  const otherCount = outcomes.totalCount - outcomes.directCount;
  const pct = (v: VisibilityCheck) => Math.round((v.value / v.of) * 100);
  const google = visibility.find((v) => v.key === "google");
  const ai = visibility.find((v) => v.key === "ai");

  return (
    <section aria-labelledby="impact-title" className="mt-6 border-t border-hairline pt-6">
      <div className="grid grid-cols-[minmax(0,1fr)_240px] items-start gap-8 max-md:grid-cols-1">
        <div>
          <h2 id="impact-title" className="text-base/5 font-medium">
            Estimated fee savings
          </h2>
          <p className="mt-2 text-2xl/7 font-light tracking-[-0.01em]">
            {money(Math.round(savings))}
          </p>
          <p className="mt-1.5 text-xs/4 font-medium text-ink-56">
            After Autumn&apos;s fee, compared with a 15% booking-site fee.
          </p>

          <details className="group/method mt-4">
            <summary className="touch-hit flex w-fit cursor-pointer list-none items-center gap-[7px] py-1 text-xs/4 font-medium text-ink-56 transition-colors duration-200 max-[1000px]:text-sm/5 group-open/method:text-ink hover:text-ink active:text-ink [&::-webkit-details-marker]:hidden">
              How this is estimated
              <ChevronDown
                size={11}
                className="transition-transform group-open/method:rotate-180"
              />
            </summary>
            <div className="pt-1 pb-3">
              <dl className="max-w-[20rem] text-sm/5 tabular-nums">
                <div className="flex items-baseline justify-between py-1">
                  <dt className="text-ink-56">Booking-site fees at 15%</dt>
                  <dd className="text-ink-72">{money2(comparisonFee)}</dd>
                </div>
                <div className="flex items-baseline justify-between py-1">
                  <dt className="text-ink-56">Autumn&apos;s fee at 13%</dt>
                  <dd className="text-ink-72">−{money2(outcomes.attributedFees)}</dd>
                </div>
                <div className="mt-1 flex items-baseline justify-between border-t border-hairline py-1.5 font-medium">
                  <dt>Estimated savings</dt>
                  <dd>{money2(savings)}</dd>
                </div>
              </dl>
              <p className="mt-6 max-w-[27.5rem] text-xs/4 text-ink-40">
                Assumes all direct bookings would otherwise have used booking
                sites charging 15%. Autumn&apos;s fee applies only to the{" "}
                {outcomes.attributedCount} bookings linked to its marketing.
                Illustrative estimate, not observed savings; taxes and payment
                processing excluded.
              </p>
            </div>
          </details>

        </div>

        <div>
          <h3 className="text-xs/4 font-medium text-ink-56">
            Where bookings happened
          </h3>
          <p className="mt-2 text-2xl/7 font-light tracking-[-0.01em]">
            {outcomes.directCount}{" "}
            <span className="text-ink-56">of {outcomes.totalCount}</span>
          </p>
          <p className="mt-1.5 text-xs/4 font-medium text-ink-72">
            booked on your website
          </p>
          <span
            role="img"
            aria-label={`${directPct} percent booked direct`}
            className="mt-2.5 block h-1 w-full bg-ink-16"
          >
            <i
              className="block h-full bg-ink-72"
              style={{ width: `${directPct}%` }}
            />
          </span>
          <p className="mt-2 text-2xs/3.5 font-medium text-ink-56">
            {otherCount} booked through other sites
          </p>
        </div>
      </div>

      <details className="group/vis mt-6 border-t border-b border-hairline">
        <DisclosureSummary className="justify-between gap-4 text-base/5">
          <span>Search visibility</span>
          <span className="flex items-center gap-3 text-sm/5 text-ink-56">
            <span className="flex items-center gap-3 transition-opacity duration-200 group-open/vis:opacity-0">
              {google && <>Google {pct(google)}%</>}{" "}
              <span className="text-ink-40">·</span> {ai && <>AI {pct(ai)}%</>}
            </span>
            <ChevronDown
              size={12}
              className="transition-transform group-open/vis:rotate-180"
            />
          </span>
        </DisclosureSummary>
        <div className="pb-5">
          <div className="grid grid-cols-3 max-md:grid-cols-1">
            {visibility.map((v) => (
              <div
                key={v.title}
                className="border-l border-hairline px-5 first:border-l-0 first:pl-0 max-md:border-l-0 max-md:px-0 max-md:py-3"
              >
                <h3 className="text-xs/4 font-medium text-ink-56">{v.title}</h3>
                <p className="mt-2 text-2xl/7 font-normal tracking-[-0.01em]">
                  {v.value} <span className="font-light text-ink-56">of {v.of}</span>
                </p>
                <p className="mt-1.5 text-xs/4 text-ink-72">{v.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-[22.5rem] text-xs/4 text-ink-40">
            Illustrative checks for {monthLabel} · this report&apos;s own test
            results, not official platform scores or a guarantee of bookings.
          </p>
        </div>
      </details>
    </section>
  );
}
