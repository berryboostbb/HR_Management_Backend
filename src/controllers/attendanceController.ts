import { Request, Response } from "express";
import Attendance, { IAttendance } from "../models/attendanceModel";
import Account from "../models/userModel";
import JWTService from "../services/JWTServices";
import User from "../models/userModel";
import moment from "moment-timezone";

// Function to create daily attendance records with status "Absent"
export const createDailyAttendance = async (req: Request, res: Response) => {
  try {
    const employees = await User.find(); // Get all employees

    // Get today's date in UTC - Start of the day (midnight)
    const todayInUTC = moment.utc().startOf("day"); // Get the start of the day in UTC

    console.log(
      "🚀 ~ createDailyAttendance ~ todayInUTC:",
      todayInUTC.format()
    ); // Log the UTC date in proper format

    // Use for...of to properly handle async operations
    for (const employee of employees) {
      const existingAttendance = await Attendance.findOne({
        "employee.employeeId": employee.employeeId,
        date: todayInUTC.toDate(), // Use UTC for querying the DB
      });

      if (!existingAttendance) {
        // Create a new attendance record with "Absent" status
        const newAttendance = new Attendance({
          employee: {
            _id: employee._id,
            employeeId: employee.employeeId,
            employeeName: employee.name,
            employeeRole: employee.role,
            employeeType: employee.employeeType, // Add the missing employeeType
          },
          date: todayInUTC.toDate(), // Save the date in UTC, converting to Date here
          status: "Absent", // Default to "Absent"
          checkInStatus: "Pending", // Default to "CheckedOut"
        });

        await newAttendance.save(); // Ensure the save operation completes before moving to the next employee
      }
    }

    // After the loop finishes, send the response back to the client
    console.log("Attendance records created for today.");
    res.json({ message: "Attendance records successfully created for today." });
  } catch (error) {
    console.error("Error creating daily attendance records:", error);
    res
      .status(500)
      .json({ message: "Error creating attendance records", error });
  }
};

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
    const loggedInUserId = decodedToken._id; // Get the logged-in user ID from the token

    // Get the user from the database using the logged-in userId
    const loggedInUser = await User.findById(loggedInUserId); // Assuming User model has a findById method

    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the logged-in user is an admin
    const isAdmin = loggedInUser.role === "admin"; // Assuming 'role' field determines user type

    // Determine the employeeId: if logged-in user is admin, use the employeeId from the request body, otherwise use the logged-in user ID
    const employeeId = isAdmin ? req.body.employeeId : loggedInUser.employeeId;

    // Get today's date (ignore time)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the time to 00:00:00 for comparison

    // Check if attendance already exists for today
    let attendance = await Attendance.findOne({
      "employee.employeeId": employeeId,
      date: today,
    });
    console.log("🚀 ~ checkIn ~ attendance:", attendance);

    // If attendance already exists and the user has checked in, return a response
    if (attendance?.checkInStatus === "CheckedIn") {
      return res.status(400).json({ message: "Already checked in today" });
    }

    // If attendance doesn't exist, create a new one
    if (!attendance) {
      attendance = new Attendance({
        employee: {
          _id: loggedInUser._id,
          employeeId: loggedInUser.employeeId,
          employeeName: loggedInUser.name, // Assuming 'name' field is present in User model
          employeeRole: loggedInUser.role, // Assuming 'role' field is present in User model
          employeeType: loggedInUser.employeeType, // Assuming 'employeeType' field is present in User model
        },
        date: today,
        status: "Absent", // Default status
        checkInStatus: "CheckedOut", // Default to "CheckedOut" since they haven't checked in yet
      });
    }

    // If the attendance exists and hasn't been checked in, we update it
    attendance.checkInStatus = "CheckedIn"; // Set checkInStatus to "CheckedIn" when employee checks in
    attendance.status = "Present"; // Update status to "Present" once they check in

    // Get location data from the request body
    const { location } = req.body;

    // Log check-in time and location
    attendance.checkIn = {
      time: new Date(),
      location,
    };

    // Save the attendance record (whether it's updated or newly created)
    await attendance.save();

    // Return success message
    res.json({
      message: `Checked in successfully ${
        isAdmin ? `for employee ${employeeId}` : ""
      }`,
      attendance,
    });
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
      const startDate = new Date(Number(year), Number(month) - 1, 1); // First day of the month
      const endDate = new Date(Number(year), Number(month), 0); // Last day of the month

      // Filter by the month and year
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

// export const getAllAttendance = async (req: Request, res: Response) => {
//   try {
//     const { search } = req.query;

//     const query: any = {};

//     if (search) {
//       query.$or = [
//         { "employee.employeeId": { $regex: search, $options: "i" } },
//         { "employee.employeeName": { $regex: search, $options: "i" } },
//       ];
//     }

//     const logs = await Attendance.find(query).sort({ date: -1 });
//     res.json(logs);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

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

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      status,
      checkInTime,
      checkOutTime,
      checkInLocation,
      checkOutLocation,
      checkInStatus,
    } = req.body;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    // 🔒 Prevent editing locked attendance
    if (attendance.locked) {
      return res
        .status(400)
        .json({ message: "This attendance is locked and cannot be edited" });
    }

    /* =====================
       CHECK-IN UPDATE
    ====================== */
    if (checkInTime) {
      attendance.checkIn = {
        time: new Date(checkInTime),
        location: checkInLocation || attendance.checkIn?.location,
      };

      // 🔥 AUTO LOGIC
      attendance.checkInStatus = "CheckedIn";
      attendance.status = "Present";
    }

    /* =====================
       CHECK-OUT UPDATE
    ====================== */
    if (checkOutTime) {
      attendance.checkOut = {
        time: new Date(checkOutTime),
        location: checkOutLocation || attendance.checkOut?.location,
      };

      // Optional auto logic
      attendance.checkInStatus = "CheckedOut";
    }

    /* =====================
       MANUAL STATUS UPDATE
       (only if checkInTime not sent)
    ====================== */
    if (status && !checkInTime) {
      attendance.status = status; // Absent | Late | Leave
    }

    /* =====================
       MANUAL CHECK-IN STATUS
       (only if not auto-set)
    ====================== */
    if (checkInStatus && !checkInTime && !checkOutTime) {
      attendance.checkInStatus = checkInStatus;
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    console.error("Update Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update attendance",
      error,
    });
  }
};
