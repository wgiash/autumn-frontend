import { DetailLink } from "@/components/detail-link";

type Booking = {
  guest: string;
  source: string;
  direct?: boolean;
  stay: string;
  stayDetail: string;
  booked: string;
  amount: string;
};

const BOOKINGS: Booking[] = [
  {
    guest: "Morgan L.",
    source: "Expedia",
    stay: "Sep 21–24",
    stayDetail: "3 nights · Meadow Room",
    booked: "Aug 31",
    amount: "$672",
  },
  {
    guest: "Henry A.",
    source: "Your website",
    direct: true,
    stay: "Oct 12–14",
    stayDetail: "2 nights · Meadow Room",
    booked: "Aug 29",
    amount: "$503",
  },
  {
    guest: "Jamie S.",
    source: "Expedia",
    stay: "Sep 16–18",
    stayDetail: "2 nights · Lantern Suite",
    booked: "Aug 29",
    amount: "$448",
  },
];

/* phones: the middle columns fold into the two outer cells */
const COLUMNS =
  "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_90px_80px] items-center gap-4 max-[600px]:grid-cols-[minmax(0,1fr)_auto]";

/* guest marks are visual, not typographic: a muted autumn tone per guest,
   assigned deterministically from the name */
const TONES = [
  "color(display-p3 0.80 0.65 0.47)" /* wheat */,
  "color(display-p3 0.58 0.64 0.52)" /* moss */,
  "color(display-p3 0.66 0.58 0.66)" /* heather */,
  "color(display-p3 0.75 0.55 0.47)" /* clay */,
];
export function tone(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  return TONES[h % TONES.length];
}

export function RecentBookings() {
  return (
    <section aria-labelledby="recent-title" className="mt-6 pb-2">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="recent-title" className="text-base/5 font-medium">
          Recent bookings
        </h2>
        <DetailLink href="/bookings">View all</DetailLink>
      </div>

      <div
        aria-hidden="true"
        className={`${COLUMNS} border-b border-hairline pb-2 text-xs/4 font-medium text-ink-56`}
      >
        <span>Guest</span>
        <span className="max-[600px]:hidden">Stay</span>
        <span className="max-[600px]:hidden">Booked on</span>
        <span className="text-right">Amount</span>
      </div>

      <div>
        {BOOKINGS.map((b) => (
          <div key={b.guest} className={`${COLUMNS} border-b border-hairline-2 py-3`}>
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full border border-hairline"
                style={{ background: tone(b.guest) }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm/4.5 font-medium">
                  {b.guest}
                </span>
                <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs/4 text-ink-56">
                  {b.direct && (
                    <span
                      aria-hidden="true"
                      className="size-1.5 shrink-0 bg-accent"
                    />
                  )}
                  <span className="truncate">
                    {b.source}
                    <span className="hidden max-[600px]:inline"> · {b.stay}</span>
                  </span>
                </span>
              </span>
            </div>
            <div className="min-w-0 max-[600px]:hidden">
              <span className="block text-sm/4.5">{b.stay}</span>
              <span className="mt-0.5 block truncate text-xs/4 text-ink-56">
                {b.stayDetail}
              </span>
            </div>
            <div className="text-sm/4.5 text-ink-72 max-[600px]:hidden">
              {b.booked}
            </div>
            <div className="text-right text-sm/4.5 font-medium">
              {b.amount}
              <span className="mt-0.5 hidden text-xs/4 font-normal text-ink-56 max-[600px]:block">
                {b.booked}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
