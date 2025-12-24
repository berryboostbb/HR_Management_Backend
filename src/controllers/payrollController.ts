import { Request, Response } from "express";
import Payroll from "../models/payrollModel";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { generateSalarySlipPDF } from "../utils/generateSalarySlipPDF";

// Generate payroll
export const generatePayroll = async (req: Request, res: Response) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, deductions } =
      req.body;

    // Check if payroll already exists
    const exists = await Payroll.findOne({ employeeId, month, year });
    if (exists)
      return res.status(400).json({ message: "Payroll already generated" });

    // Calculate total allowances and deductions
    const totalAllowances =
      (allowances.medical || 0) +
      (allowances.transport || 0) +
      (allowances.others || 0);
    const totalDeductions =
      (deductions.pf || 0) +
      (deductions.loan || 0) +
      (deductions.advanceSalary || 0) +
      (deductions.tax || 0) +
      (deductions.custom || 0);

    const totalSalary = basicSalary + totalAllowances - totalDeductions;

    // Create payroll
    const payroll = await Payroll.create({
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      totalSalary,
    });

    const salarySlipUrl: string = await generateSalarySlipPDF(payroll);

    // Save PDF URL to payroll
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
// Approve payroll
export const approvePayroll = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });

    payroll.approvedBy = approvedBy;
    payroll.isLocked = true;

    await payroll.save();

    res.json({ message: "Payroll approved and locked", payroll });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all payrolls
export const getAllPayrolls = async (req: Request, res: Response) => {
  try {
    const payrolls = await Payroll.find().sort({ processedAt: -1 });
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get payroll of a specific employee
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
    const { id } = req.params; // match the route param
    const payroll = await Payroll.findById(id);
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });

    // Generate PDF
    const salarySlipUrl = await generateSalarySlipPDF(payroll);

    // Save URL in payroll
    payroll.salarySlipUrl = salarySlipUrl;
    await payroll.save();

    res.status(200).json({
      message: "Salary slip generated successfully",
      salarySlipUrl,
      payroll,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadSalarySlip = async (req: Request, res: Response) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll || !payroll.salarySlipUrl) {
    return res.status(404).json({ message: "Salary slip not found" });
  }

  const filePath = path.join(process.cwd(), payroll.salarySlipUrl);
  res.download(filePath);
};
