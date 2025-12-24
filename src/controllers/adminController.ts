import { Request, Response } from "express";
import Admin from "../models/adminModel";
import jwt from "jsonwebtoken";

let ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const generateToken = (id: string) => {
  return jwt.sign({ id }, ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
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

// Register Admin
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      designation,
      employeeRole,
      joiningDate,
      salaryStructure,
      loanPF, // corrected
      DOB,
      image,
      employeeStatus,
      leaveEntitlements,
      department,
    } = req.body;

    const exists = await Admin.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Admin already exists" });

    const employeeId = generateEmployeeId(employeeRole);
    const admin = await Admin.create({
      name,
      email,
      password,
      designation,
      employeeRole,
      department,
      joiningDate,
      salaryStructure,
      loanPF, // pass loanPF object here
      DOB,
      image,
      employeeStatus,
      leaveEntitlements,
      employeeId,
    });

    res.status(201).json({ admin, token: generateToken(admin._id.toString()) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Login Admin
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    res.json({ admin, token: generateToken(admin._id.toString()) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all Admins
export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await Admin.find();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update Admin
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Delete Admin
export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// Logout Admin
export const logoutAdmin = async (req: Request, res: Response) => {
  try {
    // If using cookies, clear them
    res.clearCookie("token"); // if your token is in cookies
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
