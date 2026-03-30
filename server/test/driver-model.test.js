import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { Driver } from "../src/models/Driver.js";

test("Driver.comparePassword supports legacy plain-text seeded passwords", async () => {
  const result = await Driver.schema.methods.comparePassword.call(
    { password: "password123" },
    "password123"
  );

  assert.equal(result, true);
});

test("Driver.comparePassword supports bcrypt-hashed passwords", async () => {
  const hashedPassword = await bcrypt.hash("password123", 10);
  const result = await Driver.schema.methods.comparePassword.call(
    { password: hashedPassword },
    "password123"
  );

  assert.equal(result, true);
});

