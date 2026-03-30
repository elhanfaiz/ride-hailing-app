import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";
import { Driver } from "../models/Driver.js";
import { Ride } from "../models/Ride.js";
import { Payment } from "../models/Payment.js";

dotenv.config();

const run = async () => {
  await connectDatabase();
  await Promise.all([
    User.deleteMany({}),
    Driver.deleteMany({}),
    Ride.deleteMany({}),
    Payment.deleteMany({}),
  ]);

  const admin = await User.create({
    fullName: "Admin User",
    email: "admin@uberclone.dev",
    password: "password123",
    phone: "+923001112233",
    role: "admin",
  });

  const rider = await User.create({
    fullName: "Ayesha Khan",
    email: "rider@uberclone.dev",
    password: "password123",
    phone: "+923001234567",
  });

  await Driver.insertMany([
    {
      fullName: "Usman Driver",
      email: "driver1@uberclone.dev",
      password: "password123",
      phone: "+923009998887",
      isOnline: true,
      currentLocation: {
        lat: 24.8607,
        lng: 67.0011,
        address: "Shahrah-e-Faisal",
      },
      vehicle: {
        make: "Toyota",
        model: "Yaris",
        color: "Black",
        plateNumber: "ABC-123",
        category: "UberX",
      },
    },
    {
      fullName: "Ali Driver",
      email: "driver2@uberclone.dev",
      password: "password123",
      phone: "+923008887766",
      isOnline: true,
      currentLocation: {
        lat: 24.8733,
        lng: 67.0333,
        address: "PECHS",
      },
      vehicle: {
        make: "Honda",
        model: "City",
        color: "White",
        plateNumber: "XYZ-789",
        category: "Comfort",
      },
    },
  ]);

  console.log("Seed completed", {
    adminEmail: admin.email,
    riderEmail: rider.email,
  });

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});

