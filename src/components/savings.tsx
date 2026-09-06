import { ChevronDown } from "@/components/icons";
import { DisclosureSummary } from "@/components/ui/disclosure-summary";

const VISIBILITY = [
  {
    title: "Google visibility",
    value: 8,
    of: 12,
    note: "Tracked searches show your site in the top 10.",
  },
  {
    title: "AI visibility (GEO)",
    value: 5,
    of: 10,
    note: "Test answers mention your inn on ChatGPT or Perplexity.",
  },
  {
    title: "Website SEO checks",
    value: 24,
    of: 26,
    note: "Page, metadata and structured-data checks passed.",
  },
];

export function Savings() {
  return (
    <section aria-labelledby="impact-title" className="mt-6 border-t border-hairline pt-6">
      <div className="grid grid-cols-[minmax(0,1fr)_240px] items-start gap-8 max-md:grid-cols-1">
        <div>
          <h2 id="impact-title" className="text-base/5 font-medium">
            Estimated fee savings
          </h2>
          <p className="mt-2 text-2xl/7 font-light tracking-[-0.01em]">$1,241</p>
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
                  <dd className="text-ink-72">$3,207.00</dd>
                </div>
                <div className="flex items-baseline justify-between py-1">
                  <dt className="text-ink-56">Autumn&apos;s fee at 13%</dt>
                  <dd className="text-ink-72">−$1,965.60</dd>
                </div>
                <div className="mt-1 flex items-baseline justify-between border-t border-hairline py-1.5 font-medium">
                  <dt>Estimated savings</dt>
                  <dd>$1,241.40</dd>
                </div>
              </dl>
              <p className="mt-6 max-w-[27.5rem] text-xs/4 text-ink-40">
                Assumes all direct bookings would otherwise have used booking
                sites charging 15%. Autumn&apos;s fee applies only to the 29
                bookings linked to its marketing. Illustrative estimate, not
                observed savings; taxes and payment processing excluded.
              </p>
            </div>
          </details>

        </div>

        <div>
          <h3 className="text-xs/4 font-medium text-ink-56">
            Where bookings happened
          </h3>
          <p className="mt-2 text-2xl/7 font-light tracking-[-0.01em]">
            41 <span className="text-ink-56">of 59</span>
          </p>
          <p className="mt-1.5 text-xs/4 font-medium text-ink-72">
            booked on your website
          </p>
          <span
            role="img"
            aria-label="69 percent booked direct"
            className="mt-2.5 block h-1 w-full bg-ink-16"
          >
            <i className="block h-full w-[69%] bg-ink-72" />
          </span>
          <p className="mt-2 text-2xs/3.5 font-medium text-ink-56">
            18 booked through other sites
          </p>
        </div>
      </div>

      <details className="group/vis mt-6 border-t border-b border-hairline">
        <DisclosureSummary className="justify-between gap-4 text-base/5">
          <span>Search visibility</span>
          <span className="flex items-center gap-3 text-sm/5 text-ink-56">
            <span className="flex items-center gap-3 transition-opacity duration-200 group-open/vis:opacity-0">
              Google 67% <span className="text-ink-40">·</span> AI 50%
            </span>
            <ChevronDown
              size={12}
              className="transition-transform group-open/vis:rotate-180"
            />
          </span>
        </DisclosureSummary>
        <div className="pb-5">
          <div className="grid grid-cols-3 max-md:grid-cols-1">
            {VISIBILITY.map((v) => (
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
            Illustrative checks for August 2026 · this report&apos;s own test
            results, not official platform scores or a guarantee of bookings.
          </p>
        </div>
      </details>
    </section>
  );
}
