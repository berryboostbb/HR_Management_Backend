import mongoose, { Schema, Document, Types } from "mongoose";

interface IDeductions {
  pf: number;
  loan: number;
  advanceSalary: number;
  tax: number;
  others: number;
}

interface IAllowances {
  medical: number;
  transport: number;
  others: number;
}

export interface IPayroll extends Document {
  employeeId: string;
  employeeName: string;
  month: string; // e.g. "December"
  year: number; // e.g. 2025
  position?: string; // Employee position
  presentDays: number;
  approvedLeaves: number;
  basicSalary: number;
  allowances: IAllowances;
  deductions: IDeductions;
  grossSalary: number;
  netPay: number;
  payrollStatus: "Pending" | "Processed" | "Approved";
  approvedBy?: Types.ObjectId;
  isLocked: boolean;
  processedAt: Date;
  salarySlipUrl?: string;
}

const PayrollSchema = new Schema<IPayroll>(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true, index: true },
    position: { type: String, default: "" },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    presentDays: { type: Number, default: 0, min: 0 },
    approvedLeaves: { type: Number, default: 0, min: 0 },
    basicSalary: { type: Number, required: true, min: 0 },
    allowances: {
      medical: { type: Number, default: 0, min: 0 },
      transport: { type: Number, default: 0, min: 0 },
      others: { type: Number, default: 0, min: 0 },
    },
    deductions: {
      pf: { type: Number, default: 0, min: 0 },
      loan: { type: Number, default: 0, min: 0 },
      advanceSalary: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      others: { type: Number, default: 0, min: 0 },
    },
    grossSalary: { type: Number, required: true, min: 0 }, // basic + allowances
    netPay: { type: Number, required: true, min: 0 }, // gross - deductions
    payrollStatus: {
      type: String,
      enum: ["Pending", "Processed", "Approved"],
      default: "Pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isLocked: { type: Boolean, default: false },
    processedAt: { type: Date, default: Date.now },
    salarySlipUrl: { type: String },
  },
  { timestamps: true }
);

// Unique constraint per employee per month/year
PayrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model<IPayroll>("Payroll", PayrollSchema);
export default Payroll;
