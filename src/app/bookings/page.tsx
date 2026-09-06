import type { Metadata } from "next";
import { BookingsView } from "@/components/bookings-view";

export const metadata: Metadata = {
  title: "Bookings · The Brass Lantern · Autumn",
};

export default function Bookings() {
  /* same margin system as the overview; the filter rail mirrors the
     overview's rail on the left, and the table takes the remaining width */
  return (
    <main className="mx-(--margin) grid h-dvh grid-cols-[var(--rail)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-x-9 max-[1000px]:mx-0 max-[1000px]:grid-cols-1">
      <BookingsView />
    </main>
  );
}
