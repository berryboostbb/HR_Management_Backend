import express from "express";
import {
  checkIn,
  checkOut,
  getAllAttendance,
  editAttendance,
  getAttendanceSummary,
  getUserAttendanceStatus,
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
router.post("/checkout", validateBody(checkOutSchema), checkOut);
router.get("/getAllAttendance", getAllAttendance);
router.get("/getAttendanceSummary", getAttendanceSummary);

router.put(
  "/UpdateAttendance/:id",
  validateBody(editAttendanceSchema),
  editAttendance
);

router.get("/attendance/status", auth, getUserAttendanceStatus);

export default router;
