import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

// Incentive & SalaryStructure interface
interface IIncentive {
  flue: number;
  medical: number;
  others: number;
}

interface ISalaryStructure {
  basic: number;
  incentive: IIncentive;
  gross: number;
  tax?: number;
  deductions: number;
}
interface ILoanPF {
  loan: number;
  pf: number;
}

export interface IAdmin extends Document {
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  employeeRole: string;
  phoneNumber: string;
  joiningDate: Date;
  salaryStructure: ISalaryStructure;
  loanPF: ILoanPF;
  DOB: Date;
  image: string;
  employeeStatus: string;
  leaveEntitlements: string[];
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const generateEmployeeId = (): string =>
  `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`;

const AdminSchema: Schema<IAdmin> = new Schema(
  {
    employeeId: { type: String, default: generateEmployeeId, unique: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    designation: { type: String, required: true },
    employeeRole: {
      type: String,
      required: true,
      enum: ["Admin", "Office Staff", "Field Staff", "HR"],
    },
    department: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    salaryStructure: {
      basic: { type: Number, required: true },
      incentive: {
        flue: { type: Number, required: true, default: 0 },
        medical: { type: Number, required: true, default: 0 },
        others: { type: Number, required: true, default: 0 },
        deductions: { type: Number, required: true, default: 0 },
      },
      gross: { type: Number },
      tax: { type: Number, required: false, default: 0 },
    },
    loanPF: {
      loan: { type: Number, required: true, default: 0 },
      pf: { type: Number, required: true, default: 0 },
    },
    DOB: { type: Date, required: true },
    employeeStatus: { type: String, required: true },
    leaveEntitlements: [{ type: String, required: true }],
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

AdminSchema.pre<IAdmin>("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  const s = this.salaryStructure;
  const loan = this.loanPF?.loan || 0;
  const pf = this.loanPF?.pf || 0;
  const tax = s.tax || 0;
  const deductions = s.deductions || 0;

  s.gross =
    s.basic +
    s.incentive.flue +
    s.incentive.medical +
    s.incentive.others -
    deductions -
    loan -
    pf -
    tax;
});

AdminSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);
export default Admin;
