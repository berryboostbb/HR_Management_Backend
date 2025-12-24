import { Request, Response } from "express";
import Leave, { ILeave } from "../models/leavesModel";

// Apply for leave
export const applyLeave = async (req: Request, res: Response) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    // Optional: Check if leave overlaps with existing approved leaves
    const overlapping = await Leave.findOne({
      employeeId,
      status: "Approved",
      $or: [
        { startDate: { $lte: endDate, $gte: startDate } },
        { endDate: { $lte: endDate, $gte: startDate } },
      ],
    });

    if (overlapping)
      return res
        .status(400)
        .json({ message: "Leave overlaps with existing approved leave" });

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    res.status(201).json({ message: "Leave applied successfully", leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Approve or reject leave
export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, approvedBy } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.status = status;
    leave.approvedBy = approvedBy;

    await leave.save();
    res.json({ message: `Leave ${status}`, leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all leaves (HR/Admin)
export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const leaves = await Leave.find().sort({ appliedAt: -1 });
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
