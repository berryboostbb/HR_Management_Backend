// app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import adminRouter from "../src/routes/adminRoutes";
import attendanceRouter from "../src/routes/attendanceRoutes";
import leaveRouter from "../src/routes/leavesRoutes";
import payrollRouter from "../src/routes/payrollRoutes";
import uploadFileRoutes from "../src/routes/uploadRoute";
import eventsRoutes from "../src/routes/eventRoutes";

dotenv.config();

const app = express();

// ✅ Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

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

// ✅ Routes
app.use("/admin", adminRouter);
app.use("/attendance", attendanceRouter);
app.use("/leave", leaveRouter);
app.use("/payroll", payrollRouter);
app.use("/upload", uploadFileRoutes);
app.use("/events", eventsRoutes);

// ✅ Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "✅ GCC Backend (Serverless) is running successfully on Vercel!",
    timestamp: new Date().toISOString(),
  });
});

export default app;
