import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import adminRouter from "./routes/adminRoutes";
import attendanceRouter from "./routes/attendanceRoutes";
import leaveRouter from "./routes/leavesRoutes";
import payrollRouter from "./routes/payrollRoutes";
import uploadFileRoutes from "./routes/uploadRoute";
import eventsRoutes from "./routes/eventRoutes";
import dbConnect from "./database";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://medi-rep-front-end.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// DB connection (safe for serverless)
dbConnect();

// Root
app.get("/", (_req, res) => {
  res.json({ message: "HR-Management API Running on Vercel" });
});

// Routes
app.use("/admin", adminRouter);
app.use("/attendance", attendanceRouter);
app.use("/leave", leaveRouter);
app.use("/payroll", payrollRouter);
app.use("/upload", uploadFileRoutes);
app.use("/events", eventsRoutes);

export default app;
