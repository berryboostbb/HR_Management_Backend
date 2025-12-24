import express from "express";
import {
  applyLeave,
  updateLeaveStatus,
  getAllLeaves,
  getEmployeeLeaves,
} from "../controllers/leavesController";

import {
  validateBody,
  leaveApplySchema,
  leaveStatusSchema,
} from "../validations/leaveValidation";

const router = express.Router();
router.post("/apply", validateBody(leaveApplySchema), applyLeave);
router.put(
  "/updateLeaveStatus/:id",
  validateBody(leaveStatusSchema),
  updateLeaveStatus
);
router.get("/getAllLeaves", getAllLeaves);
router.get("/employee/:employeeId", getEmployeeLeaves);

export default router;
