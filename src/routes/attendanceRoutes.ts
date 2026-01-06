import express from "express";
import {
  checkIn,
  checkOut,
  getAllAttendance,
  editAttendance,
  getAttendanceSummary,
  getUserAttendanceStatus,
  startBreak,
  endBreak,
  createDailyAttendance,
  updateAttendanceAdmin,
  getMonthlyAttendanceGraph,
  setCompanyTiming,
  getCompanyTiming,
} from "../controllers/attendanceController";

import {
  validateBody,
  checkInSchema,
  checkOutSchema,
  editAttendanceSchema,
} from "../validations/attendanceValidation";
import auth from "../middleware/auth";

const router = express.Router();

router.post("/checkin", auth, checkIn);
router.post("/startBreak", auth, startBreak);
router.post("/endBreak", auth, endBreak);
router.post("/checkout", validateBody(checkOutSchema), checkOut);
router.get("/getAllAttendance", getAllAttendance);
router.get("/getAttendanceSummary", getAttendanceSummary);

router.put(
  "/UpdateAttendance/:id",
  validateBody(editAttendanceSchema),
  editAttendance
);
router.put("/updateAttendanceAdmin/:id", updateAttendanceAdmin);
router.get("/status", auth, getUserAttendanceStatus);

router.post("/createDailyAttendance", auth, createDailyAttendance);
router.get("/getMonthlyAttendanceGraph", getMonthlyAttendanceGraph);
router.post("/setCompanyTiming", setCompanyTiming);
router.get("/getCompanyTiming", getCompanyTiming);

export default router;
