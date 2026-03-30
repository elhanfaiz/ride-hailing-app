const { randomUUID } = require("crypto");
const { expect } = require("@playwright/test");

const API_BASE_URL = process.env.E2E_API_URL || "http://localhost:5000/api";
const DEFAULT_PASSWORD = "password123";

const DEFAULT_PICKUP = {
  address: "Shahrah-e-Faisal, Karachi",
  lat: 24.8607,
  lng: 67.0011,
};

const DEFAULT_DROPOFF = {
  address: "Clifton Block 5, Karachi",
  lat: 24.8138,
  lng: 67.0295,
};

const DEFAULT_DRIVER_LOCATION = {
  lat: 24.8722,
  lng: 67.0205,
  address: "PECHS Block 6, Karachi",
};

const parseJsonResponse = async (response, label) => {
  const text = await response.text();

  if (!response.ok()) {
    throw new Error(`${label} failed with ${response.status()}: ${text}`);
  }

  return text ? JSON.parse(text) : {};
};

const uniqueEmail = (prefix) =>
  `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}@rideflow-e2e.dev`;

const buildDriverPayload = (overrides = {}) => {
  const vehicleOverrides = overrides.vehicle || {};
  const baseVehicle = {
    make: "Toyota",
    model: "Corolla",
    color: "Black",
    plateNumber: `E2E-${randomUUID().slice(0, 6).toUpperCase()}`,
    category: "UberX",
  };

  return {
    fullName: "E2E Driver",
    email: uniqueEmail("driver"),
    password: DEFAULT_PASSWORD,
    phone: "+923001112233",
    ...overrides,
    vehicle: {
      ...baseVehicle,
      ...vehicleOverrides,
    },
  };
};

async function resetDatabase() {
  const { default: mongoose } = await import("mongoose");
  const connection = await mongoose
    .createConnection(process.env.E2E_MONGODB_URI || "mongodb://127.0.0.1:27017/uber-clone-playwright")
    .asPromise();

  try {
    await connection.dropDatabase();
  } finally {
    await connection.close();
  }
}

async function registerRider(request, overrides = {}) {
  const payload = {
    fullName: "E2E Rider",
    email: uniqueEmail("rider"),
    password: DEFAULT_PASSWORD,
    phone: "+923004445566",
    ...overrides,
  };

  const response = await request.post(`${API_BASE_URL}/auth/users/register`, {
    data: payload,
  });
  const body = await parseJsonResponse(response, "Register rider");

  return {
    payload,
    credentials: {
      email: payload.email,
      password: payload.password,
    },
    auth: body.data,
  };
}

async function registerDriver(request, overrides = {}) {
  const payload = buildDriverPayload(overrides);
  const response = await request.post(`${API_BASE_URL}/auth/drivers/register`, {
    data: payload,
  });
  const body = await parseJsonResponse(response, "Register driver");

  return {
    payload,
    credentials: {
      email: payload.email,
      password: payload.password,
    },
    auth: body.data,
  };
}

async function loginApi(request, role, credentials) {
  const endpoint =
    role === "driver" ? "/auth/drivers/login" : "/auth/users/login";

  const response = await request.post(`${API_BASE_URL}${endpoint}`, {
    data: credentials,
  });
  const body = await parseJsonResponse(response, `${role} login`);

  return body.data;
}

async function setDriverOnline(
  request,
  token,
  {
    isOnline = true,
    location = DEFAULT_DRIVER_LOCATION,
  } = {}
) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const availabilityResponse = await request.patch(
    `${API_BASE_URL}/drivers/availability`,
    {
      headers,
      data: { isOnline },
    }
  );
  await parseJsonResponse(availabilityResponse, "Update driver availability");

  const locationResponse = await request.patch(`${API_BASE_URL}/drivers/location`, {
    headers,
    data: { location },
  });
  await parseJsonResponse(locationResponse, "Update driver location");

  return location;
}

async function createRideViaApi(
  request,
  token,
  {
    pickup = DEFAULT_PICKUP,
    dropoff = DEFAULT_DROPOFF,
    paymentMethod = "cash",
  } = {}
) {
  const response = await request.post(`${API_BASE_URL}/rides`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      pickup,
      dropoff,
      paymentMethod,
    },
  });

  return parseJsonResponse(response, "Create ride");
}

async function loginViaUi(page, { role = "user", email, password }) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  if (role === "driver") {
    await page.getByTestId("login-role-driver").click();
  } else {
    await page.getByTestId("login-role-user").click();
  }

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
}

async function fillRideBookingForm(
  page,
  {
    pickup = DEFAULT_PICKUP,
    dropoff = DEFAULT_DROPOFF,
    paymentMethod = "cash",
  } = {}
) {
  await page.getByTestId("pickup-address").fill(pickup.address);
  await page.getByTestId("pickup-latitude").fill(String(pickup.lat));
  await page.getByTestId("pickup-longitude").fill(String(pickup.lng));

  await page.getByTestId("dropoff-address").fill(dropoff.address);
  await page.getByTestId("dropoff-latitude").fill(String(dropoff.lat));
  await page.getByTestId("dropoff-longitude").fill(String(dropoff.lng));
  await page.getByTestId("payment-method").selectOption(paymentMethod);
}

async function createSocketRecorder(page) {
  await page.addInitScript(() => {
    window.__rideFlowSocketEvents = [];
  });
}

async function expectSocketEvent(
  page,
  eventName,
  { direction = "received" } = {}
) {
  await expect
    .poll(
      () =>
        page.evaluate(
          ({ direction, eventName }) =>
            (window.__rideFlowSocketEvents || []).some(
              (entry) =>
                entry.direction === direction && entry.eventName === eventName
            ),
          { direction, eventName }
        ),
      {
        message: `Expected socket event "${eventName}" (${direction}) to be observed`,
      }
    )
    .toBe(true);
}

const countSocketEvents = (page, eventName, { direction = "received" } = {}) =>
  page.evaluate(
    ({ direction, eventName }) =>
      (window.__rideFlowSocketEvents || []).filter(
        (entry) => entry.direction === direction && entry.eventName === eventName
      ).length,
    { direction, eventName }
  );

module.exports = {
  API_BASE_URL,
  DEFAULT_DROPOFF,
  DEFAULT_DRIVER_LOCATION,
  DEFAULT_PICKUP,
  countSocketEvents,
  createRideViaApi,
  createSocketRecorder,
  expectSocketEvent,
  fillRideBookingForm,
  loginApi,
  loginViaUi,
  registerDriver,
  registerRider,
  resetDatabase,
  setDriverOnline,
};
