import { useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { ChevronDown } from "@/components/icons";
import { BookingRow, ROW } from "./booking-row";
import { BookingFilters } from "./booking-filters";
import { money } from "./format";
import type { SortColumn } from "./model";
import type { BookingsController } from "./use-bookings";

const HEAD_BTN =
  "flex cursor-pointer items-center gap-1 outline-none transition-colors duration-150 hover:text-ink focus-visible:text-ink active:text-ink";

/* the stacked chevrons: the active direction at full strength, its
   opposite dimmed; both mid-tone while the column is not driving */
function SortMark({ dir }: { dir: 0 | 1 | -1 }) {
  const dim = (on: boolean) =>
    on ? "opacity-30" : dir === 0 ? "opacity-55" : "";
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 18 18"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M12.75 6L9 2.25 5.25 6"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={dim(dir === -1)}
      />
      <path
        d="M12.75 12L9 15.75 5.25 12"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={dim(dir === 1)}
      />
    </svg>
  );
}

export function BookingTable({
  controller,
  monthLabel,
}: {
  controller: BookingsController;
  monthLabel: string;
}) {
  const {
    filtered,
    visible,
    filteredValue,
    filteredFees,
    shown,
    totalCount,
    sort,
    sortBy,
    showMore,
    stuck,
    sentinelRef,
  } = controller;

  /* ids on screen last render: rows not in the set are newly appended
     (a broadened filter, a Show-more page) and stagger in */
  const seenIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    seenIds.current = new Set(visible.map((b) => b.id));
  });
  let newIndex = 0;

  return (
    <section aria-labelledby="list-title" className="mt-6 pb-2">
      {/* pins flush under the nav row itself — its pb-7 is blur zone,
              not spacing, so the header tucks into it. Sticky offsets
              resolve from the column's padding edge (pt-29 = 7.25rem), so
              the nav row height needs that backed out. */}
      {/* the count is read-once context: it scrolls away */}
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <h2 id="list-title" className="text-base/5 font-medium">
            {filtered.length === totalCount
              ? `${totalCount} bookings this month`
              : `${filtered.length} bookings of ${totalCount}`}
          </h2>
          <p className="mt-1 text-xs/4 text-ink-56">
            {money(filteredValue)} value · {money(Math.round(filteredFees))}{" "}
            est. fees
          </p>
        </div>
      </div>

      <div ref={sentinelRef} aria-hidden="true" />
      {/* pt keeps the pinned content off the nav's edge */}
      <div className="sticky top-[calc(var(--nav-h)-7.25rem)] z-10 pt-2">
        {/* the solid fill fades in fast once pinned — the speed is this
                opacity transition's duration; rows dissolve under its
                bottom edge on the dialog thead's paper fade */}
        {/* -top-px overlaps the nav's fill so rounding can't open a
                hairline seam between the two surfaces */}
        <div
          className={`pointer-events-none absolute inset-x-0 -top-px bottom-0 bg-paper transition-opacity duration-150 ${
            stuck ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-x-0 top-full h-3 bg-gradient-to-b from-paper to-transparent" />
        </div>

        {/* the filters ride the pinned header on mobile and tablet;
                the channel filter folds into a menu, ahead of the others.
                The row never wraps: it bleeds to the screen edges and
                scrolls sideways behind the edge fades, like the card rows */}
        <BookingFilters
          placement="toolbar"
          filters={controller.filters}
          options={controller.options}
          onChange={controller.changeFilter}
        />
        <div
          /* pinned, the paper fade alone closes the header — the
                 hairline only draws in the flow state */
          className={`${ROW} relative border-b px-3 pb-2 text-xs/4 font-medium text-ink-56 transition-colors duration-150 ${
            stuck ? "border-transparent" : "border-hairline"
          }`}
        >
          {(
            [
              ["guest", "Guest", ""],
              ["stay", "Stay", "max-[600px]:hidden"],
              ["channel", "Channel", "max-[800px]:hidden"],
              ["value", "Value", ""],
              ["booked", "Booked", "justify-end max-[600px]:hidden"],
            ] as [SortColumn, string, string][]
          ).map(([col, label, cls]) => (
            <button
              key={col}
              type="button"
              onClick={() => sortBy(col)}
              aria-label={
                sort.col === col
                  ? `Sort by ${label.toLowerCase()}, sorted ${
                      sort.dir === 1 ? "ascending" : "descending"
                    }`
                  : `Sort by ${label.toLowerCase()}`
              }
              className={`${HEAD_BTN} ${cls} ${
                sort.col === col ? "text-ink" : ""
              }`}
            >
              {label}
              <SortMark dir={sort.col === col ? sort.dir : 0} />
            </button>
          ))}
          <span />
        </div>
      </div>

      {/* the reserved height keeps the page from collapsing when a
              filter empties the list; the count line moves inside, top
              left, when there is nothing to list */}
      <div className="mt-2 min-h-[50dvh]">
        {filtered.length === 0 ? (
          <p className="px-3 py-3 text-xs/4 text-ink-40">
            0 of 0 bookings shown
          </p>
        ) : (
          /* rows glide to their new order on sort/filter (FLIP), leave
             with a fold, and freshly-appended pages stagger in */
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((b) => {
              const isNew = !seenIds.current.has(b.id);
              const delay = isNew ? Math.min(newIndex++ * 0.03, 0.3) : 0;
              return <BookingRow key={b.id} b={b} enterDelay={delay} />;
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        {filtered.length > 0 && (
          <p className="text-xs/4 text-ink-40">
            {visible.length} of {filtered.length} bookings shown
          </p>
        )}
        {shown < filtered.length && (
          <button
            type="button"
            onClick={showMore}
            className="touch-hit flex cursor-pointer items-center gap-1.5 py-1 text-xs/4 font-medium text-ink-56 outline-none transition-colors duration-200 max-[1000px]:text-sm/5 hover:text-ink focus-visible:text-ink active:text-ink"
          >
            Show more <ChevronDown size={11} />
          </button>
        )}
      </div>

      <p className="mt-6 max-w-[27.5rem] text-xs/4 text-ink-40">
        Reservations made in {monthLabel}, including future stays. Each
        reservation is counted once by booking channel. Direct attribution uses
        a recorded marketing referral within 30 days; booking-site reservations
        are not credited to Autumn. Values exclude taxes and later
        cancellations. All reservations, referral records and channel fees are
        illustrative, not live synced data.
      </p>
    </section>
  );
}
