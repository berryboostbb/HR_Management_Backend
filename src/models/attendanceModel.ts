import mongoose, { Schema, Document } from "mongoose";

// Define the interface for Attendance
export interface IAttendance extends Document {
  employee: {
    employeeId: string;
    employeeName: string;
    employeeRole: "Admin" | "Office Staff" | "Field Staff" | "HR";
  };
  checkIn?: {
    time: Date;
    location: { lat: number; lng: number; address: string };
  };
  checkOut?: {
    time: Date;
    location: { lat: number; lng: number; address: string };
  };
  break?: {
    startTime: Date;
    endTime?: Date;
  };
  date: Date;
  status: "Present" | "Late" | "Absent" | "Half-day" | "On Leave";
  locked?: boolean;
  reason?: string;
}

// Define the schema
const AttendanceSchema: Schema<IAttendance> = new Schema(
  {
    employee: {
      employeeId: { type: String, required: true },
      employeeName: { type: String, required: true },
      employeeRole: {
        type: String,
        required: true,
        enum: ["Admin", "Office Staff", "Field Staff", "HR"],
      },
    },
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
  },
  { timestamps: true } // This will automatically add createdAt and updatedAt timestamps
);

// Create the model
const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
export default Attendance;
