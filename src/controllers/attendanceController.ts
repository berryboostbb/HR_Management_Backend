import { Request, Response } from "express";
import Attendance, { IAttendance } from "../models/attendanceModel";
import Account from "../models/userModel";
import JWTService from "../services/JWTServices";
import User from "../models/userModel";
import moment from "moment-timezone";
import Leave from "../models/leavesModel";
import companyTimingModel from "../models/companyTimingModel";
import CompanyTiming from "../models/companyTimingModel";
import { sendNotification } from "../utils/notifications";

const isLateCheckIn = (checkInDate: Date, startTime: string) => {
  const [hours, minutes] = startTime.split(":").map(Number);

  const companyStart = new Date(checkInDate);
  companyStart.setHours(hours, minutes, 0, 0);

  return checkInDate > companyStart;
};
// Function to create daily attendance records with status "Absent"
export const createDailyAttendance = async (req: Request, res: Response) => {
  try {
    const employees = await User.find(); // Get all employees

    // Get today's date in UTC - Start of the day
    const todayInUTC = moment.utc().startOf("day");
    console.log(
      "🚀 ~ createDailyAttendance ~ todayInUTC:",
      todayInUTC.format()
    );

    const notifiedUsers: string[] = [];
    const skippedUsers: string[] = [];

    for (const employee of employees) {
      // 1️⃣ Check if employee has leave today
      const onLeave = await Leave.findOne({
        employeeId: employee.employeeId,
        status: "Approved", // Only consider approved leaves
        startDate: { $lte: todayInUTC.toDate() },
        endDate: { $gte: todayInUTC.toDate() },
      });

      if (onLeave) {
        console.log(
          `Skipping attendance for ${employee.name}, on leave today.`
        );
        continue; // Skip to next employee
      }

      // 2️⃣ Check if attendance already exists
      const existingAttendance = await Attendance.findOne({
        "employee.employeeId": employee.employeeId,
        date: todayInUTC.toDate(),
      });

      if (!existingAttendance) {
        // 3️⃣ Create attendance as "Absent"
        const newAttendance = new Attendance({
          employee: {
            _id: employee._id,
            employeeId: employee.employeeId,
            employeeName: employee.name,
            employeeRole: employee.role,
            employeeType: employee.employeeType,
          },
          date: todayInUTC.toDate(),
          status: "Absent",
          checkInStatus: "Pending",
        });

        await newAttendance.save();
        console.log(`Attendance created for ${employee.name}`);
      }

      // 4️⃣ Send notification to all employees (if they have FCM token)
      if (employee.fcmToken) {
        try {
          await sendNotification(
            employee.fcmToken,
            "Attendance Reminder ⏰",
            "Please check in your time for today."
          );
          notifiedUsers.push(employee.name || employee.employeeId);
        } catch (notifError) {
          console.error(
            `❌ Failed to send notification to ${
              employee.name || employee.employeeId
            }:`,
            notifError
          );
          skippedUsers.push(employee.name || employee.employeeId);
        }
      } else {
        skippedUsers.push(employee.name || employee.employeeId);
      }
    }

    console.log(`✅ Notifications sent to: ${notifiedUsers.join(", ")}`);
    if (skippedUsers.length > 0) {
      console.log(`⚠️ No FCM token for: ${skippedUsers.join(", ")}`);
    }

    res.json({
      message: "Attendance records successfully created for today.",
      notifiedUsers,
      skippedUsers,
    });
  } catch (error) {
    console.error("Error creating daily attendance records:", error);
    res
      .status(500)
      .json({ message: "Error creating attendance records", error });
  }
};

// export const checkIn = async (req: Request, res: Response) => {
//   try {
//     // Extract the token from the Authorization header
//     const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"

//     if (!token) {
//       return res
//         .status(400)
//         .json({ message: "Authorization token is missing" });
//     }

//     // Verify and decode the token to get user details
//     const decodedToken = JWTService.verifyAccessToken(token);

//     // Extract user details from the decoded token
//     const loggedInUserId = decodedToken._id; // Get the logged-in user ID from the token

