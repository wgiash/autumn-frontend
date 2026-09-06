import { expect, test, type Page } from "./test";

async function openPage(page: Page, path: string) {
  await page.goto(`${path}?month=2026-08`);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    path.startsWith("/bookings")
      ? "See all of your bookings in one place."
      : "Your August with Autumn.",
  );
  // Route headings also appear in loading fallbacks; wait for the report itself.
  if (path.startsWith("/bookings")) {
    await expect(
      page.locator('section[aria-labelledby="list-title"] details'),
    ).toHaveCount(10);
  } else {
    await expect(
      page.getByRole("group", { name: "Chart metric for all website bookings" }),
    ).toBeVisible();
    await expect(
      page.locator('[aria-label="Attention and Autumn\'s next steps"]:visible'),
    ).toBeVisible();
  }
  await page.mouse.move(0, 0);
  await page.addStyleTag({
    content: "nextjs-portal { pointer-events: none; visibility: hidden; }",
  });
}

test("overview layout, disclosures, and weekly figures stay unchanged", async ({
  page,
}) => {
  await openPage(page, "/");
  await expect(page).toHaveScreenshot("overview.png");
  const rail = page.locator(
    '[aria-label="Attention and Autumn\'s next steps"]:visible',
  );
  const completed = rail.locator("details.group\\/completed");
  await completed.locator(":scope > summary").click();
  await expect(completed).toHaveAttribute("open", "");
  const action = rail.locator("details.group\\/card").first();
  await action.locator(":scope > summary").click();
  await expect(
    action.getByText("Pricing factors", { exact: true }),
  ).toBeVisible();
  await action.locator(":scope > summary").click();
  await completed.locator(":scope > summary").click();

  const metricGroup = page.getByRole("group", {
    name: "Chart metric for all website bookings",
  });
  for (const [label, mode] of [
    ["Seen", "seen"],
    ["Visited", "visited"],
    ["Booked direct", "booked"],
    ["Revenue", "revenue"],
  ]) {
    const button = metricGroup.getByRole("button", {
      name: new RegExp(`^${label}`),
    });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(`.chart-port.mode-${mode}`)).toBeVisible();
  }
  await expect(page.locator(".chart-port")).toHaveScreenshot("chart.png");
  await page
    .getByRole("button", { name: "Weekly figures", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Weekly figures",
    exact: true,
  });
  await expect(dialog.getByRole("row")).toHaveCount(53);
  await expect(dialog).toHaveScreenshot("weekly-figures.png");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();

  const savings = page.locator('section[aria-labelledby="impact-title"]');
  await savings.getByText("How this is estimated", { exact: true }).click();
  await savings.getByText("Search visibility", { exact: true }).click();
  await expect(savings).toHaveScreenshot("savings-expanded.png", {
    /* assertion-level stylePath replaces the config's, so both files ride */
    stylePath: [
      "./tests/frontend/screenshot.css",
      "./tests/frontend/hide-header.css",
    ],
  });
});

test("navigation, report month controls, and route changes keep working", async ({
  page,
}, testInfo) => {
  await openPage(page, "/");
  if (testInfo.project.name === "phone") {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await expect(
      page.getByRole("navigation", { name: "Menu", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveScreenshot("phone-menu.png");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Menu", exact: true }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  }
  const month = page.locator('nav[aria-label="Report month"]:visible');
  await expect(
    month.getByRole("button", { name: "Next month" }),
  ).toBeDisabled();
  await month.getByRole("button", { name: "Previous month" }).click();
  await expect(month.getByText("July 2026", { exact: true })).toBeVisible();
  await month.getByRole("button", { name: "Next month" }).click();
  await expect(month.getByText("August 2026", { exact: true })).toBeVisible();
  const nav = page.getByRole("navigation", {
    name: testInfo.project.name === "phone" ? "Menu" : "Main",
    exact: true,
  });
  await nav.getByRole("link", { name: "Bookings", exact: true }).click();
  await expect(page).toHaveURL(/\/bookings(?:\?.*)?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "See all of your bookings in one place.",
  );
  await expect(
    page.getByRole("navigation", { name: "Menu", exact: true }),
  ).not.toBeVisible();
});

test("booking pagination, sorting, and empty-filter recovery are preserved", async ({
  page,
}, testInfo) => {
  await openPage(page, "/bookings");
  await expect(page).toHaveScreenshot("bookings.png");
  const table = page.locator('section[aria-labelledby="list-title"]');
  const rows = table.locator("details");
  await expect(rows).toHaveCount(10);
  for (const count of [25, 40, 55, 59]) {
    await table.getByRole("button", { name: "Show more", exact: true }).click();
    await expect(rows).toHaveCount(count);
  }
  await expect(
    table.getByRole("button", { name: "Show more", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-nav-solid", "");
  await table
    .getByRole("button", { name: "Sort by guest", exact: true })
    .click();
  const names = await rows
    .locator("summary > div:first-child > span > span:first-child")
    .allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

  const chooseChannel = async (label: string) => {
    if (testInfo.project.name === "desktop") {
      await page
        .getByRole("group", { name: "Filter bookings by channel" })
        .getByRole("button", { name: new RegExp(`^${label}`) })
        .click();
    } else {
      await page.locator('button[aria-label="Booked through"]:visible').click();
      await page
        .getByRole("menuitemradio", { name: label, exact: true })
        .click();
      await expect(page.getByRole("menu")).toHaveCount(0);
    }
  };
  await chooseChannel("Expedia");
  await expect(rows).toHaveCount(7);
  await page.locator('button[aria-label="Device"]:visible').click();
  await page
    .getByRole("menuitemradio", { name: "Tablet", exact: true })
    .click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(
    table.getByText("0 of 0 bookings shown", { exact: true }),
  ).toBeVisible();
  await chooseChannel("Your website");
  await expect(rows).toHaveCount(2);
  await rows.first().locator("summary").click();
  await expect(
    rows.first().getByText("Reservation", { exact: true }),
  ).toBeVisible();
});

test("booking insights retain their layout and keyboard interactions", async ({
  page,
}, testInfo) => {
  // Desktop presents the same insights inline; open at tablet width, then verify the dialog at desktop size.
  if (testInfo.project.name === "desktop")
    await page.setViewportSize({ width: 960, height: 950 });
  await openPage(page, "/bookings");
  for (const [key, title] of [
    ["fees", "Channel fees & savings"],
    ["stay", "Stay patterns"],
    ["guests", "Direct guest breakdown"],
  ]) {
    const trigger = page.getByRole("button", { name: title, exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: title, exact: true });
    await expect(dialog).toBeVisible();
    if (testInfo.project.name === "desktop")
      await page.setViewportSize({ width: 1440, height: 950 });
    await expect(dialog).toHaveScreenshot(`insight-${key}.png`);
    if (key === "guests") {
      await dialog.getByRole("tab", { name: "City", exact: true }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(
        dialog.getByRole("tab", { name: "Source", exact: true }),
      ).toBeFocused();
      await expect(dialog.getByRole("tabpanel")).toHaveCount(1);
      await page.keyboard.press("End");
      await expect(
        dialog.getByRole("tab", { name: "Device", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("Home");
      await dialog.getByText("5 more cities", { exact: true }).click();
      await expect(dialog.getByRole("row")).toHaveCount(10);
    }
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    if (testInfo.project.name === "desktop")
      await page.setViewportSize({ width: 960, height: 950 });
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});
