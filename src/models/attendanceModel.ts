import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  employeeId: string;
  employeeName: string;
  employeeRole: {
    type: String;
    required: true;
    enum: ["Admin", "Office Staff", "Field Staff", "HR"];
  };
  checkIn?: {
    time: Date;
    location: { lat: number; lng: number; address: string };
  };
  checkOut?: {
    time: Date;
    location: { lat: number; lng: number; address: string };
  };
  date: Date;
  status: "Present" | "Late" | "Absent" | "Half-day" | "On Leave";
  locked?: boolean; // after payroll
  reason?: string; // for manual edits
}

const AttendanceSchema: Schema<IAttendance> = new Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    employeeRole: { type: String, required: true },
    checkIn: {
      time: { type: Date },
      location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String },
      },
    },
    checkOut: {
      time: { type: Date },
      location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String },
      },
    },
    date: { type: Date, required: true },
    status: { type: String, required: true },
    locked: { type: Boolean, default: false },
    reason: { type: String },
  },
  { timestamps: true }
);

const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
export default Attendance;
