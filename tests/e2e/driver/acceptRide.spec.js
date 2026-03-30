const { test, expect } = require("@playwright/test");
const {
  createSocketRecorder,
  expectSocketEvent,
  fillRideBookingForm,
  loginViaUi,
  registerDriver,
  registerRider,
  resetDatabase,
  setDriverOnline,
} = require("../helpers/app");

const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";

test.describe("Driver dispatch flow", () => {
  let rider;
  let driver;

  test.beforeEach(async ({ request }) => {
    await resetDatabase();
    rider = await registerRider(request);
    driver = await registerDriver(request);
    await setDriverOnline(request, driver.auth.token);
  });

  test("lets a driver receive a ride request over sockets and accept it", async ({
    browser,
  }) => {
    const driverContext = await browser.newContext({
      baseURL: PLAYWRIGHT_BASE_URL,
    });
    const riderContext = await browser.newContext({
      baseURL: PLAYWRIGHT_BASE_URL,
    });

    const driverPage = await driverContext.newPage();
    const riderPage = await riderContext.newPage();

    await createSocketRecorder(driverPage);

    try {
      await loginViaUi(driverPage, {
        role: "driver",
        ...driver.credentials,
      });

      await expect(driverPage).toHaveURL(/\/driver$/);
      await expect(driverPage.getByTestId("driver-toggle-online")).toBeVisible();
      await expectSocketEvent(driverPage, "connect");
      await expectSocketEvent(driverPage, "driver:join", { direction: "sent" });

      await loginViaUi(riderPage, rider.credentials);
      await expect(riderPage).toHaveURL(/\/$/);

      await fillRideBookingForm(riderPage);

      const estimateResponsePromise = riderPage.waitForResponse(
        (response) =>
          response.url().includes("/api/rides/estimate") &&
          response.request().method() === "POST"
      );
      await riderPage.getByTestId("estimate-ride-button").click();
      expect((await estimateResponsePromise).ok()).toBeTruthy();

      const createRideResponsePromise = riderPage.waitForResponse(
        (response) =>
          response.url().endsWith("/api/rides") &&
          response.request().method() === "POST"
      );
      await riderPage.getByTestId("confirm-ride-button").click();
      expect((await createRideResponsePromise).ok()).toBeTruthy();

      const acceptRideButton = driverPage.getByTestId("accept-ride-button");

      try {
        await expect(acceptRideButton).toBeVisible({ timeout: 5_000 });
      } catch (_error) {
        await driverPage.reload();
        await expect(acceptRideButton).toBeVisible();
      }

      const acceptResponsePromise = driverPage.waitForResponse(
        (response) =>
          response.url().includes("/api/drivers/rides/") &&
          response.url().includes("/respond") &&
          response.request().method() === "PATCH"
      );

      await acceptRideButton.click();

      const acceptResponse = await acceptResponsePromise;
      expect(acceptResponse.ok()).toBeTruthy();

      await expect(driverPage.getByTestId("driver-ride-status")).toContainText(
        "driver assigned"
      );
      await expect(driverPage.getByTestId("start-arriving-button")).toBeVisible();
      await expectSocketEvent(riderPage, "ride:updated");
    } finally {
      await driverContext.close();
      await riderContext.close();
    }
  });
});
