/* ── the insight panel registry: titles are fixed product copy, the scope
      lines are computed from the month's InsightsData ── */
import type { InsightsData } from "@/lib/contracts";

export const INSIGHT_PANELS = [
  { key: "fees", title: "Channel fees & savings" },
  { key: "stay", title: "Stay patterns" },
  { key: "who", title: "Direct guest breakdown" },
] as const;

export type InsightPanelKey = (typeof INSIGHT_PANELS)[number]["key"];

export function panelScope(key: InsightPanelKey, insights: InsightsData) {
  switch (key) {
    case "fees":
    case "stay":
      return `${insights.stay.totalReservations} reservations · All channels`;
    case "who":
      return `${insights.guests.directCount} website bookings`;
  }
}
