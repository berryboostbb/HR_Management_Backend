import { Request, Response } from "express";
import Attendance, { IAttendance } from "../models/attendanceModel";
import Account from "../models/userModel";
import JWTService from "../services/JWTServices";
import User from "../models/userModel";

// Check-In
export const checkIn = async (req: Request, res: Response) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"

    if (!token) {
      return res
        .status(400)
        .json({ message: "Authorization token is missing" });
    }

    // Verify and decode the token to get user details
    const decodedToken = JWTService.verifyAccessToken(token);

    // Extract user details from the decoded token
    const userId = decodedToken._id; // Get the user ID from the token

    // Get the user from the database using the userId
    const user = await User.findById(userId); // Assuming User model has a findById method

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get today's date (ignore time)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the time to 00:00:00 for comparison

    // Check if attendance already exists for today
    const existingAttendance = await Attendance.findOne({
      "employee.employeeId": user.employeeId, // Assuming employeeId exists in the Attendance model
      date: today,
    });

    // If attendance already exists and the user has checked in, return a response
    if (existingAttendance?.checkIn) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    // Create a new attendance record or use the existing one
    const attendance =
      existingAttendance ||
      new Attendance({
        employee: {
          employeeId: user.employeeId,
          employeeName: user.name, // Assuming 'name' field is present in User model
          employeeRole: user.role, // Assuming 'role' field is present in User model
        },
        date: today,
        status: "Present", // Default status
      });

    // Get location data from the request body
    const { location } = req.body;

    // Log check-in time and location
    attendance.checkIn = {
      time: new Date(),
      location,
    };

    // Save the attendance record
    await attendance.save();

    res.json({ message: "Checked in successfully", attendance });
  } catch (error) {
    console.error("Error in checkIn:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Check-Out
export const checkOut = async (req: Request, res: Response) => {
  try {
    const { employeeId, location } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      "employee.employeeId": employeeId,
      date: today,
    });
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

// Start Break
export const startBreak = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body; // Get the logged-in user's employeeId
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      "employee.employeeId": employeeId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Check-in required first" });
    }

    // Check if break is already started
    if (attendance.break && attendance.break.startTime) {
      return res.status(400).json({ message: "Break already started" });
    }

    attendance.break = { startTime: new Date() };
    await attendance.save();

    res.json({ message: "Break started", attendance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// End Break
export const endBreak = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body; // Get the logged-in user's employeeId
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      "employee.employeeId": employeeId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Check-in required first" });
    }

    // Check if break was started
    if (!attendance.break || !attendance.break.startTime) {
      return res.status(400).json({ message: "Break not started yet" });
    }

    // End break time
    attendance.break.endTime = new Date();
    await attendance.save();

    res.json({ message: "Break ended", attendance });
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
        { "employee.employeeId": { $regex: search, $options: "i" } },
        { "employee.employeeName": { $regex: search, $options: "i" } },
      ];
    }

    const logs = await Attendance.find(query).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Edit Attendance (HR/Admin)
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

// Get attendance summary (HR/Admin)
export const getAttendanceSummary = async (req: Request, res: Response) => {
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

// Get Logged-in User's Attendance Status
export const getUserAttendanceStatus = async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header (e.g., "Bearer <your-jwt-token>")
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(400)
        .json({ message: "Authorization token is missing" });
    }

    // Verify and decode the token
    const decodedToken = JWTService.verifyAccessToken(token);
    const employeeId = decodedToken._id; // Assuming _id is stored in the token payload

    if (!employeeId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    // Get today's date (ignore time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch the user's attendance record for today
    const attendance = await Attendance.findOne({
      "employee.employeeId": employeeId,
      date: today,
    });

    if (!attendance) {
      return res
        .status(404)
        .json({ message: "No attendance record found for today" });
    }

    // Determine the attendance status and break status
    const status = attendance.status;
    const checkInTime = attendance.checkIn ? attendance.checkIn.time : null;
    const checkOutTime = attendance.checkOut ? attendance.checkOut.time : null;
    const breakStatus = attendance.break
      ? {
          startTime: attendance.break.startTime,
          endTime: attendance.break.endTime,
        }
      : null;

    // Prepare the response data
    const response = {
      status, // Present, Late, Absent, etc.
      checkInTime,
      checkOutTime,
      breakStatus,
      message: "Attendance data fetched successfully",
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
