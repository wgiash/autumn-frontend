import assert from "node:assert/strict";
import { test } from "node:test";
import { WEEKS, FORECAST } from "../components/chart-data.ts";
import { forecastValues, METRIC_FIELD } from "./chart-series.ts";
import { generateChartMarkup } from "./chart-gen.ts";

const trend = {
  month: "2026-08", stages: [], weeks: WEEKS,
  forecast: FORECAST,
  legend: {
    priorMonth: { adViews: 0, visits: 0, rev: 0 },
    nextExpected: { adViews: 6402, visits: 1018, bookings: 35, rev: 18444.03, staysBookedCount: 14, staysBookedValue: 6900 },
  },
};

test("every forecast metric reconciles exactly to its monthly expectation", () => {
  for (const [metric, field] of Object.entries(METRIC_FIELD)) {
    const scale = metric === "revenue" ? 100 : 1;
    const values = forecastValues(trend, metric);
    assert.equal(values.length, trend.forecast.length);
    assert.equal(values.reduce((sum, value) => sum + Math.round(value * scale), 0), Math.round(trend.legend.nextExpected[field] * scale));
    assert.ok(values.every((value) => Number.isFinite(value) && value >= 0));
  }
});

test("missing or zero priors cannot inflate the booking forecast", () => {
  for (const prior of [null, 0]) {
    const partial = { ...trend, weeks: WEEKS.map((week, i) => ({ ...week, priorBookings: i < 48 ? prior : week.priorBookings })) };
    assert.equal(forecastValues(partial, "booked").reduce((sum, value) => sum + value, 0), 35);
  }
});

test("forecasts support five weeks and absent historical shapes", () => {
  const empty = { ...trend, weeks: [], forecast: [...FORECAST, { start: "2026-09-28", rev: 1000 }] };
  const values = forecastValues(empty, "booked");
  assert.deepEqual(values, [7, 7, 7, 7, 7]);
  assert.deepEqual(forecastValues({ ...empty, forecast: [] }, "booked"), []);
});

test("empty and all-zero chart datasets render without invalid coordinates", () => {
  assert.match(generateChartMarkup({ ...trend, weeks: [] }), /No weekly figures available/);
  const zero = { ...trend, weeks: WEEKS.map(week => ({ ...week, adViews: 0, visits: 0, bookings: 0, rev: 0, priorBookings: null, priorRev: null })), forecast: [] };
  assert.doesNotMatch(generateChartMarkup(zero), /NaN|Infinity|undefined/);
});

test("missing historical comparisons are labelled and never drawn as zero", () => {
  const missing = { ...trend, forecast: [], weeks: WEEKS.map(week => ({ ...week, priorBookings: null, priorRev: null, priorAdViews: null, priorVisits: null })) };
  const markup = generateChartMarkup(missing);
  assert.match(markup, /Prior year unavailable/);
  assert.equal([...markup.matchAll(/class="ghost" d="([^"]*)"/g)].filter(match => match[1] === "").length, 4);
  assert.doesNotMatch(markup, /Prior year: 0|Last year 0|NaN|Infinity/);
});
