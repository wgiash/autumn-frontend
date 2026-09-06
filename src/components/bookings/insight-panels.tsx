"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { InsightsData } from "@/lib/contracts";
import { ChevronDown } from "@/components/icons";
import { TabButton } from "@/components/ui/tab-button";
import { DisclosureSummary } from "@/components/ui/disclosure-summary";
import insights from "../booking-insights.module.css";
import { money, money2 } from "./format";
import { type InsightPanelKey } from "./insight-data";

function InsightMetrics({
  items,
}: {
  items: { label: string; value: string; unit?: string }[];
}) {
  return (
    <dl className={insights.metrics}>
      {items.map(({ label, value, unit }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            {value}
            {unit && <span> {unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function InsightHistogram({
  bins,
  unit,
}: {
  bins: [string, number][];
  unit: string;
}) {
  const max = Math.max(...bins.map(([, count]) => count), 1);
  return (
    <div className={insights.histogram}>
      {bins.map(([label, count], i) => (
        <div
          key={label}
          className={insights.bin}
          role="img"
          aria-label={`${label} ${unit}: ${count} bookings`}
        >
          <div className={insights.barTrack} aria-hidden="true">
            <div
              className={insights.bar}
              data-peak={count === max}
              /* --bin-i drives the grow-in stagger when the dialog opens */
              style={
                {
                  height: `${(count / max) * 100}%`,
                  "--bin-i": i,
                } as React.CSSProperties
              }
            >
              <span>{count}</span>
            </div>
          </div>
          <span className={insights.binLabel} aria-hidden="true">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function InsightTable({
  rows,
  label,
  caption,
}: {
  rows: [string, number, number][];
  label: string;
  caption: string;
}) {
  return (
    <table className={insights.table}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{label}</th>
          <th scope="col">Bookings</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, count, value]) => (
          <tr key={name}>
            <th scope="row">{name}</th>
            <td>{count}</td>
            <td>{money(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FeeInsights({
  fees,
  monthName,
}: {
  fees: InsightsData["fees"];
  monthName: string;
}) {
  const totalFees = fees.channels.reduce((total, row) => total + row.fee, 0);
  const direct = fees.channels[0];
  const comparisonFee = direct.value * fees.comparisonRate;
  const savings = comparisonFee - direct.fee;
  const comparisonPct = Math.round(fees.comparisonRate * 100);
  const autumnPct = Math.round(fees.autumnRate * 100);
  return (
    <>
      <InsightMetrics
        items={[
          { label: "Estimated channel fees", value: money2(totalFees) },
          { label: "Estimated direct savings", value: money2(savings) },
        ]}
      />
      <section className={insights.section} aria-labelledby="fees-by-channel">
        <h3 id="fees-by-channel">Fees by channel</h3>
        <table className={`${insights.table} ${insights.feeTable}`}>
          <caption className="sr-only">
            {monthName} booking values and estimated fees by channel
          </caption>
          <thead>
            <tr>
              <th scope="col">Channel</th>
              <th scope="col" className={insights.desktopValue}>
                Booking value
              </th>
              <th scope="col">Est. fee</th>
            </tr>
          </thead>
          <tbody>
            {fees.channels.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  <span className={insights.channelName}>
                    {row.name === "Your website" && <i aria-hidden="true" />}
                    {row.name}
                  </span>
                  <span className={insights.rowMeta}>
                    {row.count} bookings
                    <span className={insights.mobileValue}>
                      {" "}
                      · {money(row.value)}
                    </span>
                  </span>
                  <span className={insights.rowMeta}>{row.kind}</span>
                </th>
                <td className={insights.desktopValue}>{money(row.value)}</td>
                <td>{money2(row.fee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <details className={insights.disclosure}>
        <DisclosureSummary>
          <span>How savings are estimated</span>
          <ChevronDown size={12} className="ml-auto" />
        </DisclosureSummary>
        <div className={insights.estimate}>
          <dl>
            <div>
              <dt>Booking-site fees at {comparisonPct}%</dt>
              <dd>{money2(comparisonFee)}</dd>
            </div>
            <div>
              <dt>Autumn&apos;s fee at {autumnPct}%</dt>
              <dd>−{money2(direct.fee)}</dd>
            </div>
            <div className={insights.receiptTotal}>
              <dt>Estimated savings</dt>
              <dd>{money2(savings)}</dd>
            </div>
          </dl>
          <p className={insights.note}>
            Compares a {comparisonPct}% booking-site fee on all {direct.count}{" "}
            direct bookings with Autumn&apos;s {autumnPct}% fee on the{" "}
            {fees.attributedCount} bookings attributed to its marketing. No
            Autumn fee is charged on booking-site reservations.
          </p>
        </div>
      </details>
      <p className={insights.footnote}>
        Illustrative fees and savings, not settled charges or observed savings.
        Taxes and payment processing excluded.
      </p>
    </>
  );
}

function StayInsights({
  stay,
  monthName,
}: {
  stay: InsightsData["stay"];
  monthName: string;
}) {
  return (
    <>
      <InsightMetrics
        items={[
          {
            label: "Typical lead time",
            value: String(stay.medianLeadDays),
            unit: "days",
          },
          {
            label: "Average stay",
            value: stay.avgNights.toFixed(1),
            unit: "nights",
          },
          { label: "Average booking", value: money(Math.round(stay.avgValue)) },
        ]}
      />
      <section className={insights.section} aria-labelledby="booking-lead-time">
        <div className={insights.sectionHeading}>
          <h3 id="booking-lead-time">How far ahead they booked</h3>
          <span>Bookings</span>
        </div>
        <InsightHistogram bins={stay.aheadBins} unit="days ahead" />
        <p className={insights.note}>
          Days before arrival. Half booked {stay.medianLeadDays} days ahead or
          less.
        </p>
      </section>
      <section
        className={insights.section}
        aria-labelledby="booking-stay-length"
      >
        <div className={insights.sectionHeading}>
          <h3 id="booking-stay-length">How long they stayed</h3>
          <span>Bookings</span>
        </div>
        <InsightHistogram bins={stay.nightBins} unit="" />
        <p className={insights.note}>
          {stay.totalNights} nights across {stay.totalReservations}{" "}
          reservations.
        </p>
      </section>
      <p className={insights.footnote}>
        All booking channels. Based on reservations made in {monthName},
        including future stays.
      </p>
    </>
  );
}

function GuestInsights({ guests }: { guests: InsightsData["guests"] }) {
  const [selected, setSelected] = useState(0);
  const panelsRef = useRef<HTMLDivElement>(null);
  const previousHeight = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const tabs = ["City", "Source", "Device"];
  const moreCount = guests.cityMore.reduce((total, [, count]) => total + count, 0);
  const selectTab = (index: number) => {
    if (index === selected) return;
    previousHeight.current =
      panelsRef.current?.getBoundingClientRect().height ?? null;
    setSelected(index);
  };

  useLayoutEffect(() => {
    const panels = panelsRef.current;
    const from = previousHeight.current;
    previousHeight.current = null;
    if (!panels || from === null || reduceMotion) return;
    const to = panels.getBoundingClientRect().height;
    if (Math.abs(to - from) < 1) return;

    // Return to intrinsic sizing after the tab switch so disclosures keep their native animation.
    const animation = panels.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      { duration: 300, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
    );
    return () => animation.cancel();
  }, [selected, reduceMotion]);

  const onTabKey = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectTab(next);
    document.getElementById(`guest-tab-${next}`)?.focus();
  };
  return (
    <>
      <InsightMetrics
        items={[
          { label: "Direct bookings", value: String(guests.directCount) },
          { label: "Direct booking value", value: money(guests.directValue) },
        ]}
      />
      <div
        className={insights.tabs}
        role="tablist"
        aria-label="Direct guest breakdown"
      >
        {tabs.map((label, index) => (
          <TabButton
            key={label}
            active={selected === index}
            id={`guest-tab-${index}`}
            role="tab"
            type="button"
            aria-selected={selected === index}
            aria-controls={`guest-panel-${index}`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => selectTab(index)}
            onKeyDown={(event) => onTabKey(event, index)}
            className="min-h-11 text-xs/4 font-medium"
          >
            {label}
          </TabButton>
        ))}
      </div>
      <div ref={panelsRef} className={insights.guestPanels}>
        <div className={insights.guestPanelsContent}>
          <section
            className={insights.guestSection}
            id="guest-panel-0"
            role="tabpanel"
            aria-labelledby="guest-tab-0"
            hidden={selected !== 0}
            tabIndex={0}
          >
            <h3 id="guest-cities">Where they came from</h3>
            <InsightTable
              rows={guests.cityTop}
              label="City"
              caption="Direct bookings by guest city"
            />
            <details className={insights.moreCities}>
              <DisclosureSummary>
                <span>{guests.cityMore.length} more cities</span>
                <span className="ml-auto text-xs/4 font-normal text-ink-56">
                  {moreCount} bookings
                </span>
                <ChevronDown size={12} />
              </DisclosureSummary>
              <InsightTable
                rows={guests.cityMore}
                label="City"
                caption={`Direct bookings from ${
                  ["zero", "one", "two", "three", "four", "five"][
                    guests.cityMore.length
                  ] ?? guests.cityMore.length
                } more cities`}
              />
            </details>
          </section>
          <section
            className={insights.guestSection}
            id="guest-panel-1"
            role="tabpanel"
            aria-labelledby="guest-tab-1"
            hidden={selected !== 1}
            tabIndex={0}
          >
            <h3 id="guest-discovery">How they found you</h3>
            <InsightTable
              rows={guests.foundYou}
              label="Source"
              caption="Direct bookings by discovery source"
            />
          </section>
          <section
            className={insights.guestSection}
            id="guest-panel-2"
            role="tabpanel"
            aria-labelledby="guest-tab-2"
            hidden={selected !== 2}
            tabIndex={0}
          >
            <h3 id="guest-devices">Booked on</h3>
            <InsightTable
              rows={guests.bookedOn}
              label="Device"
              caption="Direct bookings by device"
            />
          </section>
        </div>
      </div>
      <p className={insights.footnote}>
        Website bookings only. Booking.com and Expedia reservations are
        excluded. Illustrative guest data.
      </p>
    </>
  );
}

export function BookingInsightPanel({
  panel,
  data,
  monthLabel,
}: {
  panel: InsightPanelKey | null;
  data: InsightsData;
  monthLabel: string;
}) {
  const monthName = monthLabel.split(" ")[0];
  switch (panel) {
    case "fees":
      return <FeeInsights fees={data.fees} monthName={monthName} />;
    case "stay":
      return <StayInsights stay={data.stay} monthName={monthName} />;
    case "who":
      return <GuestInsights guests={data.guests} />;
    default:
      return null;
  }
}
