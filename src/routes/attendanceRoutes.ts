import express from "express";
import {
  checkIn,
  checkOut,
  getAllAttendance,
  editAttendance,
} from "../controllers/attendanceController";

import {
  validateBody,
  checkInSchema,
  checkOutSchema,
  editAttendanceSchema,
} from "../validations/attendanceValidation";

const router = express.Router();

router.post("/checkin", validateBody(checkInSchema), checkIn);
router.post("/checkout", validateBody(checkOutSchema), checkOut);
router.get("/getAllAttendance", getAllAttendance);
router.put(
  "/UpdateAttendance/:id",
  validateBody(editAttendanceSchema),
  editAttendance
);

export default router;
