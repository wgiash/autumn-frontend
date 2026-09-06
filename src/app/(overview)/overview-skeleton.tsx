import { Greeting } from "@/components/greeting";
import { Skeleton } from "@/components/skeleton";

/* The overview's loading state: the chrome is real, skeletons stand only
   where data lands — the outcome figures, the chart, the recent rows and
   the rail's cards. The real screen fades in over it (app/template.tsx). */
export function OverviewSkeleton({ monthLabel }: { monthLabel?: string }) {
  const monthName = monthLabel?.split(" ")[0];
  return (
    <main
      aria-busy="true"
      className="mx-(--margin) grid h-dvh grid-cols-[minmax(0,1fr)_var(--rail)] grid-rows-[minmax(0,1fr)] gap-x-9 max-[1000px]:mx-0 max-[1000px]:grid-cols-1"
    >
      <p role="status" className="sr-only">
        Loading your report
      </p>
      {/* the wrappers carry the exact scroll-lane classes of the real
          page, so nothing changes width when the content arrives */}
      <div className="square-scroll w-full max-w-(--max) min-w-0 justify-self-center pt-29 pb-30 max-[1000px]:max-w-none max-[1000px]:px-(--margin) max-[1000px]:[scrollbar-gutter:auto]">
        <Greeting name="Don" />
        <h1 className="mt-2 max-w-[40.625rem] font-display text-display/[1.15] font-light tracking-[-0.02em] text-balance">
          {/* the month is data: named when the page already knows it, a
              month-shaped shimmer when the route-level fallback doesn't */}
          Your{" "}
          {monthName ?? (
            <Skeleton className="inline-block h-[0.8em] w-[3.2em] translate-y-[0.06em] align-baseline" />
          )}{" "}
          with Autumn.
        </h1>

        {/* every skeleton is the silhouette of a container that loads in —
            the joined outcomes card, the chart, the savings block, the
            booking rows — never a text-shaped bar */}
        <section className="mt-6 border-b border-hairline pb-6">
          <Skeleton className="h-23 w-full" />
        </section>

        {/* on mobile and tablet the rail joins the flow: the review note,
            the planned card row and the completed shelf all hold their
            places */}
        <div className="hidden max-[1000px]:block">
          <section className="mt-6">
            <section className="border-b border-hairline pb-6">
              <h2 className="mb-4 text-base/5 font-medium">
                Needs your review
              </h2>
              <Skeleton className="h-24 w-full" />
            </section>
            <div className="my-2 flex items-center gap-2 py-2">
              <span className="text-sm/4.5 font-medium">Planned</span>
              <Skeleton className="h-4.5 w-6 rounded-full" />
            </div>
            <div className="relative -mx-(--margin) overflow-hidden">
              <div className="flex gap-2 px-(--margin) pt-1 pb-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-28 w-72 shrink-0" />
                ))}
              </div>
            </div>
            <div className="mt-6 border-t border-b border-hairline">
              <div className="my-2 flex items-center gap-2 py-2">
                <span className="text-sm/4.5 font-medium">
                  Completed in August
                </span>
                <Skeleton className="h-4.5 w-6 rounded-full" />
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6">
          <h2 className="mb-5 text-base/5 font-medium">
            Your website, over time
          </h2>
          {/* the funnel tabs row, then the chart plot, at measured size */}
          <Skeleton className="h-18 w-full" />
          <Skeleton className="mt-3 h-[25.5rem] w-full" />
        </section>

        <section className="mt-8 border-b border-hairline pb-6">
          <h2 className="mb-4 text-base/5 font-medium">
            Estimated fee savings
          </h2>
          <Skeleton className="h-29 w-full" />
          <Skeleton className="mt-4 h-13 w-full" />
        </section>

        <section className="mt-6">
          <h2 className="mb-4 text-base/5 font-medium">Recent bookings</h2>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="mb-1.5 h-16 w-full" />
          ))}
        </section>
      </div>

      <aside className="square-scroll -mr-[30px] min-w-0 pt-29 pb-8 max-[1000px]:hidden">
        <h3 className="mb-3 text-xs/4 font-medium text-ink-56">
          Needs your review
        </h3>
        <Skeleton className="h-[9.5rem] w-full" />
        <div className="my-2 mt-6 flex items-center gap-2 py-2">
          <span className="text-sm/4.5 font-medium">Planned</span>
          <Skeleton className="h-4.5 w-6 rounded-full" />
        </div>
        {/* the queue's cards vary in height like the real ones */}
        <div className="flex flex-col gap-1.5">
          {["h-24", "h-30", "h-24"].map((cls, i) => (
            <Skeleton key={i} className={`${cls} w-full`} />
          ))}
        </div>
        <div className="mt-6 border-t border-b border-hairline">
          <div className="my-2 flex items-center gap-2 py-2">
            <span className="text-sm/4.5 font-medium">Completed in August</span>
            <Skeleton className="h-4.5 w-6 rounded-full" />
          </div>
        </div>
      </aside>
    </main>
  );
}
