import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
};

export function TabButton({ active, className, ...props }: TabButtonProps) {
  return (
    <button
      type="button"
      data-active={active}
      className={cn(
        "relative cursor-pointer rounded-t border-b border-hairline-2 px-2.5 pt-2 pb-3 text-left text-ink-56 transition-colors duration-240 hover:bg-ink-5 active:bg-ink-5 data-[active=true]:text-ink after:absolute after:right-0 after:left-0 after:-bottom-[0.5px] after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-320 after:ease-(--ease) data-[active=true]:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none",
        className,
      )}
      {...props}
    />
  );
}
