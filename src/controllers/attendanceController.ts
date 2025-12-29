import { Request, Response } from "express";
import Attendance, { IAttendance } from "../models/attendanceModel";
import Account from "../models/userModel";
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

export const getAttendanceSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // start of yesterday

    const totalEmployees = await Account.countDocuments();
    const totalNewUsers = await Account.countDocuments({
      createdAt: { $gte: today },
    });

    // Function to get attendance counts for a given date
    const getAttendanceCounts = async (date) => {
      const summary = await Attendance.aggregate([
        { $match: { date } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const counts = {
        Present: 0,
        Absent: 0,
        Leave: 0,
        Late: 0,
      };

      summary.forEach((item) => {
        counts[item._id] = item.count;
      });

      return counts;
    };

    const todayCounts = await getAttendanceCounts(today);
    const yesterdayCounts = await getAttendanceCounts(yesterday);

    // Helper to calculate percentage change
    const calcPercentageChange = (todayValue, yesterdayValue) => {
      if (yesterdayValue === 0) return todayValue === 0 ? 0 : 100;
      return ((todayValue - yesterdayValue) / yesterdayValue) * 100;
    };

    const response = {
      totalEmployees,
      totalNewUsers,
      present: todayCounts.Present,
      presentChange: calcPercentageChange(
        todayCounts.Present,
        yesterdayCounts.Present
      ),
      absent: todayCounts.Absent,
      absentChange: calcPercentageChange(
        todayCounts.Absent,
        yesterdayCounts.Absent
      ),
      leave: todayCounts.Leave,
      leaveChange: calcPercentageChange(
        todayCounts.Leave,
        yesterdayCounts.Leave
      ),
      late: todayCounts.Late,
      lateChange: calcPercentageChange(todayCounts.Late, yesterdayCounts.Late),
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary",
      error: error.message,
    });
  }
};
