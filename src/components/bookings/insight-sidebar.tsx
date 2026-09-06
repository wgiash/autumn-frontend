import type { InsightsData } from "@/lib/contracts";
import { ChevronDown } from "@/components/icons";
import { DisclosureSummary } from "@/components/ui/disclosure-summary";
import { money, money2 } from "./format";
import { INSIGHT_PANELS } from "./insight-data";

const NESTED_SUMMARY =
  "touch-hit flex w-fit cursor-pointer list-none items-center gap-[7px] py-1 text-xs/4 font-medium text-ink-56 outline-none transition-colors duration-200 max-[1000px]:text-sm/5 hover:text-ink focus-visible:text-ink active:text-ink [&::-webkit-details-marker]:hidden";

/* the tallest bar carries the accent, like the chart's selected column */
const argmax = (bins: [string, number][]) =>
  bins.reduce((best, [, n], i) => (n > bins[best][1] ? i : best), 0);

function RankedRows({ rows }: { rows: [string, number, number][] }) {
  return (
    <>
      {rows.map(([name, count, value]) => (
        <div key={name} className="flex items-baseline gap-3 py-1 text-sm/5">
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <span className="w-6 text-right text-ink-56 tabular-nums">
            {count}
          </span>
          <span className="w-16 text-right font-medium tabular-nums">
            {money(value)}
          </span>
        </div>
      ))}
    </>
  );
}

