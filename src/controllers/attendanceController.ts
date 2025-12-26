import { Request, Response } from "express";
import Attendance, { IAttendance } from "../models/attendanceModel";

// Check-In
export const checkIn = async (req: Request, res: Response) => {
  try {
    const { employeeId, employeeName, employeeRole, location } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (existing?.checkIn)
      return res.status(400).json({ message: "Already checked in today" });

    const attendance =
      existing ||
      new Attendance({
        employeeId,
        employeeName, // ✅ fixed
        employeeRole,
        date: today,
        status: "Present",
      });

    attendance.checkIn = { time: new Date(), location };
    await attendance.save();

    res.json({ message: "Checked in successfully", attendance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Check-Out
export const checkOut = async (req: Request, res: Response) => {
  try {
    const { employeeId, location } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ employeeId, date: today });
    if (!attendance || !attendance.checkIn)
      return res.status(400).json({ message: "Check-in required first" });

    if (attendance.checkOut)
      return res.status(400).json({ message: "Already checked out today" });

    attendance.checkOut = { time: new Date(), location };
    await attendance.save();

    res.json({ message: "Checked out successfully", attendance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all attendance logs (HR/Admin)
export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { employeeId: { $regex: search, $options: "i" } },
        { employeeName: { $regex: search, $options: "i" } },
      ];
    }

    const logs = await Attendance.find(query).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const editAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body; // e.g., status, checkIn, checkOut, reason

    const attendance = await Attendance.findById(id);
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });
    if (attendance.locked)
      return res.status(400).json({ message: "Cannot edit locked attendance" });

    Object.assign(attendance, updates);
    await attendance.save();

    res.json({ message: "Attendance updated successfully", attendance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
