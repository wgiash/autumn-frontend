import { expect, test } from "./test";

test("chart hover and touch selection keep the figures reachable", async ({
  page,
}, testInfo) => {
  await page.goto("/?month=2026-08");
  const plot = page.locator(".chart-port");
  await expect(plot).toBeVisible();
  await page.addStyleTag({
    content: "nextjs-portal { pointer-events: none; visibility: hidden; }",
  });
  await plot.scrollIntoViewIfNeeded();
  const hotspot = plot.locator(".hr").nth(13);
  const box = await hotspot.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const x = box.x + box.width / 2;
  // Stay below the tooltip so a second tap reaches the plot, not its pinned overlay.
  const y = box.y + box.height - 35;
  const tooltip = plot.locator(".chart-tip.is-live");

  if (testInfo.project.name === "phone") {
    await page.touchscreen.tap(x, y);
    await expect(plot.locator('[data-sel="87"]')).toHaveCount(1);
    await expect(tooltip).toHaveCSS("opacity", "1");
    await page.touchscreen.tap(x, y);
    await expect(plot.locator("[data-sel]")).toHaveCount(0);
    await expect(tooltip).toHaveCSS("opacity", "0");
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.move(x, y);
    await expect(tooltip).toHaveCSS("opacity", "1");
  }
  await expect(
    tooltip.getByText("Week of Dec 1", { exact: true }),
  ).toBeVisible();
  await tooltip
    .getByRole("button", { name: "View figures", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Weekly figures",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('tr[data-week="2025-12-01"]')).toHaveClass(
    /row-hl/,
  );
  await expect(dialog.locator('tr[data-week="2025-12-01"]')).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();

  if (testInfo.project.name !== "phone") {
    const bar = await plot.locator(".bar").nth(20).boundingBox();
    expect(bar).not.toBeNull();
    if (!bar) return;
    await page.mouse.click(bar.x + bar.width / 2, bar.y + bar.height - 2);
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".row-hl")).toHaveCount(1);
    await page.mouse.click(2, 2);
    await expect(dialog).not.toBeVisible();
  }
});
