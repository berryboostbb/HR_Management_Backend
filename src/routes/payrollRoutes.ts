import express from "express";
import {
  generatePayroll,
  approvePayroll,
  getAllPayrolls,
  getEmployeePayrolls,
  downloadSalarySlip,
  generateSalarySlip,
  updatePayroll,
} from "../controllers/payrollController";

import {
  validateBody,
  payrollSchema,
  approvePayrollSchema,
} from "../validations/payrollValidation";

const router = express.Router();

router.post("/generatePayroll", validateBody(payrollSchema), generatePayroll);

router.put("/approve/:id", approvePayroll);

router.get("/getAllPayrolls", getAllPayrolls);
router.put("/updatePayroll/:id", updatePayroll);
router.get("/employee/:employeeId", getEmployeePayrolls);
router.post("/generateSalarySlip/:id", generateSalarySlip);
router.get("/salarySlip/:id", downloadSalarySlip);

export default router;
