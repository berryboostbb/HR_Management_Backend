import mongoose, { Schema, Document } from "mongoose";

// Define the interface for Attendance
export interface IAttendance extends Document {
  employee: {
    _id: string;
    employeeId: string;
    employeeName: string;
    employeeRole: string;
    employeeType: string;
  };
  checkIn?: {
    time: Date;
    location: { lat: number; lng: number };
  };
  checkOut?: {
    time: Date;
    location: { lat: number; lng: number };
  };
  break?: {
    startTime: Date;
    endTime?: Date;
  };
  date: Date;
  status: "Present" | "Late" | "Absent" | "Half-day" | "On Leave";
  locked?: boolean;
  reason?: string;
  checkInStatus?: "Pending" | "CheckedIn" | "OnBreak" | "CheckedOut"; // Add this field
}

// Define the schema
const AttendanceSchema: Schema<IAttendance> = new Schema(
  {
    employee: {
      _id: { type: String, required: true },
      employeeId: { type: String, required: true },
      employeeName: { type: String, required: true },
      employeeRole: {
        type: String,
        required: true,
      },
      employeeType: {
        type: String,
        required: true,
      },
    },
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
    break: {
      startTime: { type: Date },
      endTime: { type: Date },
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ["Present", "Late", "Absent", "Half-day", "On Leave"],
    },
    locked: { type: Boolean, default: false },
    reason: { type: String },
    checkInStatus: {
      type: String,
      enum: ["Pending", "CheckedIn", "OnBreak", "CheckedOut"],
      default: "Pending", // Default to "Pending" when not checked in
    },
  },
  { timestamps: true }
);

// Create the model
const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
export default Attendance;
