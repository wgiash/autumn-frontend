import { CarouselFades } from "@/components/carousel-fades";
import { DetailLink } from "@/components/detail-link";
import { ArrowUpRight, ChevronDown } from "@/components/icons";
import { Leaf } from "@/components/leaf";
import { DisclosureSummary } from "@/components/ui/disclosure-summary";

type Detail = {
  label: string;
  rows: [string, string][];
  note?: string;
};

type Action = {
  verb: string;
  text: string;
  so?: string;
  detail?: Detail;
  result?: { text: string; kind?: "pricing" };
  /* set when the item waits on Don instead of running automatically */
  status?: string;
  date: string;
  datetime: string;
};

const PLANNED: Action[] = [
  {
    verb: "Review",
    text: "rates for Sep 11-13 against remaining rooms and local demand",
    detail: {
      label: "Pricing factors",
      rows: [
        ["Room / dates", "Garden Room, Sep 11-13"],
        ["Inputs", "Season, availability, events, weather"],
        ["Rate change", "Not set; awaiting the Sep 3 review"],
      ],
    },
    date: "Sep 3",
    datetime: "2026-09-03",
  },
  {
    verb: "Send",
    text: '"A few October weekends remain" to unbooked past guests',
    so: "Exclude anyone who already booked or unsubscribed.",
    date: "Sep 7",
    datetime: "2026-09-07",
  },
  {
    verb: "Publish",
    text: "the foliage room tour and restart Montreal search ads",
    date: "Sep 14",
    datetime: "2026-09-14",
  },
];

const COMPLETED: Action[] = [
  {
    verb: "Switched",
    text: "foliage ads to the October availability page",
    result: { text: "Ads updated · October availability" },
    date: "Aug 26",
    datetime: "2026-08-26",
  },
  {
    verb: "Updated",
    text: "the foliage guide's room rates and hotel details",
    so: "The guide still showed spring prices ahead of foliage season.",
    detail: {
      label: "Work details",
      rows: [
        ["Page", "Stowe foliage guide"],
        ["Content", "Current rates, breakfast, parking, room links"],
        ["Validation", "Structured data matches the visible page"],
        ["Next check", "Google indexing and attributable AI referrals"],
      ],
    },
    result: { text: "Website updated · Rates & hotel details" },
    date: "Aug 21",
    datetime: "2026-08-21",
  },
  {
    verb: "Raised",
    text: "the Garden Room rate for Aug 21-22 from $189 to $229 a night",
    detail: {
      label: "Pricing factors",
      rows: [
        ["Season", "Peak summer weekend"],
        ["Availability", "2 of 8 rooms remaining"],
        ["Nearby events", "Outdoor concert on Aug 22"],
        ["Weather", "Dry weekend forecast; no extra uplift"],
        ["Your website", "$229 per night"],
        ["Booking.com / Expedia", "$254 / $264 per night"],
      ],
      note: "Illustrative pricing inputs. Guest-price differences are not the owner's commission savings.",
    },
    result: { text: "Rate increased · +$40/night", kind: "pricing" },
    date: "Aug 19",
    datetime: "2026-08-19",
  },
  {
    verb: "Published",
    text: "the lake-and-breakfast post on Instagram and Facebook",
    detail: {
      label: "Work details",
      rows: [
        ["Post", "A morning at the lake, breakfast back at the inn."],
        ["Platforms", "Instagram and Facebook"],
        ["Destination", "August weekday availability"],
      ],
    },
    result: { text: "Published · 2 social channels" },
    date: "Aug 12",
    datetime: "2026-08-12",
  },
  {
    verb: "Sent",
    text: '"October at the Inn" to past autumn guests',
    detail: {
      label: "Work details",
      rows: [
        ["Audience", "Past autumn guests, subscribed"],
        ["Subject", "October at the Inn"],
        ["Destination", "October direct-booking availability"],
        ["Attribution", "Email-link referrals, not email opens"],
      ],
    },
    result: { text: "Email sent · Returning guests" },
    date: "Aug 6",
    datetime: "2026-08-06",
  },
  {
    verb: "Answered",
    text: "six Google reviews, including the parking question",
    result: { text: "Reviews answered · 6 replies" },
    date: "Aug 5",
    datetime: "2026-08-05",
  },
];

function CountPill({ n }: { n: number }) {
  return (
    <span className="inline-flex h-[1.125rem] min-w-6 items-center justify-center rounded-full border border-hairline px-1.5 text-2xs/3.5 font-medium text-ink-72 tabular-nums">
      {n}
    </span>
  );
}

/* the expanded card's detail table, under the internal hairline */
function DetailBody({ detail }: { detail: Detail }) {
  return (
    <div className="mx-3 border-t border-hairline-2 pt-3 pb-4">
      <div className="text-sm/4.5 font-medium">{detail.label}</div>
      <dl className="mt-2.5 text-xs/4">
        {detail.rows.map(([dt, dd]) => (
          <div key={dt} className="mt-2 first:mt-0">
            <dt className="font-medium text-ink-56">{dt}</dt>
            <dd className="mt-0.5 text-ink-72">{dd}</dd>
          </div>
        ))}
      </dl>
      {detail.note && (
        <p className="mt-2.5 text-xs/4 text-ink-56">{detail.note}</p>
      )}
    </div>
  );
}

