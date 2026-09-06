"use client";
import { useRef, useState } from "react";
import type { Booking } from "@/components/bookings/model";
import type { InsightsData } from "@/lib/contracts";
import { CarouselFades } from "@/components/carousel-fades";
import { ArrowUpRight, Download } from "@/components/icons";
import { BookingFilters } from "./bookings/booking-filters";
import { BookingTable } from "./bookings/booking-table";
import { BookingInsightSidebar } from "./bookings/insight-sidebar";
import { BookingInsightDialog } from "./bookings/insight-dialog";
import { INSIGHT_PANELS, type InsightPanelKey } from "./bookings/insight-data";
import { useBookings } from "./bookings/use-bookings";

export function BookingsView({
  bookings: monthBookings,
  monthLabel,
  insights,
  reportUrl,
}: {
  bookings: Booking[];
  monthLabel: string;
  insights: InsightsData;
  reportUrl: string;
}) {
  const monthName = monthLabel.split(" ")[0];
  const bookings = useBookings(monthBookings);
  const [panel, setPanel] = useState<InsightPanelKey | null>(null);
  const panelRef = useRef<HTMLDialogElement>(null);
  const openPanel = (key: InsightPanelKey) => {
    setPanel(key);
    requestAnimationFrame(() => panelRef.current?.showModal());
  };

  return (
    <>
      <aside
        aria-label="Filter bookings"
        className="square-scroll min-w-0 pt-29 pb-8 max-[1000px]:hidden"
      >
        <BookingFilters
          placement="sidebar"
          filters={bookings.filters}
          options={bookings.options}
          onChange={bookings.changeFilter}
        />
        <BookingInsightSidebar data={insights} />
      </aside>
      <div className="square-scroll min-w-0 pt-29 pb-8 max-[1000px]:px-(--margin) max-[1000px]:[scrollbar-gutter:auto]">
        <section aria-label="Your bookings">
          <p className="text-sm/5 text-ink-72">All time bookings</p>
          <h1 className="mt-2 max-w-[40.625rem] font-display text-display/[1.15] font-light tracking-[-0.02em] text-balance">
            See all of your bookings in one place.
          </h1>
          {/* the hero carries the rail's mobile row and the action row,
              then closes with its divider — the overview's anatomy */}
          <section
            aria-label={`${monthName} report`}
            className="mt-2 border-b border-hairline pb-6"
          >
            {/* on mobile and tablet the rail joins the hero: a horizontally
                scrolling row of its sections, with the edge fades */}
            <div className="mt-6 hidden max-[1000px]:block">
              <div className="relative -mx-(--margin)">
                <div className="square-scroll-x flex items-start gap-2 px-(--margin) pt-1 pb-2">
                  {INSIGHT_PANELS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => openPanel(p.key)}
                      className="flex w-60 shrink-0 cursor-pointer items-center gap-2 rounded border border-transparent bg-paper-2 px-3 py-4 text-left text-sm/4.5 font-medium outline-none transition-colors duration-200 hover:bg-ink-5 focus-visible:bg-ink-5 active:bg-ink-5 active:transition-none"
                    >
                      <span className="min-w-0 truncate">{p.title}</span>
                      <ArrowUpRight
                        size={12}
                        className="ml-auto shrink-0 text-ink-56"
                      />
                    </button>
                  ))}
                </div>
                <CarouselFades />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-4">
              <a
                href={reportUrl}
                download
                aria-label="Download bookings CSV"
                /* on phones the report lives in the nav sheet instead */
                className="touch-hit inline-flex items-center gap-1.5 text-xs/4 font-medium text-ink-56 outline-none max-[1000px]:text-sm/5 max-[600px]:hidden hover:text-ink focus-visible:text-ink active:text-ink"
              >
                <Download size={14} /> Download CSV
              </a>
            </div>
          </section>
        </section>
        <BookingTable controller={bookings} monthLabel={monthLabel} />
      </div>
      <BookingInsightDialog
        panel={panel}
        panelRef={panelRef}
        data={insights}
        monthLabel={monthLabel}
      />
    </>
  );
}
