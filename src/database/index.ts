// src/database.ts
import mongoose from "mongoose";

let cached = (global as any).mongoose || { conn: null, promise: null };

const dbConnect = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_CONNECTION_STRING;
  if (!uri) throw new Error("MONGODB_CONNECTION_STRING not set");

  if (!cached.promise) {
    mongoose.set("strictQuery", false);
    cached.promise = mongoose.connect(uri, {
      dbName: "hr-management",
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  }

  cached.conn = await cached.promise;
  (global as any).mongoose = cached;
  return cached.conn;
};

export default dbConnect;
