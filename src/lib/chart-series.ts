import type { StageDatum, TrendData } from "./contracts";

export type Metric = StageDatum["key"];
export const METRIC_FIELD = {
  seen: "adViews", visited: "visits", booked: "bookings", revenue: "rev",
} as const;

// Weekly shapes distribute the stored monthly expectation; they never infer
// growth from unmatched historical windows. Integer allocation preserves totals.
export function forecastValues(trend: TrendData, metric: Metric): number[] {
  if (!trend.forecast.length) return [];
  const field = METRIC_FIELD[metric];
  const scale = metric === "revenue" ? 100 : 1;
  const target = Math.round(trend.legend.nextExpected[field] * scale);
  const history = new Map(trend.weeks.map((week) => [week.start, week]));
  let weights = trend.forecast.map((week) => {
    if (metric === "revenue") return Math.max(0, week.rev);
    const priorDate = new Date(Date.parse(week.start + "T00:00:00Z") - 364 * 86400000)
      .toISOString().slice(0, 10);
    return Math.max(0, history.get(priorDate)?.[field] ?? 0);
  });
  if (!weights.some((weight) => weight > 0)) weights = weights.map(() => 1);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const raw = weights.map((weight) => target * weight / weightSum);
  const result = raw.map(Math.floor);
  const remaining = target - result.reduce((sum, value) => sum + value, 0);
  const order = raw.map((value, index) => ({ index, remainder: value - result[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let i = 0; i < remaining; i++) result[order[i].index]++;
  return result.map((value) => value / scale);
}
