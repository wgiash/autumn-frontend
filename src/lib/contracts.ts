/* The shared data contract between the query layer (src/lib/queries.ts),
   the pages, and every presentational component. One month of the
   dashboard is described entirely by MonthData — pages fetch it server
   side and thread slices down as props. Amounts are DOLLARS (already
   converted from the database's cents) unless a field says Cents. */

import type { Booking } from "@/components/bookings/model";

export type MonthKey = `${number}-${string}`; // "2026-08"

export type MonthOption = { value: MonthKey; label: string }; // "August 2026"

/* ── the funnel tabs above the chart ── */
export type StageDatum = {
  key: "seen" | "visited" | "booked" | "revenue";
  value: number; // raw number; components format
  delta: { value: number | null; kind: "percent" | "absolute" };
};

/* ── weekly chart series (52 rows ending in the viewed month) ── */
export type WeekDatum = {
  start: string; // ISO date, Monday
  adViews: number;
  visits: number;
  bookings: number; // direct
  rev: number; // direct revenue, dollars
  priorBookings: number | null; // null means comparison history is unavailable
  priorRev: number | null;
  /* prior-year traffic for the chart's ghost curves; optional so older
     callers keep compiling, always filled by the query layer */
  priorAdViews?: number | null;
  priorVisits?: number | null;
};

export type ForecastDatum = { start: string; rev: number };

export type LegendDatum = {
  /* per metric: this month, same month last year, next month expected */
  priorMonth: { adViews: number | null; visits: number | null; rev: number | null };
  nextExpected: {
    adViews: number;
    visits: number;
    bookings: number;
    rev: number;
    staysBookedCount: number;
    staysBookedValue: number;
  };
};

export type TrendData = {
  month: MonthKey;
  stages: StageDatum[];
  weeks: WeekDatum[];
  forecast: ForecastDatum[];
  legend: LegendDatum;
};

/* ── hero / savings ── */
export type OutcomeData = {
  attributedValue: number;
  attributedCount: number;
  directCount: number;
  totalCount: number;
  directValue: number;
  attributedFees: number;
  actionsCompleted: number;
};

export type VisibilityCheck = {
  key: "google" | "ai" | "seo";
  title: string;
  value: number;
  of: number;
  note: string;
};

/* ── the rail's action feed ── */
export type ActionDetail = {
  label: string;
  rows: [string, string][];
  note?: string;
};
export type ActionItem = {
  verb: string;
  text: string;
  so?: string;
  detail?: ActionDetail;
  result?: { text: string; kind?: "pricing" };
  status?: string;
  date: string; // "Sep 3"
  datetime: string; // ISO
};
export type ActionsData = {
  planned: ActionItem[];
  completed: ActionItem[];
  reviewCount: number; // direct bookings with no recorded referral
};

/* ── bookings-page insights (all GROUP BYs over the month's bookings) ── */
export type InsightsData = {
  fees: {
    channels: { name: string; count: number; value: number; fee: number; kind: string }[];
    comparisonRate: number; // 0.15
    autumnRate: number; // 0.13
    attributedCount: number;
  };
  stay: {
    medianLeadDays: number;
    avgNights: number;
    avgValue: number;
    totalNights: number;
    totalReservations: number;
    aheadBins: [string, number][];
    nightBins: [string, number][];
  };
  guests: {
    directCount: number;
    directValue: number;
    cityTop: [string, number, number][];
    cityMore: [string, number, number][];
    foundYou: [string, number, number][];
    bookedOn: [string, number, number][];
  };
};

/* ── the whole month, as the pages consume it ── */
export type MonthData = {
  month: MonthKey;
  monthLabel: string; // "August 2026"
  outcomes: OutcomeData;
  trend: TrendData;
  visibility: VisibilityCheck[];
  actions: ActionsData;
  bookings: Booking[]; // client model shape, labels precomputed
  insights: InsightsData;
};

/* ── the query layer's surface (implemented in src/lib/queries.ts) ── */
export type Queries = {
  getAvailableMonths(): Promise<MonthOption[]>;
  getMonthData(month: MonthKey): Promise<MonthData>;
};
