import type { ActionItem, ActionsData } from "@/lib/contracts";
import { CarouselFades } from "@/components/carousel-fades";
import { DetailLink } from "@/components/detail-link";
import { ChevronDown } from "@/components/icons";
import { ActionCard } from "./actions/action-card";
import { DisclosureSummary } from "@/components/ui/disclosure-summary";

type RailProps = {
  actions: ActionsData;
  monthLabel: string;
};

function CountPill({ n }: { n: number }) {
  return (
    <span className="inline-flex h-[1.125rem] min-w-6 items-center justify-center rounded-full border border-hairline px-1.5 text-2xs/3.5 font-medium text-ink-72 tabular-nums">
      {n}
    </span>
  );
}

function CompletedSection({
  completed,
  monthName,
  horizontal,
}: {
  completed: ActionItem[];
  monthName: string;
  horizontal?: boolean;
}) {
  return (
    <details className="group/completed mt-6 border-t border-b border-hairline open:border-b-0">
      <DisclosureSummary>
        <span>Completed in {monthName}</span>
        <CountPill n={completed.length} />
        <ChevronDown
          size={12}
          className="ml-auto transition-transform group-open/completed:rotate-180"
        />
      </DisclosureSummary>
      {horizontal ? (
        <div className="relative -mx-(--margin)">
          <div className="square-scroll-x flex items-start gap-2 px-(--margin) pt-1 pb-2">
            {completed.map((action) => (
              <ActionCard key={action.datetime} action={action} horizontal />
            ))}
          </div>
          <CarouselFades />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 pt-1 pb-3">
          {completed.map((action) => (
            <ActionCard key={action.datetime} action={action} />
          ))}
        </div>
      )}
    </details>
  );
}

/* On mobile and tablet the rail's content joins the main flow: the note as
   a block, the planned queue as a horizontally scrolling card row at the
   cards' desktop size. */
export function RailRow({ actions, monthLabel }: RailProps) {
  const monthName = monthLabel.split(" ")[0];
  return (
    <section aria-label="Attention and Autumn's next steps" className="mt-6">
      <section className="border-b border-hairline pb-6">
        {/* in the main flow this is a section title, styled like its
            sibling sections; the rail's narrow column keeps the label */}
        <h2 className="mb-4 text-base/5 font-medium">Needs your review</h2>
        <p className="text-sm/5 font-medium">
          {actions.reviewCount} {monthName} website bookings have no recorded
          source.
        </p>
        <span className="mt-2 block text-xs/4 text-ink-72">
          Included in {monthName} revenue, but not credited to Autumn.
        </span>
        {/* full-width block: the CTA joins the page's right-aligned action
            rows (the desktop rail's narrow column keeps it left) */}
        <div className="mt-3 flex justify-end">
          <DetailLink href="/bookings" accent>
            Take action
          </DetailLink>
        </div>
      </section>

      <div className="my-2 flex items-center justify-between py-2 pr-3">
        <h3 className="flex items-center gap-2 text-sm/4.5 font-medium">
          Planned <CountPill n={actions.planned.length} />
        </h3>
      </div>

      <div className="relative -mx-(--margin) -my-4">
        <div className="square-scroll-x flex items-start gap-2 px-(--margin) py-4">
          {actions.planned.map((action) => (
            <ActionCard key={action.datetime} action={action} horizontal />
          ))}
        </div>
        <CarouselFades />
      </div>
      <CompletedSection
        completed={actions.completed}
        monthName={monthName}
        horizontal
      />
    </section>
  );
}

export function Rail({ actions, monthLabel }: RailProps) {
  const monthName = monthLabel.split(" ")[0];
  return (
    <aside
      aria-label="Attention and Autumn's next steps"
      /* -30px = the scroll lane (24px gap + 6px bar, both px by design)
         hangs into the page margin, so the cards align to the grid edge */
      className="square-scroll -mr-[30px] min-w-0 pt-29 pb-8 max-[1000px]:hidden"
    >
      <section aria-label="Current issues and planned work">
        <section className="border-b border-hairline pb-6">
          <h3 className="mb-3 text-xs/4 font-medium text-ink-56">
            Needs your review
          </h3>
          <p className="text-base/5 font-medium">
            {actions.reviewCount} {monthName} website bookings have no recorded
            source.
          </p>
          <span className="mt-2 block text-xs/4 text-ink-72">
            Included in {monthName} revenue, but not credited to Autumn.
          </span>
          <div className="mt-3">
            <DetailLink href="/bookings" accent>
              Take action
            </DetailLink>
          </div>
        </section>

        <div className="my-2 flex items-center justify-between py-2 pr-3">
          <h3 className="flex items-center gap-2 text-sm/4.5 font-medium">
            Planned <CountPill n={actions.planned.length} />
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          {actions.planned.map((action) => (
            <ActionCard key={action.datetime} action={action} />
          ))}
        </div>
      </section>

      <CompletedSection completed={actions.completed} monthName={monthName} />
    </aside>
  );
}
