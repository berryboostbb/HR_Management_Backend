import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "../src/database";
import authRouter from "../src/routes/authRoutes";
import attendanceRouter from "../src/routes/attendanceRoutes";
import leaveRouter from "../src/routes/leavesRoutes";
import payrollRouter from "../src/routes/payrollRoutes";
import uploadFileRoutes from "../src/routes/uploadRoute";
import eventsRoutes from "../src/routes/eventRoutes";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://hr-management-dashboard-ten.vercel.app/",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

import mongoose from "mongoose";
async function ensureDBConnection() {
  if (mongoose.connection.readyState === 1) return;
  await dbConnect();
}

app.use(async (req, res, next) => {
  try {
    await ensureDBConnection();
    next();
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(500).json({ error: "DB connection failed" });
  }
});

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Backend running on Vercel Serverless!" });
});

app.use("/auth", authRouter);
app.use("/attendance", attendanceRouter);
app.use("/leave", leaveRouter);
app.use("/payroll", payrollRouter);
app.use("/upload", uploadFileRoutes);
app.use("/events", eventsRoutes);

export default app;
