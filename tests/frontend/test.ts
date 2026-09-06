import { expect, test as base } from "@playwright/test";

export { expect };
export type { Page } from "@playwright/test";

export const test = base.extend<{ browserErrors: void }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use();
      expect(errors, "Unexpected browser runtime errors").toEqual([]);
    },
    { auto: true },
  ],
});
