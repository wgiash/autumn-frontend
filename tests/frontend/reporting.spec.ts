import { expect, test } from "./test";

test("calendar totals agree between overview and booking insights", async ({ page, request }, testInfo) => {
  await page.goto("/?month=2026-07");
  const metrics = page.getByRole("group", { name: "Chart metric for all website bookings" });
  await expect(metrics.getByRole("button", { name: /^Booked direct/ })).toContainText("43");
  await expect(metrics.getByRole("button", { name: /^Revenue/ })).toContainText("$21,939.72");

  // Desktop insights are inline; use the existing dialog breakpoint for this assertion.
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 960, height: 950 });
  await page.goto("/bookings?month=2026-07");
  await page.getByRole("button", { name: "Direct guest breakdown", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Direct guest breakdown", exact: true });
  const count = dialog.locator("dl > div").filter({ has: page.locator("dt", { hasText: /^Direct bookings$/ }) });
  const value = dialog.locator("dl > div").filter({ has: page.locator("dt", { hasText: /^Direct booking value$/ }) });
  await expect(count.locator("dd")).toHaveText("43");
  await expect(value.locator("dd")).toHaveText("$21,939.72");

  const response = await request.get("/api/report/2026-07");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("text/csv; charset=utf-8");
  expect(response.headers()["content-disposition"]).toBe('attachment; filename="report-2026-07.csv"');
  const csv = await response.text();
  expect(csv).toMatch(/^id,guest,city,channel,referral,attributed,booked,arrival,nights,guests,room,status,device,value,fee\n/);
  expect(csv).toContain("2026-07-31");
  expect((await request.get("/api/report/2026-13")).status()).toBe(404);
});

test("older chart weeks identify unavailable prior history", async ({ page }, testInfo) => {
  await page.goto("/?month=2025-09");
  const plot = page.locator(".chart-port");
  await expect(plot).toBeVisible();
  await plot.scrollIntoViewIfNeeded();
  const hotspot = plot.locator(".hr").first();
  const box = await hotspot.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const x = box.x + box.width / 2;
  const y = box.y + box.height - 35;
  if (testInfo.project.name === "phone") await page.touchscreen.tap(x, y);
  else await page.mouse.move(x, y);
  const tooltip = plot.locator(".chart-tip.is-live");
  await expect(tooltip).toHaveCSS("opacity", "1");
  await expect(tooltip.getByText("Prior year unavailable", { exact: true })).toBeVisible();
  expect(await plot.locator('svg[role="img"]').innerHTML()).not.toMatch(/NaN|Infinity|undefined/);
});
