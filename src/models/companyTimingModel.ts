import mongoose from "mongoose";

const companyTimingSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "18:00"
    lateAfterMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CompanyTiming = mongoose.model("CompanyTiming", companyTimingSchema);
export default CompanyTiming;
