const { test, expect } = require("@playwright/test");
const {
  countSocketEvents,
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

const initialDriverGeolocation = {
  latitude: 24.905,
  longitude: 67.18,
};

const updatedDriverGeolocation = {
  latitude: 24.8614,
  longitude: 67.004,
};

test.describe("Live ride tracking", () => {
  test.skip(
    !process.env.VITE_MAPBOX_ACCESS_TOKEN,
    "Set VITE_MAPBOX_ACCESS_TOKEN to run live Mapbox tracking assertions."
  );

  let rider;
  let driver;

  test.beforeEach(async ({ request }) => {
    await resetDatabase();
    rider = await registerRider(request);
    driver = await registerDriver(request);

    await setDriverOnline(request, driver.auth.token, {
      location: {
        lat: initialDriverGeolocation.latitude,
        lng: initialDriverGeolocation.longitude,
        address: "Initial driver position",
      },
    });
  });

  test("shows live driver movement, map routing, and ETA updates for the rider", async ({
    browser,
  }) => {
    const riderContext = await browser.newContext({
      baseURL: PLAYWRIGHT_BASE_URL,
    });
    const driverContext = await browser.newContext({
      baseURL: PLAYWRIGHT_BASE_URL,
      geolocation: initialDriverGeolocation,
      permissions: ["geolocation"],
    });

    const riderPage = await riderContext.newPage();
    const driverPage = await driverContext.newPage();
    await createSocketRecorder(riderPage);
    await createSocketRecorder(driverPage);

    try {
      await loginViaUi(driverPage, {
        role: "driver",
        ...driver.credentials,
      });
      await expect(driverPage).toHaveURL(/\/driver$/);
      await expectSocketEvent(driverPage, "connect");
      await expectSocketEvent(driverPage, "driver:join", { direction: "sent" });

      await loginViaUi(riderPage, rider.credentials);
      await expect(riderPage).toHaveURL(/\/$/);
      await expectSocketEvent(riderPage, "connect");
      await expectSocketEvent(riderPage, "user:join", { direction: "sent" });

      await fillRideBookingForm(riderPage);

      const directionsResponsePromise = riderPage.waitForResponse(
        (response) =>
          response.url().includes("/directions/v5/mapbox/driving/") &&
          response.ok()
      );

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
      expect((await acceptResponsePromise).ok()).toBeTruthy();

      await expectSocketEvent(riderPage, "ride:updated");
      await expect(riderPage.getByTestId("ride-status-badge")).toContainText(
        "driver assigned"
      );

      await expectSocketEvent(riderPage, "ride:driver-location");
      await directionsResponsePromise;

      await expect(riderPage.getByTestId("rider-live-map")).toBeVisible();
      await expect(
        riderPage.getByTestId("rider-live-map-driver-marker")
      ).toBeVisible();
      await expect(riderPage.getByTestId("rider-live-eta")).not.toHaveText(
        /calculating/i
      );

      const initialLatitudeText = await riderPage
        .getByTestId("rider-driver-latitude")
        .textContent();
      const initialEtaText = await riderPage
        .getByTestId("rider-live-eta")
        .textContent();
      const initialDriverLocationEventCount = await countSocketEvents(
        riderPage,
        "ride:driver-location"
      );

      await driverContext.setGeolocation(updatedDriverGeolocation);

      await expect
        .poll(() =>
          countSocketEvents(riderPage, "ride:driver-location")
        )
        .toBeGreaterThan(initialDriverLocationEventCount);

      await expect
        .poll(async () =>
          (await riderPage.getByTestId("rider-driver-latitude").textContent())?.trim()
        )
        .not.toBe(initialLatitudeText?.trim());

      await expect
        .poll(async () =>
          (await riderPage.getByTestId("rider-live-eta").textContent())?.trim()
        )
        .not.toBe(initialEtaText?.trim());
    } finally {
      await riderContext.close();
      await driverContext.close();
    }
  });
});
