import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import serverless from "serverless-http";

import dbConnect from "../src/database";
import authRouter from "../src/routes/authRoutes";
import attendanceRouter from "../src/routes/attendanceRoutes";
import leaveRouter from "../src/routes/leavesRoutes";
import payrollRouter from "../src/routes/payrollRoutes";
import uploadFileRoutes from "../src/routes/uploadRoute";
import eventsRoutes from "../src/routes/eventRoutes";

dotenv.config();

const app = express();

/* ❗ DO NOT parse multipart globally */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://hr-management-dashboard-ten.vercel.app",
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

// Health check
app.get("/", (_req, res) => {
  res.json({
    message: "✅ Backend running successfully!",
    time: new Date().toISOString(),
  });
});

// DB (serverless safe)
let isConnected = false;
async function ensureDBConnection() {
  if (!isConnected) {
    await dbConnect();
    isConnected = true;
    console.log("✅ MongoDB connected");
  }
}
ensureDBConnection();

// Routes
app.use("/auth", authRouter);
app.use("/attendance", attendanceRouter);
app.use("/leave", leaveRouter);
app.use("/payroll", payrollRouter);
app.use("/upload", uploadFileRoutes);
app.use("/events", eventsRoutes);

// ✅ EXPORT FOR VERCEL
export default serverless(app);
