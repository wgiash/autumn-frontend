import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";

/* The report's standard text + arrow link: underlined label, 6px gap. */
export function DetailLink({
  href,
  accent,
  children,
}: {
  href: string;
  /* the accent variant marks the page's genuine call to action */
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`touch-hit inline-flex items-center gap-1.5 text-xs/4 font-medium whitespace-nowrap underline decoration-1 underline-offset-[0.08em] outline-none transition-[color,opacity] max-[1000px]:text-sm/5 ${
        accent
          ? "text-accent hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
          : "text-ink-56 hover:text-ink focus-visible:text-ink active:text-ink"
      }`}
    >
      {children} <ArrowUpRight size={12} />
    </Link>
  );
}