//     // Get the user from the database using the logged-in userId
//     const loggedInUser = await User.findById(loggedInUserId); // Assuming User model has a findById method

//     if (!loggedInUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Check if the logged-in user is an admin
//     const isAdmin = loggedInUser.role === "admin"; // Assuming 'role' field determines user type

//     // Determine the employeeId: if logged-in user is admin, use the employeeId from the request body, otherwise use the logged-in user ID
//     const employeeId = isAdmin ? req.body.employeeId : loggedInUser.employeeId;

//     // Get today's date (ignore time)
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Set the time to 00:00:00 for comparison

//     // Check if attendance already exists for today
//     let attendance = await Attendance.findOne({
//       "employee.employeeId": employeeId,
//       date: today,
//     });
//     console.log("🚀 ~ checkIn ~ attendance:", attendance);

//     // If attendance already exists and the user has checked in, return a response
//     if (attendance?.checkInStatus === "CheckedIn") {
//       return res.status(400).json({ message: "Already checked in today" });
//     }

//     // If attendance doesn't exist, create a new one
//     if (!attendance) {
//       attendance = new Attendance({
//         employee: {
//           _id: loggedInUser._id,
//           employeeId: loggedInUser.employeeId,
//           employeeName: loggedInUser.name, // Assuming 'name' field is present in User model
//           employeeRole: loggedInUser.role, // Assuming 'role' field is present in User model
//           employeeType: loggedInUser.employeeType, // Assuming 'employeeType' field is present in User model
//         },
//         date: today,
//         status: "Absent", // Default status
//         checkInStatus: "CheckedOut", // Default to "CheckedOut" since they haven't checked in yet
//       });
//     }

//     // If the attendance exists and hasn't been checked in, we update it
//     attendance.checkInStatus = "CheckedIn"; // Set checkInStatus to "CheckedIn" when employee checks in
//     attendance.status = "Present"; // Update status to "Present" once they check in

//     // Get location data from the request body
//     const { location } = req.body;

//     // Log check-in time and location
//     attendance.checkIn = {
//       time: new Date(),
//       location,
//     };

//     // Save the attendance record (whether it's updated or newly created)
//     await attendance.save();

//     // Return success message
//     res.json({
//       message: `Checked in successfully ${
//         isAdmin ? `for employee ${employeeId}` : ""
//       }`,
//       attendance,
//     });
//   } catch (error) {
//     console.error("Error in checkIn:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// Check-Out

