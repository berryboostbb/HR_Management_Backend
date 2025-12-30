import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "./database";
import authRouter from "./routes/authRoutes";
import attendanceRouter from "../src/routes/attendanceRoutes";
import leaveRouter from "../src/routes/leavesRoutes";
import payrollRouter from "../src/routes/payrollRoutes";
import uploadFileRoutes from "../src/routes/uploadRoute";
import eventsRoutes from "../src/routes/eventRoutes";
import { PORT } from "./config";
import { createServer } from "http";

dotenv.config();

const app = express();

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

// Default route
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "✅ Backend running successfully!",
    time: new Date().toISOString(),
  });
});

// MongoDB connection
// MongoDB connection function
let isConnected = false;
async function ensureDBConnection() {
  console.log("🚀 ~ ensureDBConnection ~ ensureDBConnection:");

  if (!isConnected) {
    try {
      await dbConnect();
      console.log("✅ MongoDB connected");
      isConnected = true;
    } catch (err) {
      console.error("❌ DB connection failed:", err);
    }
  }
}

// Call the connection function directly on startup to ensure MongoDB is connected
ensureDBConnection();

app.use("/auth", authRouter);
app.use("/attendance", attendanceRouter);
app.use("/leave", leaveRouter);
app.use("/payroll", payrollRouter);
app.use("/upload", uploadFileRoutes);
app.use("/events", eventsRoutes);

const server = createServer(app);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
