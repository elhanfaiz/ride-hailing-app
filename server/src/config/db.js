import mongoose from "mongoose";

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing in the environment variables.");
  }

  try {
    console.log(`[DB] Connecting to MongoDB at ${uri}`);
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("[DB] MongoDB connection failed", {
      message: error.message,
      name: error.name,
    });
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};
