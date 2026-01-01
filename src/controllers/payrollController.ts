import { Request, Response } from "express";
import Payroll from "../models/payrollModel";
import { generateSalarySlipPDF } from "../utils/generateSalarySlipPDF";
import path from "path";

export const generatePayroll = async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      employeeName,
      position,
      month,
      totalWorkingDays,
      year,
      presentDays,
      approvedLeaves,
      basicSalary,
      allowances,
      deductions,
    } = req.body;

    // Check if payroll already exists
    const exists = await Payroll.findOne({ employeeId, month, year });
    if (exists)
      return res.status(400).json({ message: "Payroll already generated" });

    // Calculate salaries
    const totalAllowances =
      (allowances.medical || 0) +
      (allowances.transport || 0) +
      (allowances.others || 0);
    const totalDeductions =
      (deductions.pf || 0) +
      (deductions.loan || 0) +
      (deductions.advanceSalary || 0) +
      (deductions.tax || 0) +
      (deductions.others || 0);

    const grossSalary = basicSalary + totalAllowances;
    const netPay = grossSalary - totalDeductions;

    // Create payroll
    const payroll = await Payroll.create({
      employeeId,
      employeeName,
      position,
      month,
      year,
      presentDays,
      approvedLeaves,
      totalWorkingDays,
      basicSalary,
      allowances,
      deductions,
      grossSalary,
      netPay,
      payrollStatus: "Pending",
    });

    // Generate salary slip
    const salarySlipUrl = await generateSalarySlipPDF(payroll);
    payroll.salarySlipUrl = salarySlipUrl;
    await payroll.save();

    res.status(201).json({
      message: "Payroll & Salary Slip generated successfully",
      payroll,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approvePayroll = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Payroll ID from URL

    const payroll = await Payroll.findById(id);
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });
    payroll.payrollStatus = "Approved";

    await payroll.save();

    res.json({ message: "Payroll approved successfully", payroll });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllPayrolls = async (req: Request, res: Response) => {
  try {
    const { employeeId, employeeName, month, year } = req.query;
    const query: any = {};

    if (employeeId)
      query.employeeId = { $regex: employeeId as string, $options: "i" };
    if (employeeName)
      query.employeeName = { $regex: employeeName as string, $options: "i" };
    if (month) query.month = month as string;
    if (year) query.year = Number(year);

    const payrolls = await Payroll.find(query).sort({ processedAt: -1 });
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updatePayroll = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findById(id);
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });

    if (payroll.isLocked)
      return res
        .status(403)
        .json({ message: "Payroll is locked and cannot be updated" });

    const {
      employeeId,
      employeeName,
      position,
      month,
      year,
      presentDays,
      approvedLeaves,
      basicSalary,
      totalWorkingDays,
      allowances,
      deductions,
    } = req.body;

    // Update fields
    payroll.employeeId = employeeId ?? payroll.employeeId;
    payroll.employeeName = employeeName ?? payroll.employeeName;
    payroll.position = position ?? payroll.position;
    payroll.month = month ?? payroll.month;
    payroll.year = year ?? payroll.year;
    payroll.presentDays = presentDays ?? payroll.presentDays;
    payroll.approvedLeaves = approvedLeaves ?? payroll.approvedLeaves;
    payroll.basicSalary = basicSalary ?? payroll.basicSalary;
    payroll.allowances = allowances ?? payroll.allowances;
    payroll.deductions = deductions ?? payroll.deductions;

    // Recalculate salaries
    const totalAllowances =
      (payroll.allowances.medical || 0) +
      (payroll.allowances.transport || 0) +
      (payroll.allowances.others || 0);
    const totalDeductions =
      (payroll.deductions.pf || 0) +
      (payroll.deductions.loan || 0) +
      (payroll.deductions.advanceSalary || 0) +
      (payroll.deductions.tax || 0) +
      (payroll.deductions.others || 0);

    payroll.grossSalary = payroll.basicSalary + totalAllowances;
    payroll.netPay = payroll.grossSalary - totalDeductions;

    // Regenerate salary slip if requested
    if (req.body.regenerateSalarySlip) {
      const salarySlipUrl = await generateSalarySlipPDF(payroll);
      payroll.salarySlipUrl = salarySlipUrl;
    }

    await payroll.save();
    res.status(200).json({ message: "Payroll updated successfully", payroll });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeePayrolls = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const payrolls = await Payroll.find({ employeeId }).sort({
      processedAt: -1,
    });
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const generateSalarySlip = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId)
      return res.status(400).json({ message: "Employee ID is required" });

    // Find payrolls for the employee where payrollStatus is "Approved"
    const payrolls = await Payroll.find({
      employeeId,
      payrollStatus: "Approved",
    }).sort({ processedAt: -1 }); // latest first

    if (payrolls.length === 0)
      return res
        .status(404)
        .json({ message: "No approved payrolls found for this employee" });

    res.status(200).json({
      success: true,
      message: "Approved payrolls fetched successfully",
      payrolls,
    });
  } catch (error: any) {
    console.error("Error fetching approved payrolls:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
