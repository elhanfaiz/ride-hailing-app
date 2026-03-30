import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const pointSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: "" },
  },
  { _id: false }
);

const driverSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true },
    vehicle: {
      make: { type: String, required: true },
      model: { type: String, required: true },
      color: { type: String, required: true },
      plateNumber: { type: String, required: true },
      category: {
        type: String,
        enum: ["UberX", "Comfort", "Black", "XL"],
        default: "UberX",
      },
    },
    currentLocation: {
      type: pointSchema,
      default: { lat: 24.8607, lng: 67.0011, address: "Karachi" },
    },
    isOnline: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["idle", "assigned", "on_trip"],
      default: "idle",
    },
    rating: { type: Number, default: 4.8 },
    totalEarnings: { type: Number, default: 0 },
    lastSocketId: { type: String, default: null },
  },
  { timestamps: true }
);

driverSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

driverSchema.pre("insertMany", async function hashPasswords(next, docs) {
  const hashedDocs = await Promise.all(
    docs.map(async (doc) => {
      if (!doc.password || doc.password.startsWith("$2")) {
        return doc;
      }

      return {
        ...doc,
        password: await bcrypt.hash(doc.password, 10),
      };
    })
  );

  docs.splice(0, docs.length, ...hashedDocs);
  next();
});

driverSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password?.startsWith("$2")) {
    return Promise.resolve(candidatePassword === this.password);
  }

  return bcrypt.compare(candidatePassword, this.password);
};

export const Driver = mongoose.model("Driver", driverSchema);
