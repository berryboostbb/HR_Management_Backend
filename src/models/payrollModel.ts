import mongoose, { Schema, Document, Types } from "mongoose";

interface IDeductions {
  pf: number;
  loan: number;
  advanceSalary: number;
  tax: number;
  custom: number;
}

interface IAllowances {
  medical: number;
  transport: number;
  others: number;
}

export interface IPayroll extends Document {
  employeeId: Types.ObjectId; // ✅ fixed
  month: string; // e.g. "December"
  year: number; // e.g. 2025
  basicSalary: number;
  allowances: IAllowances;
  deductions: IDeductions;
  totalSalary: number;
  approvedBy?: Types.ObjectId; // optional approver
  isLocked: boolean;
  processedAt: Date;
  salarySlipUrl?: string; // ✅ missing field added
}

const PayrollSchema = new Schema<IPayroll>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    month: {
      type: String,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    allowances: {
      medical: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      others: { type: Number, default: 0 },
    },

    deductions: {
      pf: { type: Number, default: 0 },
      loan: { type: Number, default: 0 },
      advanceSalary: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      custom: { type: Number, default: 0 },
    },

    totalSalary: {
      type: Number,
      required: true,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    processedAt: {
      type: Date,
      default: Date.now,
    },

    salarySlipUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

/**
 * ✅ Prevent duplicate payroll
 * One employee → one payroll → per month/year
 */
PayrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model<IPayroll>("Payroll", PayrollSchema);
export default Payroll;
