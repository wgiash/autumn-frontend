import assert from "node:assert/strict";
import { it } from "node:test";
import { ts, weekLabel } from "./format.ts";

it("formats weekly labels in UTC across month and year boundaries", () => {
  assert.equal(weekLabel("2025-09-01"), "Sep 1");
  assert.equal(weekLabel("2025-12-29"), "Dec 29");
  assert.equal(weekLabel("2026-01-05"), "Jan 5");
  assert.equal(weekLabel("2026-08-24"), "Aug 24");
  assert.equal(new Date(ts("2026-01-01")).getUTCFullYear(), 2026);
  assert.equal(new Date(ts("2026-01-01")).getUTCHours(), 0);
});
