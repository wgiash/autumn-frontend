import type { ActionDetail, ActionItem } from "@/lib/contracts";
import { ArrowUpRight, ChevronDown } from "../icons";
import { Leaf } from "../leaf";

/* the expanded card's detail table, under the internal hairline */
function DetailBody({ detail }: { detail: ActionDetail }) {
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
  action: ActionItem;
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
export function ActionCard({
  action,
  horizontal,
}: {
  action: ActionItem;
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
