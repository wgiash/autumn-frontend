"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import type { Booking } from "../bookings-data";
import {
  bookingsReducer,
  getBookingFilterOptions,
  INITIAL_BOOKINGS_STATE,
  selectBookings,
  type BookingFilters,
  type SortColumn,
} from "./model";

function navHeight() {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--nav-h"),
    ) || 60
  );
}

function useBookingHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scroller = sentinel?.closest(".square-scroll");
    if (!sentinel || !scroller) return;
    let previous: boolean | null = null;
    const check = (sync: boolean) => {
      const next = sentinel.getBoundingClientRect().top <= navHeight() + 1;
      if (next === previous) return;
      previous = next;
      // Commit before paint during fast scrolling so rows never show through the pinned header.
      if (sync) flushSync(() => setStuck(next));
      else setStuck(next);
    };
    check(false);
    const onScroll = () => check(true);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-nav-solid", stuck);
    return () => document.documentElement.removeAttribute("data-nav-solid");
  }, [stuck]);

  const resetScroll = () => {
    const sentinel = sentinelRef.current;
    const scroller = sentinel?.closest(".square-scroll");
    if (!sentinel || !scroller) return;
    const target =
      scroller.scrollTop + sentinel.getBoundingClientRect().top - navHeight();
    if (scroller.scrollTop > target) scroller.scrollTop = target;
  };

  return { sentinelRef, stuck, resetScroll };
}

export function useBookings(bookings: readonly Booking[]) {
  const [state, dispatch] = useReducer(bookingsReducer, INITIAL_BOOKINGS_STATE);
  const header = useBookingHeader();
  const result = useMemo(
    () => selectBookings(bookings, state),
    [bookings, state],
  );
  const options = useMemo(() => getBookingFilterOptions(bookings), [bookings]);

  const changeFilter = (key: keyof BookingFilters, value: string) => {
    header.resetScroll();
    dispatch({ type: "filter", key, value });
  };

  return {
    ...state,
    ...result,
    options,
    sentinelRef: header.sentinelRef,
    stuck: header.stuck,
    changeFilter,
    sortBy: (column: SortColumn) => dispatch({ type: "sort", column }),
    showMore: () => dispatch({ type: "show-more" }),
  };
}

export type BookingsController = ReturnType<typeof useBookings>;
