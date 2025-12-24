import express from "express";
import dbConnect from "./database";
import dotenv from "dotenv";
import { PORT } from "./config";
import adminRouter from "./routes/adminRoutes";
import attendanceRouter from "./routes/attendanceRoutes";
import leaveRouter from "./routes/leavesRoutes";
import payrollRouter from "./routes/payrollRoutes";
import uploadFileRoutes from "./routes/uploadRoute";

import cors from "cors";
const app = express();
dotenv.config();

app.use(express.json());
dbConnect();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.get("/", (req, res) => {
  res.send("HR-Management API Running");
});

app.use("/admin", adminRouter);
app.use("/attendance", attendanceRouter);
app.use("/leave", leaveRouter);
app.use("/payroll", payrollRouter);
app.use("/upload", uploadFileRoutes);
// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
