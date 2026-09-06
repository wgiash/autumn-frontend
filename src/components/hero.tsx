import { DetailLink } from "@/components/detail-link";
import { Download } from "@/components/icons";

const OUTCOMES: [string, React.ReactNode, string?][] = [
  ["Booking value from Autumn", "$15,120"],
  [
    "Share of bookings",
    <>
      29 <span className="text-ink-56">of 41</span>
    </>,
  ],
  /* phones only: three cells get too tight, and the completed row sits in
     the main flow there anyway */
  ["Actions completed", "6", "max-[600px]:hidden"],
];

export function Hero() {
  return (
    <section aria-label="Your August with Autumn">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm/5 text-ink-72">Good evening, Don</p>
          <h1 className="mt-2 max-w-[40.625rem] font-display text-display/[1.15] font-light tracking-[-0.02em] text-balance">
            Your August with Autumn.
          </h1>
        </div>

      </div>

      <section aria-label="Autumn's results" className="border-b border-hairline pb-6">
        {/* one joined card: no outline, the dim hairline between cells */}
        <dl className="grid grid-cols-3 rounded bg-paper-2 max-[600px]:grid-cols-2">
          {OUTCOMES.map(([dt, dd, cls]) => (
            <div
              key={dt}
              /* subgrid: the label row sizes to the tallest label, so a
                 wrapping label never pushes its number out of line */
              className={`row-span-2 grid min-w-0 grid-rows-subgrid border-l border-hairline-2 px-5 py-4 first:border-l-0 ${cls ?? ""}`}
            >
              <dt className="text-xs/4 font-medium text-ink-72">{dt}</dt>
              <dd className="mt-2 text-display/9 font-light">{dd}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center justify-end gap-4 max-[1000px]:gap-6">
          <a
            href="/report-august.csv"
            download
            aria-label="Download August report"
            /* on phones the report lives in the nav sheet instead */
            className="touch-hit inline-flex items-center gap-1.5 text-xs/4 font-medium text-ink-56 max-[1000px]:text-sm/5 max-[600px]:hidden hover:text-ink active:text-ink"
          >
            <Download size={14} /> Download August report
          </a>
          <DetailLink href="/bookings">View bookings</DetailLink>
        </div>
      </section>
    </section>
  );
}
