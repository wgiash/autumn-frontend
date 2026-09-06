import assert from "node:assert/strict";
import { it } from "node:test";
import { money, money2 } from "./format.ts";
import { smoothstepStops } from "./gradient.ts";
import { EASE } from "./motion.ts";

it("preserves the existing currency labels and rounding", () => {
  assert.equal(money(21380), "$21,380");
  assert.equal(money(0), "$0");
  assert.equal(money2(1965.6), "$1,965.60");
  assert.equal(money2(1241.3999999999999), "$1,241.40");
  assert.equal(money2(0), "$0.00");
});

it("keeps the exact seven gradient stops used by the veil and carousel edges", () => {
  assert.equal(
    smoothstepStops("var(--paper)"),
    [
      "color-mix(in srgb, var(--paper) 0%, transparent) 0%",
      "color-mix(in srgb, var(--paper) 7%, transparent) 17%",
      "color-mix(in srgb, var(--paper) 26%, transparent) 33%",
      "color-mix(in srgb, var(--paper) 50%, transparent) 50%",
      "color-mix(in srgb, var(--paper) 74%, transparent) 67%",
      "color-mix(in srgb, var(--paper) 93%, transparent) 83%",
      "color-mix(in srgb, var(--paper) 100%, transparent) 100%",
    ].join(", "),
  );
});

it("preserves the shared motion curve", () => {
  assert.deepEqual(EASE, [0.22, 0.61, 0.36, 1]);
});
