import assert from "node:assert/strict";
import { test } from "node:test";
import { csvCell } from "./csv.ts";

test("CSV preserves numbers, booleans, and ordinary guest text", () => {
  for (const value of ["Morgan L.", "Boston", 0, 12.34, -12.34, true, false, ""]) {
    assert.equal(csvCell(value), String(value));
  }
});

test("CSV quotes delimiters, quotes, and both newline forms", () => {
  assert.equal(csvCell('A, "B"'), '"A, ""B"""');
  assert.equal(csvCell("A\rB"), '"A\rB"');
  assert.equal(csvCell("A\nB"), '"A\nB"');
  assert.equal(csvCell("A\r\nB"), '"A\r\nB"');
});

test("CSV neutralizes spreadsheet formula and control prefixes", () => {
  for (const value of ["=1+1", "+1+1", "-1+1", "@SUM(1)", " =1+1", "\t=1+1", "\r=1+1", "\n=1+1", "\ttext", "\u0000=1+1", "\uff1d1+1"]) {
    const cell = csvCell(value);
    const unquoted = cell.startsWith('"') ? cell.slice(1, -1).replaceAll('""', '"') : cell;
    assert.equal(unquoted, "'" + value);
  }
});
