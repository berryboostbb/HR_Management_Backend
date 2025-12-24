import mongoose, { Schema, Document } from "mongoose";

export interface ILeave extends Document {
  employeeId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
  appliedAt: Date;
}

const LeaveSchema: Schema<ILeave> = new Schema(
  {
    employeeId: { type: String, required: true },
    leaveType: {
      type: String,
      required: true,
      enum: [
        "Casual Leave",
        "Sick Leave",
        "Earned Leave",
        "Maternity Leave",
        "Unpaid Leave",
        "Annual Leave",
        "Paternity Leave",
        "Compensatory Leave",
      ], // add custom types dynamically if needed
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: { type: String },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Leave = mongoose.model<ILeave>("Leave", LeaveSchema);
export default Leave;
