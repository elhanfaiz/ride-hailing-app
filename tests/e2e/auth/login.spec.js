const { test, expect } = require("@playwright/test");
const {
  loginViaUi,
  registerRider,
  resetDatabase,
} = require("../helpers/app");

test.describe("Rider login flow", () => {
  let rider;

  test.beforeEach(async ({ request }) => {
    await resetDatabase();
    rider = await registerRider(request);
  });

  test("redirects a rider to the booking dashboard after login", async ({ page }) => {
    await loginViaUi(page, rider.credentials);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("pickup-address")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /where are you headed today/i })
    ).toBeVisible();
  });
});
