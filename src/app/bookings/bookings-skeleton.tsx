import { Skeleton } from "@/components/skeleton";

/* The bookings loading state: headings and column names are real, the
   counts, filters and rows are skeletons in the table's own rhythm. */
export function BookingsSkeleton() {
  return (
    <main
      aria-busy="true"
      className="mx-(--margin) grid h-dvh grid-cols-[var(--rail)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-x-9 max-[1000px]:mx-0 max-[1000px]:grid-cols-1"
    >
      <p role="status" className="sr-only">
        Loading bookings
      </p>
      {/* the wrappers carry the exact scroll-lane classes of the real
          page, so nothing changes width when the content arrives */}
      <aside className="square-scroll min-w-0 pt-29 pb-8 max-[1000px]:hidden">
        <h2 className="mb-2 text-xs/4 font-medium text-ink-56">
          Booked through
        </h2>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="mt-1 h-9 w-full first:mt-0" />
        ))}
        <div className="mt-4 flex flex-wrap gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-6 border-t border-hairline">
          {["Channel fees & savings", "Stay patterns", "Direct guest breakdown"].map(
            (t) => (
              <div
                key={t}
                className="my-2 border-b border-hairline py-2 pr-3 text-sm/4.5 font-medium"
              >
                {t}
              </div>
            )
          )}
        </div>
      </aside>

      <div className="square-scroll min-w-0 pt-29 pb-8 max-[1000px]:px-(--margin) max-[1000px]:[scrollbar-gutter:auto]">
        <p className="text-sm/5 text-ink-72">All time bookings</p>
        <h1 className="mt-2 max-w-[40.625rem] font-display text-display/[1.15] font-light tracking-[-0.02em] text-balance">
          See all of your bookings in one place.
        </h1>
        <div className="mt-2 border-b border-hairline pb-6">
          {/* the trigger row bleeds to the margin edge like the real one */}
          <div className="mt-6 hidden max-[1000px]:block">
            <div className="relative -mx-(--margin) overflow-hidden">
              <div className="flex gap-2 px-(--margin) pt-1 pb-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-13 w-60 shrink-0" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* the count cluster loads as one silhouette, not text bars */}
        <div className="mt-6">
          <Skeleton className="h-11 w-52" />
        </div>

        <div className="mt-5 mb-2 hidden gap-2 max-[1000px]:flex">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-26 rounded-full" />
          ))}
        </div>

        <div className="mt-2 grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_5rem_4.375rem_1rem] items-center gap-4 border-b border-hairline px-3 pb-2 text-xs/4 font-medium text-ink-56 max-[800px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5rem_4.375rem_1rem] max-[600px]:grid-cols-[minmax(0,1fr)_auto_1rem]">
          <span>Guest</span>
          <span className="max-[600px]:hidden">Stay</span>
          <span className="max-[800px]:hidden">Channel</span>
          <span>Value</span>
          <span className="text-right max-[600px]:hidden">Booked</span>
          <span />
        </div>

        {/* the table's first page is ten rows; every one holds its place */}
        <div className="mt-2">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="mb-1.5 h-16 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}
