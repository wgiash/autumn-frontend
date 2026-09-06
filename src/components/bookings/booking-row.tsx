import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Booking } from "../bookings-data";
import { ChevronDown } from "@/components/icons";
import { EASE } from "@/components/ui/motion";
import { money, money2 } from "./format";

const ROOM_IMG: Record<string, string> = {
  "Meadow Room": "/rooms/thumb-1.jpg",
  "Lantern Suite": "/rooms/thumb-2.jpg",
  "Garden Room": "/rooms/thumb-3.jpg",
};

/* small tablets drop the Channel column — five columns leave the flexible
   ones too tiny to read; the accent square still marks booked-direct */
export const ROW =
  "grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_5rem_4.375rem_1rem] items-center gap-4 max-[800px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5rem_4.375rem_1rem] max-[600px]:grid-cols-[minmax(0,1fr)_auto_1rem]";

/* ── one booking: a paper-2 segment that opens into a white card.
      Sorting and filtering FLIP the row to its new position; a row
      filtered out folds away; appended rows fade in on their stagger ── */
export function BookingRow({
  b,
  enterDelay = 0,
}: {
  b: Booking;
  enterDelay?: number;
}) {
  const reduce = useReducedMotion();
  /* while a sort or filter glides the row to a new position it softens —
     a touch of blur, fade and scale — and re-emerges on arrival */
  const [moving, setMoving] = useState(false);
  const softened = moving && !reduce;
  return (
    <motion.details
      layout={reduce ? false : "position"}
      onLayoutAnimationStart={() => setMoving(true)}
      onLayoutAnimationComplete={() => setMoving(false)}
      initial={reduce ? false : { opacity: 0, filter: "blur(4px)" }}
      animate={{
        opacity: softened ? 0.72 : 1,
        filter: softened ? "blur(2.5px)" : "blur(0px)",
      }}
      /* popLayout lifts the exiting row out of flow, so it blurs away in
         place while the surviving rows glide on transforms alone — no
         per-frame reflow, which is what made the fold stutter */
      exit={
        reduce
          ? { opacity: 0, transition: { duration: 0 } }
          : {
              opacity: 0,
              filter: "blur(4px)",
              transition: { duration: 0.18, ease: EASE },
            }
      }
      transition={{
        layout: { duration: 0.3, ease: EASE },
        opacity: { duration: 0.22, ease: EASE, delay: enterDelay },
        filter: { duration: 0.22, ease: EASE, delay: enterDelay },
        scale: { duration: 0.22, ease: EASE },
      }}
      className="group/bk mb-1.5 rounded border border-transparent bg-paper-2 transition-colors duration-200 open:border-hairline open:bg-white">
      <summary
        /* padding backs out the card's 1px border so the columns land
           exactly on the header row's tracks */
        className={`${ROW} cursor-pointer list-none rounded px-[calc(0.75rem-1px)] py-3 outline-none transition-colors duration-200 [&::-webkit-details-marker]:hidden hover:bg-ink-5 focus-visible:bg-ink-5 active:bg-ink-5 active:transition-none group-open/bk:hover:bg-transparent group-open/bk:focus-visible:bg-transparent`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={ROOM_IMG[b.room]}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="size-10 shrink-0 rounded border border-hairline object-cover"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm/4.5 font-medium">
              {b.guest}
            </span>
            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs/4 text-ink-56">
              {/* the square means booked direct, as on the overview; a
                  whole-pixel size, like the hairlines — the rem size lands
                  on subpixels and renders a soft, lopsided edge */}
              {b.channel === "Your website" && (
                <span
                  aria-hidden="true"
                  className="size-[6px] shrink-0 bg-accent"
                />
              )}
              <span className="truncate">
                <span className="max-[600px]:hidden">{b.city}</span>
                <span className="hidden max-[600px]:inline">
                  {b.channel} · {b.stayLabel}
                </span>
              </span>
            </span>
          </span>
        </div>
        <div className="min-w-0 max-[600px]:hidden">
          <span className="block text-sm/4.5">{b.stayLabel}</span>
          <span className="mt-0.5 block truncate text-xs/4 text-ink-56">
            {b.nights} nights · {b.room}
          </span>
        </div>
        <div className="min-w-0 max-[800px]:hidden">
          <span className="block truncate text-sm/4.5">{b.channel}</span>
          <span className="mt-0.5 block truncate text-xs/4 text-ink-56">
            {b.channel === "Your website"
              ? b.referral === "Not recorded"
                ? "No recorded referral"
                : b.referral
              : "Not Autumn-attributed"}
          </span>
        </div>
        <div className="text-sm/4.5 font-medium max-[600px]:text-right">
          {money(b.value)}
          <span className="mt-0.5 hidden text-xs/4 font-normal text-ink-56 max-[600px]:block">
            {b.bookedLabel}
          </span>
        </div>
        <div className="text-right text-sm/4.5 text-ink-72 max-[600px]:hidden">
          {b.bookedLabel}
        </div>
        <ChevronDown
          size={12}
          className="text-ink-56 transition-transform group-open/bk:rotate-180"
        />
      </summary>
      <div className="mx-[calc(0.75rem-1px)] border-t border-hairline-2 pt-3 pb-4">
        {/* the fields ride the table's own column tracks */}
        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_5rem_4.375rem_1rem] items-start gap-4 max-[800px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5rem_4.375rem_1rem] max-[600px]:grid-cols-2 max-[600px]:gap-y-3">
          {(
            [
              ["Reservation", b.id],
              ["Status", b.status],
              ["Average nightly", money2(b.value / b.nights)],
              ["Device", b.device],
            ] as const
          ).map(([dt, dd], i) => (
            <div
              key={dt}
              /* Device starts on the Value column's track and may run
                 rightward under Booked */
              className={
                i === 3
                  ? "col-span-3 max-[800px]:col-span-2 max-[600px]:col-span-1"
                  : ""
              }
            >
              <div className="text-xs/4 font-medium text-ink-56">{dt}</div>
              <div className="mt-0.5 text-xs/4 text-ink-72">{dd}</div>
            </div>
          ))}
        </div>
        {b.fee > 0 && (
          /* the receipt sits apart, bottom right; tabular figures on the
             numbers only — the labels carry commas, which the tabular
             feature would widen to digit cells */
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-[20rem]">
              <dl className="text-sm/5">
                <div className="flex items-baseline justify-between gap-4 py-1">
                  <dt className="text-ink-56">Booking value</dt>
                  <dd className="text-ink-72 tabular-nums">
                    {money2(b.value)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-1">
                  <dt className="text-ink-56">
                    {b.channel === "Your website"
                      ? "Autumn fee, estimated (13%)"
                      : `Channel commission, estimated (${Math.round(b.rate * 100)}%)`}
                  </dt>
                  <dd className="text-ink-72 tabular-nums">−{money2(b.fee)}</dd>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-hairline py-1.5 font-medium">
                  <dt>Value after estimated fee</dt>
                  <dd className="tabular-nums">{money2(b.value - b.fee)}</dd>
                </div>
                {b.attributed && (
                  <div className="flex items-baseline justify-between gap-4 py-1">
                    <dt className="text-ink-56">
                      Est. savings vs. 15% booking-site fee
                    </dt>
                    <dd className="text-ink-72 tabular-nums">
                      {money2(b.value * 0.15 - b.fee)}
                    </dd>
                  </div>
                )}
              </dl>
              <p className="mt-2.5 text-xs/4 text-ink-40">
                Sample fees, not a settled payout. Excludes taxes, payment
                processing and other costs.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.details>
  );
}
