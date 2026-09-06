import { expect, test } from "./test";

test("scroll observers release detached rows after navigation", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    const NativeResizeObserver = window.ResizeObserver;
    const targets = new Map<ResizeObserver, Set<Element>>();
    window.ResizeObserver = class extends NativeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super(callback);
        targets.set(this, new Set());
      }
      observe(target: Element, options?: ResizeObserverOptions) {
        targets.get(this)?.add(target);
        super.observe(target, options);
      }
      unobserve(target: Element) {
        targets.get(this)?.delete(target);
        super.unobserve(target);
      }
      disconnect() {
        targets.get(this)?.clear();
        super.disconnect();
      }
    };
    Object.assign(window, {
      detachedResizeTargets: () =>
        [...targets.values()]
          .flatMap((items) => [...items])
          .filter((element) => !element.isConnected).length,
    });
  });
  await page.goto("/?month=2026-08");
  await expect(
    page.getByRole("heading", {
      name: "Your August with Autumn.",
      exact: true,
    }),
  ).toBeVisible();
  for (const route of ["Bookings", "Overview", "Bookings"]) {
    if (testInfo.project.name === "phone")
      await page.getByRole("button", { name: "Menu", exact: true }).click();
    const nav = page.getByRole("navigation", {
      name: testInfo.project.name === "phone" ? "Menu" : "Main",
      exact: true,
    });
    await nav.getByRole("link", { name: route, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      route === "Bookings"
        ? "See all of your bookings in one place."
        : "Your August with Autumn.",
    );
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as unknown as { detachedResizeTargets: () => number }
          ).detachedResizeTargets(),
        ),
      )
      .toBe(0);
  }
});