function EntryBody({
  action,
  chevron,
}: {
  action: Action;
  chevron?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm/4.5 font-medium">
          <span className="text-ink-56">{action.verb}</span> {action.text}
        </div>
        {chevron && (
          <ChevronDown
            size={12}
            className="mt-1 shrink-0 text-ink-56 transition-transform group-open/card:rotate-180"
          />
        )}
      </div>
      {action.so && (
        <div className="mt-1.5 line-clamp-2 text-xs/4 text-ink-72">
          {action.so}
        </div>
      )}
      {action.result && (
        <div className="mt-[0.6875rem] flex items-center gap-[7px] text-2xs/3.5 font-medium text-ink-56">
          <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-accent text-paper">
            <ArrowUpRight size={9} />
          </span>
          <span>{action.result.text}</span>
        </div>
      )}
      <div className="mt-[0.6875rem] flex flex-wrap items-center gap-1.5 text-2xs/3.5 font-medium text-ink-40">
        <span className="mr-0.5 grid size-4 place-items-center rounded-full bg-ink text-paper">
          <Leaf size={9} />
        </span>
        <span>Autumn</span>
        <span>·</span>
        <time dateTime={action.datetime}>{action.date}</time>
        {action.status && (
          <>
            <span>·</span>
            <span className="text-accent">{action.status}</span>
          </>
        )}
      </div>
    </>
  );
}

/* one rail card: a paper-2 segment; when it carries a detail table it is
   expandable, opening into a white card with an internal hairline. The
   card stays display-block — a flex details skips the height animation. */
function ActionCard({
  action,
  horizontal,
}: {
  action: Action;
  horizontal?: boolean;
}) {
  const surface =
    "relative rounded border border-transparent bg-paper-2 transition-colors duration-200";
  const size = horizontal ? "w-72 shrink-0" : "";
  if (!action.detail)
    return (
      <article
        tabIndex={0}
        className={`${surface} ${size} cursor-pointer px-3 py-4 outline-none hover:bg-ink-5 focus-visible:bg-ink-5 active:bg-ink-5 active:transition-none`}
      >
        <EntryBody action={action} />
      </article>
    );
  return (
    <details
      className={`group/card ${surface} ${size} outline-none open:border-hairline open:bg-white [&:not([open])]:hover:bg-ink-5 [&:not([open])]:has-[:focus-visible]:bg-ink-5 [&:not([open])]:active:bg-ink-5 [&:not([open])]:active:transition-none`}
    >
      <summary
        className={`block cursor-pointer list-none rounded px-3 py-4 outline-none [&::-webkit-details-marker]:hidden`}
      >
        <EntryBody action={action} chevron />
      </summary>
      <DetailBody detail={action.detail} />
    </details>
  );
}

function CompletedSection({ horizontal }: { horizontal?: boolean }) {
  return (
    <details className="group/completed mt-6 border-t border-b border-hairline open:border-b-0">
      <DisclosureSummary>
        <span>Completed in August</span>
        <CountPill n={COMPLETED.length} />
        <ChevronDown
          size={12}
          className="ml-auto transition-transform group-open/completed:rotate-180"
        />
      </DisclosureSummary>
              {horizontal ? (
          <div className="relative -mx-(--margin)">
            <div className="square-scroll-x flex gap-2 px-(--margin) pt-1 pb-2">
              {COMPLETED.map((action) => (
                <ActionCard key={action.datetime} action={action} horizontal />
              ))}
            </div>
            <CarouselFades />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pt-1 pb-3">
            {COMPLETED.map((action) => (
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
export function RailRow() {
  return (
    <section
      aria-label="Attention and Autumn's next steps"
      className="mt-6"
    >
      <section className="border-b border-hairline pb-6">
        {/* in the main flow this is a section title, styled like its
            sibling sections; the rail's narrow column keeps the label */}
        <h2 className="mb-4 text-base/5 font-medium">Needs your review</h2>
        <p className="text-sm/5 font-medium">
          5 August website bookings have no recorded source.
        </p>
        <span className="mt-2 block text-xs/4 text-ink-72">
          Included in August revenue, but not credited to Autumn.
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
          Planned <CountPill n={PLANNED.length} />
        </h3>
      </div>

      <div className="relative -mx-(--margin) -my-4">
        <div className="square-scroll-x flex gap-2 px-(--margin) py-4">
          {PLANNED.map((action) => (
            <ActionCard key={action.datetime} action={action} horizontal />
          ))}
        </div>
        <CarouselFades />
      </div>
      <CompletedSection horizontal />
    </section>
  );
}

export function Rail() {
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
            5 August website bookings have no recorded source.
          </p>
          <span className="mt-2 block text-xs/4 text-ink-72">
            Included in August revenue, but not credited to Autumn.
          </span>
          <div className="mt-3">
            <DetailLink href="/bookings" accent>
              Take action
            </DetailLink>
          </div>
        </section>

        <div className="my-2 flex items-center justify-between py-2 pr-3">
          <h3 className="flex items-center gap-2 text-sm/4.5 font-medium">
            Planned <CountPill n={PLANNED.length} />
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          {PLANNED.map((action) => (
            <ActionCard key={action.datetime} action={action} />
          ))}
        </div>
      </section>

      <CompletedSection />
    </aside>
  );
}
