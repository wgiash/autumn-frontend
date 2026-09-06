import { Hero } from "@/components/hero";
import { Rail, RailRow } from "@/components/rail";
import { RecentBookings } from "@/components/recent-bookings";
import { Savings } from "@/components/savings";
import { Trend } from "@/components/trend";

export default function Home() {
  return (
    <main className="mx-(--margin) grid h-dvh grid-cols-[minmax(0,1fr)_var(--rail)] grid-rows-[minmax(0,1fr)] gap-x-9 max-[1000px]:mx-0 max-[1000px]:grid-cols-1">
      <div className="square-scroll w-full max-w-(--max) min-w-0 justify-self-center pt-29 pb-30 max-[1000px]:max-w-none max-[1000px]:px-(--margin) max-[1000px]:[scrollbar-gutter:auto]">
        <Hero />
        <div className="hidden max-[1000px]:block">
          <RailRow />
        </div>
        <Trend />
        <Savings />
        <RecentBookings />
      </div>
      <Rail />
    </main>
  );
}
