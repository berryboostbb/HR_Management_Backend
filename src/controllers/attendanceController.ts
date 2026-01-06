import { Request, Response } from "express";
import Attendance, { IAttendance } from "../models/attendanceModel";
import Account from "../models/userModel";
import JWTService from "../services/JWTServices";
import User from "../models/userModel";
import moment from "moment-timezone";
import Leave from "../models/leavesModel";
import companyTimingModel from "../models/companyTimingModel";
import CompanyTiming from "../models/companyTimingModel";

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
    }

    res.json({ message: "Attendance records successfully created for today." });
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
      const checkInDate = new Date(checkInTime);
      if (isNaN(checkInDate.getTime()))
        return res.status(400).json({ message: "Invalid check-in time" });

      attendance.checkIn = {
        time: checkInDate,
        location: DEFAULT_LOCATION,
      };

      // Convert company start time to Date (assuming it's stored as "HH:mm")
      const today = new Date();
      const [hours, minutes] = companyTiming.startTime.split(":").map(Number);
      const companyStartDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hours,
        minutes
      );

      // Add lateAfterMinutes to company start time
      const lateAfterMinutes = companyTiming.lateAfterMinutes || 0; // default 0 if not set
      const lateThreshold = new Date(
        companyStartDate.getTime() + lateAfterMinutes * 60000
      ); // 60000ms = 1 min

      // Determine Present or Late
      if (checkInDate > lateThreshold) {
        attendance.status = "Late";
      } else {
        attendance.status = "Present";
      }

      attendance.checkInStatus = "CheckedIn";
      updated = true;
    }

    /* ================= CHECK-OUT ================= */
    if (checkOutTime) {
      const date = new Date(checkOutTime);
      if (isNaN(date.getTime()))
        return res.status(400).json({ message: "Invalid check-out time" });

      if (!attendance.checkIn)
        return res
          .status(400)
          .json({ message: "Cannot check out without check-in" });

      attendance.checkOut = {
        time: date,
        location: DEFAULT_LOCATION,
      };

      attendance.checkInStatus = "CheckedOut";
      updated = true;
    }

    if (!updated)
      return res.status(400).json({ message: "No valid fields to update" });

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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

    // Find existing timing
    let timing = await CompanyTiming.findOne();

    if (!timing) {
      // ✅ Create new timing if none exists
      timing = await CompanyTiming.create({
        startTime,
        endTime,
        lateAfterMinutes,
      });
    } else {
      // ✅ Update existing timing
      timing.startTime = startTime;
      timing.endTime = endTime;
      timing.lateAfterMinutes = lateAfterMinutes;
      await timing.save();
    }

    res.json({
      success: true,
      message: "Company timing set successfully",
      timing,
    });
  } catch (error) {
    console.error("Error setting company timing:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
