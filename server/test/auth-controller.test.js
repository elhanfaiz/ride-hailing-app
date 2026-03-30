import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { loginDriver } from "../src/controllers/authController.js";
import { Driver } from "../src/models/Driver.js";

const createResponse = () => ({
  statusCode: 200,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return this;
  },
});

test("loginDriver authenticates valid drivers and returns a JWT", async () => {
  process.env.JWT_SECRET = "test-secret";
  const originalFindOne = Driver.findOne;

  Driver.findOne = (query) => ({
    select: async () => ({
      _id: "driver-id",
      email: query.email,
      fullName: "Usman Driver",
      comparePassword: async (password) => password === "password123",
      toObject: () => ({
        _id: "driver-id",
        email: query.email,
        fullName: "Usman Driver",
      }),
    }),
  });

  const req = {
    body: {
      email: "DRIVER1@UBERCLONE.DEV ",
      password: "password123",
    },
  };
  const res = createResponse();
  let nextError = null;

  await loginDriver(req, res, (error) => {
    nextError = error;
  });

  Driver.findOne = originalFindOne;

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(res.payload.data.role, "driver");
  const decodedToken = jwt.verify(res.payload.data.token, process.env.JWT_SECRET);
  assert.equal(decodedToken.role, "driver");
  assert.equal(res.payload.data.account.email, "driver1@uberclone.dev");
});

test("loginDriver rejects invalid credentials", async () => {
  process.env.JWT_SECRET = "test-secret";
  const originalFindOne = Driver.findOne;

  Driver.findOne = () => ({
    select: async () => ({
      comparePassword: async () => false,
    }),
  });

  const req = {
    body: {
      email: "driver1@uberclone.dev",
      password: "wrong-password",
    },
  };
  const res = createResponse();
  let nextError = null;

  await loginDriver(req, res, (error) => {
    nextError = error;
  });

  Driver.findOne = originalFindOne;

  assert.ok(nextError);
  assert.equal(nextError.message, "Invalid email or password");
});
