import { Request, Response } from "express";
import Leave, { ILeave } from "../models/leavesModel";
import moment from "moment";
import User from "../models/userModel";
import Attendance from "../models/attendanceModel";

import { sendNotification } from "../utils/notifications";

export const applyLeave = async (req: Request, res: Response) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Reason is required" });
    }

    const employee = await User.findOne({ employeeId });
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const leaveEntitlements = employee.leaveEntitlements;

    const leaveTypeMap: Record<string, string> = {
      "Casual Leave": "casualLeave",
      "Sick Leave": "sickLeave",
      "Earned Leave": "earnedLeave",
      "Maternity Leave": "maternityLeave",
      "Unpaid Leave": "unpaidLeave",
      "Annual Leave": "annualLeave",
      "Paternity Leave": "paternityLeave",
      "Compensatory Leave": "compensatoryLeave",
    };

    const leaveKey = leaveTypeMap[leaveType];
    if (!leaveKey || !leaveEntitlements[leaveKey]) {
      return res
        .status(400)
        .json({ message: `Invalid leave type: ${leaveType}` });
    }

    const start = moment(startDate).startOf("day");
    const end = moment(endDate).startOf("day");
    const requestedDays = end.diff(start, "days") + 1;

    if (requestedDays <= 0)
      return res
        .status(400)
        .json({ message: "End date must be after start date" });

    const availableLeave =
      leaveEntitlements[leaveKey].total - leaveEntitlements[leaveKey].consumed;

    if (requestedDays > availableLeave) {
      return res.status(400).json({
        message: `Not enough ${leaveType}. Available: ${availableLeave}, requested: ${requestedDays}`,
      });
    }

    // Check overlapping leaves
    const overlapping = await Leave.findOne({
      employeeId,
      status: "Approved",
      $or: [
        { startDate: { $lte: endDate, $gte: startDate } },
        { endDate: { $lte: endDate, $gte: startDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
      ],
    });

    if (overlapping)
      return res
        .status(400)
        .json({ message: "Leave overlaps with existing approved leave" });

    const leave = await Leave.create({
      employeeId,
      employeeName: employee.name,
      leaveType,
      startDate,
      endDate,
      reason,
      status: "Pending",
    });

    try {
      const admins = await User.find({
        role: "admin",
        fcmToken: { $exists: true, $ne: "" },
      });

      const adminTokens: string[] = admins
        .map((admin) => admin.fcmToken)
        .filter(Boolean);

      if (adminTokens.length > 0) {
        await sendNotification(
          adminTokens,
          "Leave Applied",
          `${employee.name} applied for ${leaveType}.`
        );
        console.log("✅ Leave notification sent to admins successfully");
      } else {
        console.log("⚠️ No admin FCM tokens found");
      }
    } catch (notifError) {
      console.error("Failed to send leave notification:", notifError);
    }

    res.status(201).json({ message: "Leave applied successfully", leave });
  } catch (error) {
    console.error("Apply Leave Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// export const updateLeaveStatus = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { status, approvedBy } = req.body;

//     const leave = await Leave.findById(id);
//     if (!leave) return res.status(404).json({ message: "Leave not found" });

//     leave.status = status;
//     leave.approvedBy = approvedBy;
//     await leave.save();

//     if (status === "Approved") {
//       const employee = await User.findOne({ employeeId: leave.employeeId });
//       if (!employee)
//         return res.status(404).json({ message: "Employee not found" });

//       const startDate = moment(leave.startDate).startOf("day");
//       const endDate = moment(leave.endDate).startOf("day");
//       const totalDays = endDate.diff(startDate, "days") + 1;

//       for (let i = 0; i < totalDays; i++) {
//         const dayStart = moment(startDate)
//           .add(i, "days")
//           .startOf("day")
//           .toDate();
//         const dayEnd = moment(startDate).add(i, "days").endOf("day").toDate();

//         // ✅ Find attendance within the day range
//         let attendance = await Attendance.findOne({
//           "employee.employeeId": leave.employeeId,
//           date: { $gte: dayStart, $lte: dayEnd },
//         });

//         if (attendance) {
//           attendance.status = "On Leave";
//           attendance.checkInStatus = "On Leave";
//           attendance.leaveInfo = {
//             leaveId: leave._id,
//             leaveType: leave.leaveType,
//           };
//           await attendance.save();
//         } else {
//           attendance = new Attendance({
//             employee: {
//               _id: employee._id,
//               employeeId: employee.employeeId,
//               employeeName: employee.name,
//               employeeRole: employee.role,
//               employeeType: employee.employeeType,
//             },
//             date: dayStart,
//             status: "On Leave",
//             checkInStatus: "On Leave",
//             leaveInfo: {
//               leaveId: leave._id,
//               leaveType: leave.leaveType,
//             },
//           });
//           await attendance.save();
//         }
//       }
//     }

//     res.json({ message: `Leave ${status}`, leave });
//   } catch (error) {
//     console.error("Update Leave Status Error:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

interface ILeaveType {
  total: number;
  consumed: number;
}

interface ILeaveEntitlements {
  casualLeave: ILeaveType;
  sickLeave: ILeaveType;
  annualLeave: ILeaveType;
  maternityLeave: ILeaveType;
  paternityLeave: ILeaveType;
}

// export const updateLeaveStatus = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { status, approvedBy } = req.body;

//     // Find leave
//     const leave = await Leave.findById(id);
//     if (!leave) return res.status(404).json({ message: "Leave not found" });

//     leave.status = status;
//     leave.approvedBy = approvedBy;
//     await leave.save();

//     if (status === "Approved") {
//       const employee = await User.findOne({ employeeId: leave.employeeId });
//       if (!employee)
//         return res.status(404).json({ message: "Employee not found" });

//       // Ensure leaveEntitlements exist and have correct structure
//       employee.leaveEntitlements = employee.leaveEntitlements || {
//         casualLeave: { total: 0, consumed: 0 },
//         sickLeave: { total: 0, consumed: 0 },
//         annualLeave: { total: 0, consumed: 0 },
//         maternityLeave: { total: 0, consumed: 0 },
//         paternityLeave: { total: 0, consumed: 0 },
//       };

//       // Map leave type string to object key
//       const leaveKeyMap: Record<string, keyof ILeaveEntitlements> = {
//         "Casual Leave": "casualLeave",
//         "Sick Leave": "sickLeave",
//         "Annual Leave": "annualLeave",
//         "Maternity Leave": "maternityLeave",
//         "Paternity Leave": "paternityLeave",
//       };

//       const leaveKey = leaveKeyMap[leave.leaveType];
//       if (leaveKey) {
//         const startDate = moment(leave.startDate).startOf("day");
//         const endDate = moment(leave.endDate).startOf("day");
//         const totalDays = endDate.diff(startDate, "days") + 1;

//         // ✅ Update consumed inside the leave type object
//         employee.leaveEntitlements[leaveKey].consumed += totalDays;

//         await employee.save();
//       }

//       // Update attendance
//       const startDate = moment(leave.startDate).startOf("day");
//       const endDate = moment(leave.endDate).startOf("day");
//       const totalDays = endDate.diff(startDate, "days") + 1;

//       for (let i = 0; i < totalDays; i++) {
//         const dayStart = moment(startDate)
//           .add(i, "days")
//           .startOf("day")
//           .toDate();
//         const dayEnd = moment(startDate).add(i, "days").endOf("day").toDate();

//         let attendance = await Attendance.findOne({
//           "employee.employeeId": leave.employeeId,
//           date: { $gte: dayStart, $lte: dayEnd },
//         });

//         if (attendance) {
//           attendance.status = "On Leave";
//           attendance.checkInStatus = "On Leave";
//           attendance.leaveInfo = {
//             leaveId: leave._id,
//             leaveType: leave.leaveType,
//           };
//           await attendance.save();
//         } else {
//           attendance = new Attendance({
//             employee: {
//               _id: employee._id,
//               employeeId: employee.employeeId,
//               employeeName: employee.name,
//               employeeRole: employee.role,
//               employeeType: employee.employeeType,
//             },
//             date: dayStart,
//             status: "On Leave",
//             checkInStatus: "On Leave",
//             leaveInfo: {
//               leaveId: leave._id,
//               leaveType: leave.leaveType,
//             },
//           });
//           await attendance.save();
//         }
//       }
//     }

//     res.json({ message: `Leave ${status}`, leave });
//   } catch (error) {
//     console.error("Update Leave Status Error:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, approvedBy } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // ✅ STORE OLD STATUS
    const previousStatus = leave.status;

    // ✅ UPDATE STATUS
    leave.status = status;
    leave.approvedBy = approvedBy;
    await leave.save();

    // 🔔 SEND NOTIFICATION ONLY WHEN STATUS CHANGES
    if (previousStatus !== status) {
      const employee = await User.findOne({ employeeId: leave.employeeId });

      if (employee?.fcmToken) {
        let title = "Leave Update";
        let body = `Your leave status has been updated to ${status}.`;

        if (status === "Approved") {
          title = "Leave Approved ✅";
          body = `Your ${leave.leaveType} has been approved.`;
        }

        if (status === "Rejected") {
          title = "Leave Rejected ❌";
          body = `Your ${leave.leaveType} has been rejected.`;
        }

        await sendNotification([employee.fcmToken], title, body);
      }
    }

    /**
     * ✅ ONLY ADD CONSUMED WHEN:
     * FROM not-approved → approved
     */
    if (previousStatus !== "Approved" && status === "Approved") {
      const employee = await User.findOne({ employeeId: leave.employeeId });
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // ✅ DEFAULT LEAVE STRUCTURE
      employee.leaveEntitlements = employee.leaveEntitlements || {
        casualLeave: { total: 0, consumed: 0 },
        sickLeave: { total: 0, consumed: 0 },
        annualLeave: { total: 0, consumed: 0 },
        maternityLeave: { total: 0, consumed: 0 },
        paternityLeave: { total: 0, consumed: 0 },
      };

      const leaveKeyMap: Record<string, keyof ILeaveEntitlements> = {
        "Casual Leave": "casualLeave",
        "Sick Leave": "sickLeave",
        "Annual Leave": "annualLeave",
        "Maternity Leave": "maternityLeave",
        "Paternity Leave": "paternityLeave",
      };

      const leaveKey = leaveKeyMap[leave.leaveType];
      if (!leaveKey) {
        return res.status(400).json({ message: "Invalid leave type" });
      }

      const startDate = moment(leave.startDate).startOf("day");
      const endDate = moment(leave.endDate).startOf("day");
      const totalDays = endDate.diff(startDate, "days") + 1;

      // ✅ UPDATE CONSUMED LEAVES
      employee.leaveEntitlements[leaveKey].consumed += totalDays;
      await employee.save();

      // 🔄 ATTENDANCE UPDATE
      for (let i = 0; i < totalDays; i++) {
        const dayStart = moment(startDate)
          .add(i, "days")
          .startOf("day")
          .toDate();
        const dayEnd = moment(startDate).add(i, "days").endOf("day").toDate();

        const day = moment
          .utc(startDate)
          .add(i, "days")
          .startOf("day")
          .toDate();

        let attendance = await Attendance.findOne({
          "employee.employeeId": leave.employeeId,
          date: day,
        });

        // let attendance = await Attendance.findOne({
        //   "employee.employeeId": leave.employeeId,
        //   date: { $gte: dayStart, $lte: dayEnd },
        // });

        if (attendance) {
          attendance.status = "On Leave";
          attendance.checkInStatus = "On Leave";
          attendance.leaveInfo = {
            leaveId: leave._id,
            leaveType: leave.leaveType,
          };
          await attendance.save();
        } else {
          attendance = new Attendance({
            employee: {
              _id: employee._id,
              employeeId: employee.employeeId,
              employeeName: employee.name,
              employeeRole: employee.role,
              employeeType: employee.employeeType,
            },
            date: dayStart,
            status: "On Leave",
            checkInStatus: "On Leave",
            leaveInfo: {
              leaveId: leave._id,
              leaveType: leave.leaveType,
            },
          });
          await attendance.save();
        }
        console.log("Leave status updated:", status, attendance);
      }
    }

    return res.json({ message: `Leave ${status}`, leave });
  } catch (error) {
    console.error("Update Leave Status Error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get all leaves (HR/Admin)
export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const { search } = req.query; // e.g., /leaves?search=Bilal

    const query: any = {};

    if (search) {
      query.$or = [
        { employeeId: { $regex: search, $options: "i" } },
        { employeeName: { $regex: search, $options: "i" } },
      ];
    }

    const leaves = await Leave.find(query).sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get leave history of an employee
export const getEmployeeLeaves = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const leaves = await Leave.find({ employeeId }).sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update leave (Edit leave request)
export const updateLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { leaveType, startDate, endDate, reason } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // Prevent update if already approved
    if (leave.status === "Approved") {
      return res
        .status(400)
        .json({ message: "Approved leave cannot be edited" });
    }

    // Check overlapping again (exclude current leave)
    const overlapping = await Leave.findOne({
      employeeId: leave.employeeId,
      status: "Approved",
      _id: { $ne: id },
      $or: [
        { startDate: { $lte: endDate, $gte: startDate } },
        { endDate: { $lte: endDate, $gte: startDate } },
      ],
    });

    if (overlapping) {
      return res
        .status(400)
        .json({ message: "Leave overlaps with existing approved leave" });
    }

    leave.leaveType = leaveType;
    leave.startDate = startDate;
    leave.endDate = endDate;
    leave.reason = reason;

    await leave.save();

    res.json({ message: "Leave updated successfully", leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// Delete leave
export const deleteLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    if (leave.status === "Approved") {
      return res
        .status(400)
        .json({ message: "Approved leave cannot be deleted" });
    }

    await Leave.findByIdAndDelete(id);

    res.json({ message: "Leave deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
