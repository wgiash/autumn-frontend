import type { Metadata } from "next";
import type { MonthKey } from "@/lib/contracts";
import { getAvailableMonths, getMonthData } from "@/lib/queries";
import { BookingsView } from "@/components/bookings-view";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Bookings · The Brass Lantern · Autumn",
};

export default async function Bookings({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: raw } = await searchParams;
  const months = await getAvailableMonths();
  const month: MonthKey = months.some((m) => m.value === raw)
    ? (raw as MonthKey)
    : months[months.length - 1].value;
  const data = await getMonthData(month);

  /* same margin system as the overview; the filter rail mirrors the
     overview's rail on the left, and the table takes the remaining width */
  return (
    <main className="mx-(--margin) grid h-dvh grid-cols-[var(--rail)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-x-9 max-[1000px]:mx-0 max-[1000px]:grid-cols-1">
      <BookingsView
        bookings={data.bookings}
        monthLabel={data.monthLabel}
        insights={data.insights}
        reportUrl={`/api/report/${month}`}
      />
    </main>
  );
}
