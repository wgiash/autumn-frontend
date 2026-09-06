import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BOOKINGS } from "../bookings-data.ts";
import {
  bookingsReducer,
  getBookingFilterOptions,
  INITIAL_BOOKINGS_STATE,
  selectBookings,
} from "./model.ts";

const fixtures = Object.freeze(
  [
    {
      id: "a",
      guest: "Zoe",
      channel: "Your website",
      city: "Boston",
      device: "Phone",
      referral: "Google",
      arrival: "2026-09-03",
      booked: "2026-08-01",
      value: 300,
      fee: 39,
    },
    {
      id: "b",
      guest: "Amy",
      channel: "Booking.com",
      city: "New York",
      device: "Not recorded",
      referral: "Not recorded",
      arrival: "2026-09-01",
      booked: "2026-08-03",
      value: 100,
      fee: 15,
    },
    {
      id: "c",
      guest: "Mia",
      channel: "Your website",
      city: "Boston",
      device: "Computer",
      referral: "Email",
      arrival: "2026-09-02",
      booked: "2026-08-02",
      value: 200,
      fee: 26,
    },
    {
      id: "d",
      guest: "Mia",
      channel: "Expedia",
      city: "New York",
      device: "Not recorded",
      referral: "Not recorded",
      arrival: "2026-09-02",
      booked: "2026-08-04",
      value: 200,
      fee: 36,
    },
  ].map((booking) => Object.freeze({ ...BOOKINGS[0], ...booking })),
);

const ids = (bookings) => bookings.map((booking) => booking.id);
const filter = (state, key, value) =>
  bookingsReducer(state, { type: "filter", key, value });

describe("booking selection", () => {
  it("starts with ten reservations, newest booked first", () => {
    const result = selectBookings(BOOKINGS, INITIAL_BOOKINGS_STATE);
    assert.equal(result.visible.length, 10);
    assert.equal(result.filtered.length, 59);
    assert.equal(result.totalCount, 59);
    assert.equal(result.filteredValue, 31190);
    assert.equal(Math.round(result.filteredFees * 100), 355806);
    for (let i = 1; i < result.filtered.length; i++) {
      assert(result.filtered[i - 1].booked >= result.filtered[i].booked);
    }
  });

  it("preserves the existing ten-initial, fifteen-more pagination", () => {
    let state = INITIAL_BOOKINGS_STATE;
    for (const count of [10, 25, 40, 55, 59]) {
      assert.equal(selectBookings(BOOKINGS, state).visible.length, count);
      state = bookingsReducer(state, { type: "show-more" });
    }
    assert.equal(selectBookings(BOOKINGS, state).visible.length, 59);
  });

  for (const [key, value, expected] of [
    ["channel", "Your website", ["c", "a"]],
    ["city", "Boston", ["c", "a"]],
    ["device", "Computer", ["c"]],
    ["referral", "Email", ["c"]],
  ]) {
    it(`filters by ${key} and resets pagination without clearing other state`, () => {
      const before = {
        ...INITIAL_BOOKINGS_STATE,
        shown: 40,
        filters: { ...INITIAL_BOOKINGS_STATE.filters },
      };
      const state = filter(before, key, value);
      assert.equal(state.shown, 10);
      assert.deepEqual(state.sort, before.sort);
      assert.deepEqual(state.filters, { ...before.filters, [key]: value });
      assert.deepEqual(ids(selectBookings(fixtures, state).visible), expected);
      assert.equal(before.shown, 40);
      assert.deepEqual(before.filters, INITIAL_BOOKINGS_STATE.filters);
    });
  }

  it("combines all filters and totals only matching reservations", () => {
    let state = INITIAL_BOOKINGS_STATE;
    for (const [key, value] of Object.entries({
      channel: "Your website",
      city: "Boston",
      device: "Computer",
      referral: "Email",
    })) {
      state = filter(state, key, value);
    }
    const result = selectBookings(fixtures, state);
    assert.deepEqual(ids(result.visible), ["c"]);
    assert.equal(result.filteredValue, 200);
    assert.equal(result.filteredFees, 26);
    assert.equal(result.totalCount, 4);

    state = filter(state, "city", "");
    assert.equal(state.filters.device, "Computer");
    assert.equal(state.filters.referral, "Email");
  });

  it("handles no matches and an empty dataset", () => {
    const state = filter(
      filter(INITIAL_BOOKINGS_STATE, "channel", "Expedia"),
      "city",
      "Boston",
    );
    for (const bookings of [fixtures, []]) {
      const result = selectBookings(bookings, state);
      assert.deepEqual(result.filtered, []);
      assert.deepEqual(result.visible, []);
      assert.equal(result.filteredValue, 0);
      assert.equal(result.filteredFees, 0);
      assert.equal(result.totalCount, bookings.length);
    }
  });

  it("does not mutate the input array or its records", () => {
    const before = structuredClone(fixtures);
    selectBookings(fixtures, {
      ...INITIAL_BOOKINGS_STATE,
      sort: { col: "value", dir: 1 },
    });
    assert.deepEqual(fixtures, before);
  });
});

