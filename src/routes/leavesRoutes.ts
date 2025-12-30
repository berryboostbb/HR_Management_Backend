import express from "express";
import {
  applyLeave,
  updateLeaveStatus,
  getAllLeaves,
  getEmployeeLeaves,
  deleteLeave,
  updateLeave,
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
router.delete("/deleteLeave/:id", deleteLeave);

router.get("/getAllLeaves", getAllLeaves);
router.put("/updateLeave/:id", updateLeave);

router.get("/employee/:employeeId", getEmployeeLeaves);

export default router;
