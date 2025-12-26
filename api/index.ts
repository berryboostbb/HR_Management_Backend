import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/server"; // path to your app.js
import dbConnect from "../src/database";

let isDbConnected = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isDbConnected) {
      await dbConnect();
      isDbConnected = true;
    }
    app(req, res); // forward the request to Express app
  } catch (error) {
    console.error("Serverless function error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
}
