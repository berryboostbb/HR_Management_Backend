import { Request, Response } from "express";
import User from "../models/userModel";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import JWTService from "../services/JWTServices";
dotenv.config();

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
};

const generateEmployeeId = (role: string) => {
  const rolePart = role.substring(0, 3).toUpperCase();
  const numberPart = Math.floor(1000 + Math.random() * 9000);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let letterPart = "";
  for (let i = 0; i < 3; i++) {
    letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return `${rolePart}${numberPart}${letterPart}`;
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      gender,
      role,
      employeeType,
      joiningDate,
      phoneNumber,
      salaryStructure,
      loanPF,
      DOB,
      image,
      employeeStatus,
      leaveEntitlements,
      department,
    } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    // Generate Employee ID
    const employeeId = generateEmployeeId(employeeType);
    const user = await User.create({
      name,
      email,
      password,
      gender,
      role,
      employeeType,
      department,
      joiningDate,
      phoneNumber,
      salaryStructure,
      loanPF,
      DOB,
      image,
      employeeStatus,
      leaveEntitlements: {
        casualLeave: leaveEntitlements?.casualLeave ?? 0,
        sickLeave: leaveEntitlements?.sickLeave ?? 0,
        annualLeave: leaveEntitlements?.annualLeave ?? 0,
        maternityLeave: leaveEntitlements?.maternityLeave ?? 0,
        paternityLeave: leaveEntitlements?.paternityLeave ?? 0,
      },
      employeeId,
    });

    res.status(201).json({ user, token: generateToken(user._id.toString()) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    console.log("🚀 ~ login ~ isMatch:", isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    } else {
      res.json({ user, token: generateToken(user._id.toString()) });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all Users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { employeeId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update User
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Delete User
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// Logout User
export const logout = async (req: Request, res: Response) => {
  try {
    // If using cookies, clear them
    res.clearCookie("token"); // if your token is in cookies
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const getTodayBirthdays = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;

    const allUsers = await User.find().select(
      "name email employeeId role department image DOB employeeType"
    );

    const birthdays = allUsers.filter((user) => {
      const dob = new Date(user.DOB);
      const day = dob.getDate();
      const month = dob.getMonth() + 1;
      return day === todayDay && month === todayMonth;
    });

    res.status(200).json({
      message: "Today's birthdays",
      total: birthdays.length,
      data: birthdays,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch today's birthdays",
      error,
    });
  }
};
