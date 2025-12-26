// api/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/server"; // Path to your app.js
import dbConnect from "../src/database";

// Serverless-safe DB connection
let isDbConnected = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isDbConnected) {
      await dbConnect();
      isDbConnected = true;
      console.log("✅ MongoDB connected for serverless function");
    }

    // Forward request to Express app
    app(req, res);
  } catch (error) {
    console.error("❌ Serverless function error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
