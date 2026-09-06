import type { RefObject } from "react";
import type { Week } from "../chart-data";
import { Close } from "../icons";
import { money } from "../ui/format";
import { ts, weekLabel } from "./format";

export function WeeklyFigures({
  figuresRef,
  hlWeek,
  onClose,
  weeks,
}: {
  figuresRef: RefObject<HTMLDialogElement | null>;
  hlWeek: string | null;
  onClose: () => void;
  weeks: readonly Week[];
}) {
  return (
    <dialog
      ref={figuresRef}
      aria-labelledby="weekly-figures-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === figuresRef.current) figuresRef.current.close();
      }}
      className="figures-dialog m-auto w-[min(560px,calc(100%-32px))] border border-hairline bg-paper py-4 pl-5 pr-[2px] text-ink max-[600px]:pl-4"
    >
      <header className="mr-[18px] mb-3 flex shrink-0 items-center justify-between gap-4 max-[600px]:mr-4">
        <h2 id="weekly-figures-title" className="text-sm/4.5 font-medium">
          Weekly figures
        </h2>
        <button
          type="button"
          aria-label="Close weekly figures"
          autoFocus
          onClick={() => figuresRef.current?.close()}
          /* unfilled at rest, the stepper buttons' radius; the halo
               carries the 44px reach and -my keeps the header text-height;
               the -mr backs out the hit area's centering inset so the icon
               sits on the content's right margin */
          className="touch-hit grid size-7 cursor-pointer place-items-center rounded text-ink-56 outline-none transition-colors duration-200 -mr-[calc((1.75rem-15px)/2)] max-[1000px]:-my-2 max-[1000px]:size-9 max-[1000px]:-mr-[calc((2.25rem-15px)/2)] max-[600px]:-mr-[calc((2.25rem-1.125rem)/2)] hover:bg-ink-5 hover:text-ink focus-visible:bg-ink-5 focus-visible:text-ink active:bg-ink-5 active:text-ink"
        >
          <Close size={15} className="max-[600px]:size-[1.125rem]" />
        </button>
      </header>
      {/* plain block sizing: flex-1 + h-full resolve a hair short of the
            content in an auto-height dialog, forcing a needless scrollbar */}
      <div className="relative">
        <div
          className="square-scroll max-h-[min(64vh,620px)]"
          style={{ "--scroll-inset-top": "0px" } as React.CSSProperties}
        >
          <table className="w-full table-fixed text-sm/5">
            <thead>
              <tr className="text-left text-xs/4 font-medium text-ink-56">
                <th className="w-[28%] py-2 font-medium">Week of</th>
                <th className="py-2 text-right font-medium">Bookings</th>
                <th className="py-2 text-right font-medium">Value</th>
                <th className="py-2 text-right font-medium">Visits</th>
                {/* phones drop the widest column so the rest can breathe */}
                <th className="py-2 text-right font-medium max-[600px]:hidden">
                  Ad views
                </th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr
                  key={w.start}
                  data-week={w.start}
                  className={`border-t border-hairline-2 ${
                    hlWeek === w.start ? "row-hl" : ""
                  }`}
                >
                  {/* single-line cell: too narrow truncates, never wraps */}
                  <td className="truncate py-2 whitespace-nowrap">
                    {weekLabel(w.start)},{" "}
                    {new Date(ts(w.start)).getUTCFullYear()}
                  </td>
                  <td className="py-2 text-right">{w.bookings}</td>
                  <td className="py-2 text-right">{money(w.rev)}</td>
                  <td className="py-2 text-right">
                    {w.visits.toLocaleString()}
                  </td>
                  <td className="py-2 text-right max-[600px]:hidden">
                    {w.adViews.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* bottom fade: clears the scrollbar lane and disappears at the end */}
        <div className="figures-fade pointer-events-none absolute bottom-0 left-0 right-[30px] h-5 bg-gradient-to-t from-paper to-transparent transition-opacity duration-200 max-[600px]:right-0" />
      </div>
    </dialog>
  );
}
