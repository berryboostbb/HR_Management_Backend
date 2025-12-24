import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  employeeId: string;
  employeeRole: string; // "Office" | "Field"
  checkIn?: {
    time: Date;
    location: { lat: number; lng: number };
  };
  checkOut?: {
    time: Date;
    location: { lat: number; lng: number };
  };
  date: Date; // attendance date
  status: "Present" | "Late" | "Absent" | "Half-day" | "On Leave";
  locked?: boolean; // after payroll
  reason?: string; // for manual edits
}

const AttendanceSchema: Schema<IAttendance> = new Schema(
  {
    employeeId: { type: String, required: true },
    employeeRole: { type: String, required: true },
    checkIn: {
      time: { type: Date },
      location: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    checkOut: {
      time: { type: Date },
      location: {
        lat: { type: Number },
        lng: { type: Number },
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
