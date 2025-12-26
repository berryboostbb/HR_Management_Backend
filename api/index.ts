// api/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "../src/database/index";
import adminRouter from "../src/routes/adminRoutes";
import attendanceRouter from "../src/routes/attendanceRoutes";
import leaveRouter from "../src/routes/leavesRoutes";
import payrollRouter from "../src/routes/payrollRoutes";
import uploadFileRoutes from "../src/routes/uploadRoute";
import eventsRoutes from "../src/routes/eventRoutes";

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
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// DB connection per request (for serverless)
let isConnected = false;
async function ensureDBConnection() {
  if (!isConnected) {
    await dbConnect();
    isConnected = true;
  }
}

app.use(async (_req, _res, next) => {
  await ensureDBConnection();
  next();
});

// Routes
app.get("/", (_req, res) => {
  res.status(200).json({ message: "Backend running on Vercel Serverless!" });
});

app.use("/admin", adminRouter);
app.use("/attendance", attendanceRouter);
app.use("/leave", leaveRouter);
app.use("/payroll", payrollRouter);
app.use("/upload", uploadFileRoutes);
app.use("/events", eventsRoutes);

// ✅ IMPORTANT: export default for Vercel
export default app;
