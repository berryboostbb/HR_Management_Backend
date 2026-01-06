import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

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

interface ILeaveType {
  total: number;
  consumed: number;
}

interface ILeaveEntitlements {
  casualLeave: ILeaveType;
  sickLeave: ILeaveType;
  annualLeave: ILeaveType;
  maternityLeave: ILeaveType;
  paternityLeave: ILeaveType;
}

export interface IUser extends Document {
  employeeId: string;
  name: string;
  role: string;
  gender: string;
  department: string;
  employeeType: string;
  phoneNumber: string;
  joiningDate: Date;
  salaryStructure: ISalaryStructure;
  loanPF: ILoanPF;
  DOB: Date;
  image: string;
  fcmToken?: string; // ✅ single string
  employeeStatus: string;
  leaveEntitlements: ILeaveEntitlements;
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const generateEmployeeId = (): string =>
  `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`;

const UserSchema: Schema<IUser> = new Schema(
  {
    employeeId: { type: String, default: generateEmployeeId, unique: true },
    gender: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, required: true },
    employeeType: { type: String, required: true },
    department: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    salaryStructure: {
      basic: { type: Number, required: true },
      incentive: {
        flue: { type: Number, required: true, default: 0 },
        medical: { type: Number, required: true, default: 0 },
        others: { type: Number, required: true, default: 0 },
      },
      gross: { type: Number },
      tax: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
    },
    loanPF: {
      loan: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
    },
    DOB: { type: Date, required: true },
    employeeStatus: { type: String, required: true },
    fcmToken: { type: String }, // ✅ single string
    leaveEntitlements: {
      casualLeave: { type: { total: Number, consumed: Number }, default: {} },
      sickLeave: { type: { total: Number, consumed: Number }, default: {} },
      annualLeave: { type: { total: Number, consumed: Number }, default: {} },
      maternityLeave: {
        type: { total: Number, consumed: Number },
        default: {},
      },
      paternityLeave: {
        type: { total: Number, consumed: Number },
        default: {},
      },
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>("save", async function () {
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

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
