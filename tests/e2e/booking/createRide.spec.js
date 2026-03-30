const { test, expect } = require("@playwright/test");
const {
  fillRideBookingForm,
  loginViaUi,
  registerDriver,
  registerRider,
  resetDatabase,
  setDriverOnline,
} = require("../helpers/app");

test.describe("Ride booking flow", () => {
  let rider;
  let driver;

  test.beforeEach(async ({ request }) => {
    await resetDatabase();
    rider = await registerRider(request);
    driver = await registerDriver(request);
    await setDriverOnline(request, driver.auth.token);
  });

  test("creates a ride from the rider UI and shows the active trip state", async ({
    page,
  }) => {
    await loginViaUi(page, rider.credentials);
    await expect(page).toHaveURL(/\/$/);

    await fillRideBookingForm(page);

    const estimateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/rides/estimate") &&
        response.request().method() === "POST"
    );

    await page.getByTestId("estimate-ride-button").click();

    const estimateResponse = await estimateResponsePromise;
    expect(estimateResponse.ok()).toBeTruthy();

    await expect(page.getByTestId("fare-estimate-card")).toBeVisible();
    await expect(page.getByText(driver.payload.fullName).first()).toBeVisible();

    const createRideResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/rides") &&
        response.request().method() === "POST"
    );

    await page.getByTestId("confirm-ride-button").click();

    const createRideResponse = await createRideResponsePromise;
    expect(createRideResponse.ok()).toBeTruthy();

    await expect(page.getByTestId("ride-status-badge")).toBeVisible();
    await expect(page.getByTestId("ride-status-badge")).toContainText("searching");
    await expect(page.getByTestId("rider-live-map")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /shahrah-e-faisal, karachi to clifton block 5, karachi/i })
    ).toBeVisible();
  });
});
