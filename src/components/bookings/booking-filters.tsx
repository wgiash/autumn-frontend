import { CarouselFades } from "@/components/carousel-fades";
import { FilterSelect } from "./filter-select";
import type {
  BookingFilters as FilterValues,
  BookingFilterOptions,
} from "./model";

type FilterProps = {
  filters: FilterValues;
  options: BookingFilterOptions;
  onChange: (key: keyof FilterValues, value: string) => void;
};

function FilterChips({ filters, options, onChange }: FilterProps) {
  const { city, device, referral } = filters;
  return (
    <>
      <FilterSelect
        label="City"
        active={city !== ""}
        value={city}
        onChange={(v) => {
          onChange("city", v);
        }}
        options={[
          { value: "", label: "Any city" },
          ...options.cities.map((c) => ({ value: c, label: c })),
        ]}
      />
      <FilterSelect
        label="Device"
        active={device !== ""}
        value={device}
        onChange={(v) => {
          onChange("device", v);
        }}
        options={[
          { value: "", label: "Any device" },
          ...options.devices.map((d) => ({ value: d, label: d })),
        ]}
      />
      <FilterSelect
        label="Marketing referral"
        active={referral !== ""}
        value={referral}
        onChange={(v) => {
          onChange("referral", v);
        }}
        options={[
          { value: "", label: "Any referral" },
          ...options.referrals.map((r) => ({ value: r, label: r })),
        ]}
      />
    </>
  );
}

export function BookingFilters({
  placement,
  ...props
}: FilterProps & { placement: "sidebar" | "toolbar" }) {
  const { filters, options, onChange } = props;
  const { channel } = filters;
  if (placement === "toolbar") {
    return (
      <div className="relative -mx-(--margin) mb-5 hidden max-[1000px]:block">
        <div className="square-scroll-x flex items-center gap-2 px-(--margin)">
          <FilterSelect
            label="Booked through"
            active={channel !== "all"}
            value={channel}
            onChange={(value) => onChange("channel", value)}
            options={options.channels.map((item) => ({
              value: item.key,
              label: item.label,
            }))}
          />
          <FilterChips {...props} />
        </div>
        <CarouselFades />
      </div>
    );
  }
  return (
    <>
      <h2 className="mb-2 text-xs/4 font-medium text-ink-56">Booked through</h2>
      <div role="group" aria-label="Filter bookings by channel">
        {options.channels.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={channel === c.key}
            onClick={() => {
              onChange("channel", c.key);
            }}
            className="relative flex w-full cursor-pointer items-baseline justify-between gap-4 rounded-r py-2 pr-3 pl-3 text-left text-sm/4.5 text-ink-56 transition-colors duration-200 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:origin-top before:scale-y-0 before:bg-ink before:transition-transform before:duration-320 before:ease-(--ease) hover:bg-ink-5 active:bg-ink-5 active:transition-none aria-pressed:bg-ink-5 aria-pressed:font-medium aria-pressed:text-ink aria-pressed:before:scale-y-100"
          >
            <span className="min-w-0 truncate">{c.label}</span>
            <span className="text-ink-56 tabular-nums">{c.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterChips {...props} />
      </div>
    </>
  );
}
