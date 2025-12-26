// src/database.ts
import mongoose from "mongoose";

let cached = (global as any).mongoose || { conn: null, promise: null };

const dbConnect = async () => {
  if (cached.conn) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  const uri = process.env.MONGODB_CONNECTION_STRING;
  console.log("🚀 ~ dbConnect ~ uri:", uri);

  if (!uri) {
    throw new Error(
      "❌ MONGODB_CONNECTION_STRING not set in environment variables"
    );
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", false);
    cached.promise = mongoose
      .connect(uri, {
        dbName: "Hr-management",
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected:", mongooseInstance.connection.host);
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  (global as any).mongoose = cached;
};

export default dbConnect;
