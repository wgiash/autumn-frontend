import { Suspense } from "react";
import type { MonthKey } from "@/lib/contracts";
import { getAvailableMonths, getMonthData } from "@/lib/queries";
import { OverviewSkeleton } from "./overview-skeleton";
import { Hero } from "@/components/hero";
import { Rail, RailRow } from "@/components/rail";
import { RecentBookings } from "@/components/recent-bookings";
import { Savings } from "@/components/savings";
import { Trend } from "@/components/trend";

export const revalidate = 3600;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: raw } = await searchParams;
  const months = await getAvailableMonths();
  const month: MonthKey = months.some((m) => m.value === raw)
    ? (raw as MonthKey)
    : months[months.length - 1].value;

  /* the boundary is keyed by month: stepping months remounts it, so the
     skeleton holds the layout while the new month streams in — loading.tsx
     alone never fires on a same-route searchParams navigation */
  const monthLabel = months.find((m) => m.value === month)?.label;
  return (
    <Suspense key={month} fallback={<OverviewSkeleton monthLabel={monthLabel} />}>
      <OverviewContent month={month} />
    </Suspense>
  );
}

async function OverviewContent({ month }: { month: MonthKey }) {
  const data = await getMonthData(month);

  return (
    <main className="mx-(--margin) grid h-dvh grid-cols-[minmax(0,1fr)_var(--rail)] grid-rows-[minmax(0,1fr)] gap-x-9 max-[1000px]:mx-0 max-[1000px]:grid-cols-1">
      <div className="square-scroll w-full max-w-(--max) min-w-0 justify-self-center pt-29 pb-30 max-[1000px]:max-w-none max-[1000px]:px-(--margin) max-[1000px]:[scrollbar-gutter:auto]">
        <Hero
          monthLabel={data.monthLabel}
          outcomes={data.outcomes}
          reportUrl={`/api/report/${month}`}
        />
        <div className="hidden max-[1000px]:block">
          <RailRow actions={data.actions} monthLabel={data.monthLabel} />
        </div>
        <Trend data={data.trend} />
        <Savings
          outcomes={data.outcomes}
          visibility={data.visibility}
          monthLabel={data.monthLabel}
        />
        <RecentBookings bookings={data.bookings} />
      </div>
      <Rail actions={data.actions} monthLabel={data.monthLabel} />
    </main>
  );
}
