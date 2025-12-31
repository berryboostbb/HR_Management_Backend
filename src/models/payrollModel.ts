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
  month: string;
  year: number;
  position?: string;
  presentDays: number;
  approvedLeaves: number;
  totalWorkingDays: number;
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
    employeeId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    employeeName: { type: String, required: true, index: true },
    position: { type: String, default: "" },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    totalWorkingDays: { type: Number, required: true, min: 0 }, // NEW
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
    grossSalary: { type: Number, required: true, min: 0 },
    netPay: { type: Number, required: true, min: 0 },
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

PayrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model<IPayroll>("Payroll", PayrollSchema);
export default Payroll;
