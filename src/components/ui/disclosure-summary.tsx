import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function DisclosureSummary({
  className,
  ...props
}: ComponentPropsWithoutRef<"summary">) {
  return (
    <summary
      className={cn(
        "my-2 flex cursor-pointer list-none items-center gap-2 rounded-r py-2 pr-3 text-sm/4.5 font-medium transition-colors duration-200 hover:bg-ink-5 active:bg-ink-5 motion-reduce:transition-none [&::-webkit-details-marker]:hidden",
        className,
      )}
      {...props}
    />
  );
}
