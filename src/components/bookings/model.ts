import type { Booking } from "../bookings-data";
export type { Booking } from "../bookings-data";

export type BookingFilters = {
  channel: string;
  city: string;
  device: string;
  referral: string;
};

export type SortColumn = "guest" | "stay" | "channel" | "value" | "booked";
export type BookingSort = { col: SortColumn; dir: 1 | -1 };
export type BookingsState = {
  filters: BookingFilters;
  sort: BookingSort;
  shown: number;
};

export type BookingsAction =
  | { type: "filter"; key: keyof BookingFilters; value: string }
  | { type: "sort"; column: SortColumn }
  | { type: "show-more" };

export const INITIAL_PAGE_SIZE = 10;
export const LOAD_MORE_SIZE = 15;

export const INITIAL_BOOKINGS_STATE: BookingsState = {
  filters: { channel: "all", city: "", device: "", referral: "" },
  sort: { col: "booked", dir: -1 },
  shown: INITIAL_PAGE_SIZE,
};

const SORT_DEFAULT: Record<SortColumn, 1 | -1> = {
  guest: 1,
  stay: 1,
  channel: 1,
  value: -1,
  booked: -1,
};

const SORT_COMPARE: Record<SortColumn, (a: Booking, b: Booking) => number> = {
  guest: (a, b) => a.guest.localeCompare(b.guest),
  stay: (a, b) => a.arrival.localeCompare(b.arrival),
  channel: (a, b) => a.channel.localeCompare(b.channel),
  value: (a, b) => a.value - b.value,
  booked: (a, b) => a.booked.localeCompare(b.booked),
};

export function bookingsReducer(
  state: BookingsState,
  action: BookingsAction,
): BookingsState {
  switch (action.type) {
    case "filter":
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
        shown: INITIAL_PAGE_SIZE,
      };
    case "sort":
      return {
        ...state,
        sort: {
          col: action.column,
          dir:
            state.sort.col === action.column
              ? state.sort.dir === 1
                ? -1
                : 1
              : SORT_DEFAULT[action.column],
        },
      };
    case "show-more":
      return { ...state, shown: state.shown + LOAD_MORE_SIZE };
  }
}

export function selectBookings(
  bookings: readonly Booking[],
  { filters, sort, shown }: BookingsState,
) {
  const filtered = bookings
    .filter(
      (booking) =>
        (filters.channel === "all" || booking.channel === filters.channel) &&
        (filters.city === "" || booking.city === filters.city) &&
        (filters.device === "" || booking.device === filters.device) &&
        (filters.referral === "" || booking.referral === filters.referral),
    )
    .sort(
      (a, b) =>
        SORT_COMPARE[sort.col](a, b) * sort.dir ||
        b.booked.localeCompare(a.booked),
    );

  return {
    filtered,
    visible: filtered.slice(0, shown),
    filteredValue: filtered.reduce(
      (total, booking) => total + booking.value,
      0,
    ),
    filteredFees: filtered.reduce((total, booking) => total + booking.fee, 0),
    totalCount: bookings.length,
  };
}

// Options describe the dataset, not the current result set. Empty results must not empty the menus.
export function getBookingFilterOptions(bookings: readonly Booking[]) {
  const channels = ["Your website", "Booking.com", "Expedia"] as const;
  return {
    channels: [
      { key: "all", label: "All bookings", count: bookings.length },
      ...channels
        .map((channel) => ({
          key: channel,
          label: channel,
          count: bookings.filter((booking) => booking.channel === channel)
            .length,
        }))
        .filter((channel) => channel.count > 0),
    ],
    cities: [...new Set(bookings.map((booking) => booking.city))].sort(),
    devices: ["Phone", "Computer", "Tablet", "Not recorded"],
    referrals: [
      ...new Set(
        bookings
          .filter((booking) => booking.channel === "Your website")
          .map((booking) => booking.referral),
      ),
    ].sort(),
  };
}

export type BookingFilterOptions = ReturnType<typeof getBookingFilterOptions>;
