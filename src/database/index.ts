// src/database.ts
import mongoose from "mongoose";

let cached: {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
} = (global as any).mongoose || { conn: null, promise: null };

const dbConnect = async () => {
  if (cached.conn) {
    // ✅ Use existing connection if available
    return cached.conn;
  }

  const uri = process.env.MONGODB_CONNECTION_STRING;
  if (!uri) {
    throw new Error(
      "❌ MONGODB_CONNECTION_STRING not set in environment variables"
    );
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", false);
    cached.promise = mongoose
      .connect(uri, {
        dbName: "medi-rep",
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((mongooseInstance) => {
        return mongooseInstance.connection;
      });
  }

  cached.conn = await cached.promise;
  (global as any).mongoose = cached;
  return cached.conn;
};

export default dbConnect;