describe("booking sorting", () => {
  for (const [column, ascending, descending, defaultDirection] of [
    ["guest", ["b", "d", "c", "a"], ["a", "d", "c", "b"], 1],
    ["stay", ["b", "d", "c", "a"], ["a", "d", "c", "b"], 1],
    ["channel", ["b", "d", "c", "a"], ["c", "a", "d", "b"], 1],
    ["value", ["b", "d", "c", "a"], ["a", "d", "c", "b"], -1],
    ["booked", ["a", "c", "b", "d"], ["d", "b", "c", "a"], -1],
  ]) {
    it(`sorts ${column} both ways, with newest-booked ties in either direction`, () => {
      for (const [dir, expected] of [
        [1, ascending],
        [-1, descending],
      ]) {
        const state = { ...INITIAL_BOOKINGS_STATE, sort: { col: column, dir } };
        assert.deepEqual(
          ids(selectBookings(fixtures, state).filtered),
          expected,
        );
      }
    });

    it(`selects the default ${column} direction, then toggles without resetting filters or pagination`, () => {
      const before = {
        ...INITIAL_BOOKINGS_STATE,
        filters: { ...INITIAL_BOOKINGS_STATE.filters, city: "Boston" },
        shown: 40,
        sort: { col: column === "guest" ? "booked" : "guest", dir: 1 },
      };
      const state = bookingsReducer(before, { type: "sort", column });
      assert.deepEqual(state.sort, { col: column, dir: defaultDirection });
      assert.equal(state.shown, 40);
      assert.deepEqual(state.filters, before.filters);
      const toggled = bookingsReducer(state, { type: "sort", column });
      assert.equal(toggled.sort.dir, -defaultDirection);
      assert.equal(state.sort.dir, defaultDirection);
    });
  }
});

describe("booking filter options", () => {
  it("uses the full dataset for menus and channel counts", () => {
    const options = getBookingFilterOptions(fixtures);
    assert.deepEqual(options.channels, [
      { key: "all", label: "All bookings", count: 4 },
      { key: "Your website", label: "Your website", count: 2 },
      { key: "Booking.com", label: "Booking.com", count: 1 },
      { key: "Expedia", label: "Expedia", count: 1 },
    ]);
    assert.deepEqual(options.cities, ["Boston", "New York"]);
    assert.deepEqual(options.referrals, ["Email", "Google"]);
    assert.deepEqual(options.devices, [
      "Phone",
      "Computer",
      "Tablet",
      "Not recorded",
    ]);
  });

  it("omits absent channels but retains the all-bookings option and device choices", () => {
    const options = getBookingFilterOptions([]);
    assert.deepEqual(options.channels, [
      { key: "all", label: "All bookings", count: 0 },
    ]);
    assert.deepEqual(options.cities, []);
    assert.deepEqual(options.referrals, []);
    assert.equal(options.devices.length, 4);
  });
});