function Histogram({ bins, peak }: { bins: [string, number][]; peak: number }) {
  const max = Math.max(...bins.map(([, n]) => n));
  return (
    /* the peak carries the accent, like the chart's selected column */
    <div className="mt-5 mb-2 max-w-[16rem]">
      <div className="flex h-10 items-end gap-1">
        {bins.map(([label, n], i) => (
          <span
            key={label}
            role="img"
            aria-label={`${label}: ${n} bookings`}
            className={`flex-1 ${i === peak ? "bg-accent" : "bg-ink-16"}`}
            style={{ height: `${Math.max((n / max) * 100, n > 0 ? 8 : 3)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {bins.map(([label]) => (
          <span
            key={label}
            className="flex-1 text-center text-2xs/3.5 text-ink-40"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatBlock({
  title,
  value,
  unit,
  note,
  children,
}: {
  title: string;
  value: string;
  unit?: string;
  note: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-2 rounded border border-hairline bg-white px-3 py-4 first:mt-0">
      <h3 className="text-xs/4 font-medium text-ink-56">{title}</h3>
      <p className="mt-1.5 text-base/5 font-medium">
        {value}{" "}
        {unit && <span className="font-normal text-ink-56">{unit}</span>}
      </p>
      {children}
      <p className="mt-2 text-xs/4 text-ink-72">{note}</p>
    </div>
  );
}

function FeesSummary({ fees }: { fees: InsightsData["fees"] }) {
  /* the same receipt as the dialog, from the same slice */
  const direct = fees.channels[0];
  const comparisonFee = direct.value * fees.comparisonRate;
  const savings = comparisonFee - direct.fee;
  const comparisonPct = Math.round(fees.comparisonRate * 100);
  const autumnPct = Math.round(fees.autumnRate * 100);
  return (
    <>
      {/* two tiers only: the row pair, and the small print */}
      <dl>
        {fees.channels.map((r) => (
          <div
            key={r.name}
            className="flex items-baseline justify-between gap-4 py-1.5"
          >
            <dt>
              <span className="block text-sm/5 font-medium">{r.name}</span>
              <span className="mt-0.5 block text-xs/4 text-ink-56">
                {r.count} bookings · {money(r.value)}
              </span>
            </dt>
            {/* no tabular figures: the digit-width commas make the
                      numbers read as a different face than the labels */}
            <dd className="text-sm/5 font-medium">{money2(r.fee)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 text-xs/4 text-ink-40">
        Sample rates: Booking.com 15%, Expedia 18%. Autumn {autumnPct}% on
        attributed direct bookings only; no Autumn fee on booking-site
        reservations.
      </p>
      <details className="group/est mt-4">
        <summary className={`${NESTED_SUMMARY} group-open/est:text-ink`}>
          How savings are estimated
          <ChevronDown
            size={11}
            className="transition-transform group-open/est:rotate-180"
          />
        </summary>
        <div className="pt-1 pb-3">
          <dl className="max-w-[20rem] text-sm/5">
            <div className="flex items-baseline justify-between py-1">
              <dt className="text-ink-56">
                Booking-site fees at {comparisonPct}%
              </dt>
              <dd className="text-ink-72">{money2(comparisonFee)}</dd>
            </div>
            <div className="flex items-baseline justify-between py-1">
              <dt className="text-ink-56">
                Autumn&apos;s fee at {autumnPct}%
              </dt>
              <dd className="text-ink-72">−{money2(direct.fee)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-hairline py-1.5 font-medium">
              <dt>Estimated savings</dt>
              <dd>{money2(savings)}</dd>
            </div>
          </dl>
          <p className="mt-2.5 text-xs/4 text-ink-40">
            Assumes all direct bookings would otherwise have used booking sites
            charging {comparisonPct}%. Autumn&apos;s fee applies only to the{" "}
            {fees.attributedCount} bookings linked to its marketing.
            Illustrative estimate, not observed savings; taxes and payment
            processing excluded.
          </p>
        </div>
      </details>
    </>
  );
}

function StaySummary({ stay }: { stay: InsightsData["stay"] }) {
  return (
    <>
      <StatBlock
        title="How far ahead"
        value={String(stay.medianLeadDays)}
        unit="days, typically"
        note={`Half booked ${stay.medianLeadDays} days ahead or less.`}
      >
        <Histogram bins={stay.aheadBins} peak={argmax(stay.aheadBins)} />
      </StatBlock>
      <StatBlock
        title="How long they stayed"
        value={stay.avgNights.toFixed(1)}
        unit="nights, on average"
        note={`${stay.totalNights} nights across ${stay.totalReservations} reservations.`}
      >
        <Histogram bins={stay.nightBins} peak={argmax(stay.nightBins)} />
      </StatBlock>
      <StatBlock
        title="Average booking"
        value={money(Math.round(stay.avgValue))}
        note="value per reservation"
      />
    </>
  );
}

function GuestSummary({ guests }: { guests: InsightsData["guests"] }) {
  const moreCount = guests.cityMore.reduce(
    (total, [, count]) => total + count,
    0,
  );
  return (
    /* each breakdown sits in a white card, the stay panel's treatment */
    <>
      <div className="rounded border border-hairline bg-white px-3 py-4">
        <h3 className="text-xs/4 font-medium text-ink-56">
          Where they came from
        </h3>
        <div className="mt-2">
          <RankedRows rows={guests.cityTop} />
        </div>
        <details className="group/more mt-1">
          <summary className={`${NESTED_SUMMARY} group-open/more:text-ink`}>
            {moreCount} bookings from {guests.cityMore.length} other places
            <ChevronDown
              size={11}
              className="transition-transform group-open/more:rotate-180"
            />
          </summary>
          <div className="pt-1 pb-2">
            <RankedRows rows={guests.cityMore} />
          </div>
        </details>
      </div>
      <div className="mt-2 rounded border border-hairline bg-white px-3 py-4">
        <h3 className="text-xs/4 font-medium text-ink-56">
          How they found you
        </h3>
        <div className="mt-2">
          <RankedRows rows={guests.foundYou} />
        </div>
      </div>
      <div className="mt-2 rounded border border-hairline bg-white px-3 py-4">
        <h3 className="text-xs/4 font-medium text-ink-56">Booked on</h3>
        <div className="mt-2">
          <RankedRows rows={guests.bookedOn} />
        </div>
      </div>
    </>
  );
}

export function BookingInsightSidebar({ data }: { data: InsightsData }) {
  return (
    <div className="mt-6 border-t border-hairline">
      {INSIGHT_PANELS.map((panel) => (
        <details key={panel.key} className="group/an border-b border-hairline">
          <DisclosureSummary>
            <span>{panel.title}</span>
            <ChevronDown
              size={12}
              className="ml-auto shrink-0 transition-transform group-open/an:rotate-180"
            />
          </DisclosureSummary>
          <div className="pb-4">
            {panel.key === "fees" ? (
              <FeesSummary fees={data.fees} />
            ) : panel.key === "stay" ? (
              <StaySummary stay={data.stay} />
            ) : (
              <GuestSummary guests={data.guests} />
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