export const checkIn = async (req: Request, res: Response) => {
  try {
    /* -------------------------------- Token -------------------------------- */
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ message: "Authorization token is missing" });

    const decodedToken = JWTService.verifyAccessToken(token);
    const loggedInUserId = decodedToken._id;

    /* ----------------------------- Logged-in User ---------------------------- */
    const loggedInUser = await User.findById(loggedInUserId);
    if (!loggedInUser)
      return res.status(404).json({ message: "User not found" });

    const isAdmin = loggedInUser.role === "admin";

    /* ----------------------------- Employee ID ------------------------------- */
    const employeeId = isAdmin ? req.body.employeeId : loggedInUser.employeeId;
    if (!employeeId)
      return res.status(400).json({ message: "Employee ID is required" });

    /* ------------------------------- Company Timing -------------------------- */
    const companyTiming = await CompanyTiming.findOne();
    if (!companyTiming || !companyTiming.startTime)
      return res
        .status(400)
        .json({ message: "Company start time not configured" });

    const lateAfterMinutes = companyTiming.lateAfterMinutes || 0; // grace period

    /* -------------------------------- Date ---------------------------------- */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* ------------------------------- Attendance ------------------------------ */
    let attendance = await Attendance.findOne({
      "employee.employeeId": employeeId,
      date: today,
    });

    if (attendance?.checkInStatus === "CheckedIn") {
      return res.status(400).json({ message: "Already checked in today" });
    }

    /* ----------------------------- Create if not exists ---------------------- */
    if (!attendance) {
      attendance = new Attendance({
        employee: {
          _id: loggedInUser._id,
          employeeId: loggedInUser.employeeId,
          employeeName: loggedInUser.name,
          employeeRole: loggedInUser.role,
          employeeType: loggedInUser.employeeType,
        },
        date: today,
        status: "Absent",
        checkInStatus: "CheckedOut",
      });
    }

    /* ------------------------------- Check-in Logic -------------------------- */
    const checkInTime = new Date();
    const { location } = req.body;

    // Convert company start time to Date object
    const [hours, minutes] = companyTiming.startTime.split(":").map(Number);
    const companyStartDate = new Date(today);
    companyStartDate.setHours(hours, minutes, 0, 0);

    // Add lateAfterMinutes to company start time
    const lateThreshold = new Date(
      companyStartDate.getTime() + lateAfterMinutes * 60000
    );

    // Determine Late or Present
    const isLate = checkInTime > lateThreshold;

    attendance.checkInStatus = "CheckedIn";
    attendance.status = isLate ? "Late" : "Present";

    attendance.checkIn = {
      time: checkInTime,
      location,
    };

    await attendance.save();

    /* -------------------------------- Response ------------------------------- */
    return res.status(200).json({
      message: isLate
        ? "Checked in successfully (Late)"
        : "Checked in successfully",
      attendance,
    });
  } catch (error) {
    console.error("Check-in Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

export const checkOut = async (req: Request, res: Response) => {
  try {
    const { employeeId, location } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the time to 00:00:00 for today

    // Find the attendance record for today
    const attendance = await Attendance.findOne({
      "employee.employeeId": employeeId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Check-in required first" });
    }

    // Ensure the user is checked in and not already checked out
    if (attendance.checkInStatus === "CheckedOut") {
      return res.status(400).json({ message: "Already checked out today" });
    }

    // Ensure the user is not on break
    if (attendance.checkInStatus === "OnBreak") {
      return res
        .status(400)
        .json({ message: "Cannot check out while on break" });
    }

    // Log the check-out time and location
    attendance.checkOut = { time: new Date(), location };

    // Update the check-in status to "CheckedOut"
    attendance.checkInStatus = "CheckedOut";

    // Save the updated attendance record
    await attendance.save();

    res.json({ message: "Checked out successfully", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Start Break
export const startBreak = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body; // Get the logged-in user's employeeId
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Get today's date (ignoring time)

    // Find the attendance record for today
    const attendance = await Attendance.findOne({
      "employee.employeeId": employeeId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Check-in required first" });
    }

    // Ensure the user is currently checked in (not on break or checked out)
    if (attendance.checkInStatus === "OnBreak") {
      return res.status(400).json({ message: "Already on break" });
    }

    if (attendance.checkInStatus === "CheckedOut") {
      return res
        .status(400)
        .json({ message: "Cannot start a break after checking out" });
    }

    // Check if break is already started
    if (attendance.break && attendance.break.startTime) {
      return res.status(400).json({ message: "Break already started" });
    }

    // Start the break
    attendance.break = { startTime: new Date() };
    attendance.checkInStatus = "OnBreak"; // Set checkInStatus to OnBreak
    await attendance.save();

    res.json({ message: "Break started", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// End Break

export const endBreak = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body; // Get the logged-in user's employeeId
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Get today's date (ignoring time)

    // Find the attendance record for today
    const attendance = await Attendance.findOne({
      "employee.employeeId": employeeId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Check-in required first" });
    }

    // Ensure the user is currently on break before ending the break
    if (attendance.checkInStatus !== "OnBreak") {
      return res
        .status(400)
        .json({ message: "You are not currently on break" });
    }

    // Check if break was started
    if (!attendance.break || !attendance.break.startTime) {
      return res.status(400).json({ message: "Break not started yet" });
    }

    // End the break by setting the end time
    attendance.break.endTime = new Date();
    attendance.checkInStatus = "CheckedIn"; // Set checkInStatus back to CheckedIn
    await attendance.save();

    res.json({ message: "Break ended", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all attendance logs (HR/Admin)
export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { search, month, year } = req.query;

    const query: any = {};

    // Search filter
    if (search) {
      query.$or = [
        { "employee.employeeId": { $regex: search, $options: "i" } },
        { "employee.employeeName": { $regex: search, $options: "i" } },
      ];
    }

    // Month and Year filter
    if (month && year) {
      // Month in JS is 0-indexed
      const startDate = moment
        .utc(`${year}-${month}-01`)
        .startOf("day")
        .toDate();
      const endDate = moment.utc(startDate).endOf("month").toDate();

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
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

// Get attendance summary (HR/Admin)
export const getAttendanceSummary = async (req: Request, res: Response) => {
  try {
    // ─── TODAY RANGE ─────────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ─── YESTERDAY RANGE ─────────────────────────────────────
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(todayEnd.getDate() - 1);

    // ─── USER STATS ──────────────────────────────────────────
    const totalEmployees = await Account.countDocuments();
    const totalNewUsers = await Account.countDocuments({
      createdAt: { $gte: todayStart },
    });

    // ─── ATTENDANCE COUNTER (FIXED) ──────────────────────────
    const getAttendanceCounts = async (
      start: Date,
      end: Date
    ): Promise<Record<string, number>> => {
      const summary = await Attendance.aggregate([
        {
          $match: {
            date: {
              $gte: start,
              $lte: end,
            },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const counts: Record<string, number> = {
        Present: 0,
        Absent: 0,
        Late: 0,
        "On Leave": 0,
      };

      summary.forEach((item) => {
        counts[item._id] = item.count;
      });

      return counts;
    };

    const todayCounts = await getAttendanceCounts(todayStart, todayEnd);
    const yesterdayCounts = await getAttendanceCounts(
      yesterdayStart,
      yesterdayEnd
    );

    // ─── PERCENTAGE CALC ─────────────────────────────────────
    const calcChange = (today: number, yesterday: number) => {
      if (yesterday === 0) return today === 0 ? 0 : 100;
      return Math.round(((today - yesterday) / yesterday) * 100);
    };

    // ─── RESPONSE ────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        totalNewUsers,

        present: todayCounts.Present,
        presentChange: calcChange(todayCounts.Present, yesterdayCounts.Present),

        absent: todayCounts.Absent,
        absentChange: calcChange(todayCounts.Absent, yesterdayCounts.Absent),

        late: todayCounts.Late,
        lateChange: calcChange(todayCounts.Late, yesterdayCounts.Late),

        leave: todayCounts["On Leave"],
        leaveChange: calcChange(
          todayCounts["On Leave"],
          yesterdayCounts["On Leave"]
        ),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
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

    // Get today's date in UTC - Start of the day (midnight)
    const todayStart = moment.utc().startOf("day").toDate(); // Set to 00:00:00 of today in UTC

    // Get tomorrow's date in UTC - Start of the next day
    const tomorrowStart = moment.utc().add(1, "day").startOf("day").toDate(); // Set to next day's midnight in UTC

    console.log("🚀 ~ getUserAttendanceStatus ~ todayStart:", todayStart);
    console.log("🚀 ~ getUserAttendanceStatus ~ tomorrowStart:", tomorrowStart);

    // Fetch the user's attendance record for today (in UTC)
    const attendance = await Attendance.findOne({
      "employee._id": employeeId,
      date: { $gte: todayStart, $lt: tomorrowStart }, // Use $gte and $lt to match today's date range
    });

    if (!attendance) {
      return res
        .status(404)
        .json({ message: "No attendance record found for today" });
    }

    // Extract attendance details
    const {
      status,
      checkInStatus,
      checkIn,
      checkOut,
      break: breakDetails,
    } = attendance;

    // Determine check-in and check-out times, if available
    const checkInTime = checkIn ? checkIn.time : null;
    const checkOutTime = checkOut ? checkOut.time : null;

    // Break details (if available)
    const breakStatus = breakDetails
      ? {
          startTime: breakDetails.startTime,
          endTime: breakDetails.endTime,
        }
      : null;

    // Prepare the response data
    const response = {
      status, // "Present", "Late", "Absent", etc.
      checkInStatus, // "CheckedIn", "OnBreak", "CheckedOut"
      checkInTime,
      checkOutTime,
      breakStatus,
      message: "Attendance data fetched successfully",
    };

    // Return the response
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// export const updateAttendanceAdmin = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const attendance = await Attendance.findById(id);
//     if (!attendance)
//       return res.status(404).json({ message: "Attendance not found" });

//     if (attendance.locked)
//       return res
//         .status(400)
//         .json({ message: "This attendance is locked and cannot be edited" });

//     const DEFAULT_LOCATION = {
//       lat: 31.441949367930203,
//       lng: 74.26074501840554,
//       address: "BerryBoost – IT Company in Lahore",
//     };

//     let updated = false;

//     const checkInTime = req.body.checkInTime || req.body?.checkIn?.time;
//     const checkOutTime = req.body.checkOutTime || req.body?.checkOut?.time;

//     // ================= CHECK-IN =================
//     if (checkInTime) {
//       const date = new Date(checkInTime);
//       if (isNaN(date.getTime()))
//         return res.status(400).json({ message: "Invalid checkIn time" });

//       attendance.set("checkIn", {
//         time: date,
//         location: DEFAULT_LOCATION,
//       });

//       // If only check-in is updated and check-out is NOT provided
//       if (!checkOutTime) {
//         attendance.checkInStatus = "CheckedIn";
//       }

//       attendance.status = "Present";
//       updated = true;
//     }

//     // ================= CHECK-OUT =================
//     if (checkOutTime) {
//       const date = new Date(checkOutTime);
//       if (isNaN(date.getTime()))
//         return res.status(400).json({ message: "Invalid checkOut time" });

//       attendance.set("checkOut", {
//         time: date,
//         location: DEFAULT_LOCATION,
//       });

//       // If only check-out is updated but check-in already exists
//       if (checkInTime || attendance.checkIn) {
//         attendance.checkInStatus = "CheckedOut"; // final state
//       } else {
//         // optional: prevent checkout without check-in
//         return res
//           .status(400)
//           .json({ message: "Cannot check out without check-in" });
//       }

//       updated = true;
//     }

//     if (!updated)
//       return res.status(400).json({ message: "No valid fields to update" });

//     await attendance.save();

//     res.status(200).json({
//       success: true,
//       message: "Attendance updated successfully",
//       attendance,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update attendance",
//       error,
//     });
//   }
// };

export const updateAttendanceAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    if (attendance.locked)
      return res
        .status(400)
        .json({ message: "This attendance is locked and cannot be edited" });

    /* ---------- Company Timing ---------- */
    const companyTiming = await CompanyTiming.findOne();
    if (!companyTiming?.startTime) {
      return res
        .status(400)
        .json({ message: "Company start time not configured" });
    }

    const DEFAULT_LOCATION = {
      lat: 31.441949367930203,
      lng: 74.26074501840554,
      address: "BerryBoost – IT Company in Lahore",
    };

    let updated = false;

    const checkInTime = req.body.checkInTime || req.body?.checkIn?.time;
    const checkOutTime = req.body.checkOutTime || req.body?.checkOut?.time;

    /* ================= CHECK-IN ================= */
    if (checkInTime) {
      const checkInMoment = moment
        .tz(checkInTime, "Asia/Karachi")
        .seconds(0)
        .milliseconds(0);

      if (!checkInMoment.isValid())
        return res.status(400).json({ message: "Invalid check-in time" });

      attendance.checkIn = {
        time: checkInMoment.toDate(),
        location: DEFAULT_LOCATION,
      };

      // Company start time (PKT)
      const [hours, minutes] = companyTiming.startTime.split(":").map(Number);

      const companyStartMoment = moment
        .tz("Asia/Karachi")
        .startOf("day")
        .hour(hours)
        .minute(minutes);

      const lateAfterMinutes = companyTiming.lateAfterMinutes || 0;
      const lateThreshold = companyStartMoment
        .clone()
        .add(lateAfterMinutes, "minutes");

      // ✅ Correct Late / Present calculation
      attendance.status = checkInMoment.isAfter(lateThreshold)
        ? "Late"
        : "Present";

      attendance.checkInStatus = "CheckedIn";
      updated = true;
    }

    /* ================= CHECK-OUT ================= */
    if (checkOutTime) {
      const checkOutMoment = moment
        .tz(checkOutTime, "Asia/Karachi")
        .seconds(0)
        .milliseconds(0);

      if (!checkOutMoment.isValid())
        return res.status(400).json({ message: "Invalid check-out time" });

      if (!attendance.checkIn)
        return res
          .status(400)
          .json({ message: "Cannot check out without check-in" });

      attendance.checkOut = {
        time: checkOutMoment.toDate(),
        location: DEFAULT_LOCATION,
      };

      attendance.checkInStatus = "CheckedOut";
      updated = true;
    }

    if (!updated)
      return res.status(400).json({ message: "No valid fields to update" });

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    console.error("Update Attendance Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update attendance",
      error,
    });
  }
};

export const getMonthlyAttendanceGraph = async (
  req: Request,
  res: Response
) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    // 1️⃣ Total employees (constant for all months)
    const totalEmployees = await User.countDocuments();

    // 2️⃣ Aggregate present attendance month-wise
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          status: "Present",
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          presentCount: { $sum: 1 },
        },
      },
    ]);

    // 3️⃣ Month mapping
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // 4️⃣ Format response for chart
    const graphData = monthNames.map((month, index) => {
      const found = attendanceData.find((item) => item._id === index + 1);

      return {
        month,
        Total: totalEmployees,
        Present: found ? found.presentCount : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: graphData,
    });
  } catch (error) {
    console.error("Monthly attendance graph error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance graph",
      error,
    });
  }
};

export const getCompanyTiming = async (req: Request, res: Response) => {
  try {
    const timing = await CompanyTiming.findOne();
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: "No company timing set yet",
      });
    }

    res.json({
      success: true,
      timing,
    });
  } catch (error) {
    console.error("Error fetching company timing:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};

export const setCompanyTiming = async (req: Request, res: Response) => {
  try {
    const { startTime, endTime, lateAfterMinutes = 0 } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time are required",
      });
    }

    // 1️⃣ Find existing timing
    let timing = await CompanyTiming.findOne();

    if (!timing) {
      // Create new timing if none exists
      timing = await CompanyTiming.create({
        startTime,
        endTime,
        lateAfterMinutes,
      });
    } else {
      // Update existing timing
      timing.startTime = startTime;
      timing.endTime = endTime;
      timing.lateAfterMinutes = lateAfterMinutes;
      await timing.save();
    }

    // 2️⃣ Fetch all users
    const users = await User.find({});
    const notifiedUsers: string[] = [];
    const skippedUsers: string[] = [];

    // 3️⃣ Send notification to all users who have fcmToken
    for (const user of users) {
      if (user.fcmToken) {
        try {
          await sendNotification(
            user.fcmToken,
            "Company Timing Updated 🕒",
            `New company timing is from ${startTime} to ${endTime}. Late after ${lateAfterMinutes} minutes.`
          );
          notifiedUsers.push(user.name || user.employeeId || "Unknown");
        } catch (err) {
          console.error(
            `❌ Failed to send notification to ${
              user.name || user.employeeId
            }:`,
            err
          );
          skippedUsers.push(user.name || user.employeeId || "Unknown");
        }
      } else {
        skippedUsers.push(user.name || user.employeeId || "Unknown");
      }
    }

    console.log(`✅ Notifications sent to: ${notifiedUsers.join(", ")}`);
    if (skippedUsers.length > 0) {
      console.log(`⚠️ No FCM token for: ${skippedUsers.join(", ")}`);
    }

    res.json({
      success: true,
      message: "Company timing set successfully and notifications sent",
      timing,
      notifiedUsers,
      skippedUsers,
    });
  } catch (error) {
    console.error("Error setting company timing:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
