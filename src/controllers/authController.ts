import { Request, Response } from "express";
import User from "../models/userModel";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import JWTService from "../services/JWTServices";
import moment from "moment-timezone";
import bcrypt from "bcryptjs";
import { sendNotification } from "../utils/notifications";

dotenv.config();

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

// export const register = async (req: Request, res: Response) => {
//   try {
//     const {
//       name,
//       email,
//       password,
//       gender,
//       role,
//       employeeType,
//       joiningDate,
//       phoneNumber,
//       salaryStructure,
//       loanPF,
//       DOB,
//       image,
//       employeeStatus,
//       leaveEntitlements,
//       department,
//     } = req.body;

//     const exists = await User.findOne({ email });
//     if (exists) return res.status(400).json({ message: "User already exists" });

//     // Generate Employee ID
//     const employeeId = generateEmployeeId(employeeType);
//     const user = await User.create({
//       name,
//       email,
//       password,
//       gender,
//       role,
//       employeeType,
//       department,
//       joiningDate,
//       phoneNumber,
//       salaryStructure,
//       loanPF,
//       DOB,
//       image,
//       employeeStatus,
//       leaveEntitlements: {
//         casualLeave: leaveEntitlements?.casualLeave ?? 0,
//         sickLeave: leaveEntitlements?.sickLeave ?? 0,
//         annualLeave: leaveEntitlements?.annualLeave ?? 0,
//         maternityLeave: leaveEntitlements?.maternityLeave ?? 0,
//         paternityLeave: leaveEntitlements?.paternityLeave ?? 0,
//       },
//       employeeId,
//     });

//     // Generate access token
//     const token = JWTService.signAccessToken(
//       { _id: user._id.toString() },
//       "1d"
//     );

//     // Store the token in the database
//     await JWTService.storeAccessToken(token, user._id);

//     res.status(201).json({ user, token });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// Login

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
      DOB, // Date of Birth
      image,
      employeeStatus,
      leaveEntitlements,
      department,
    } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    // Generate Employee ID
    const employeeId = generateEmployeeId(employeeType);

    // Convert DOB to Pakistan Standard Time (PST) before saving
    const dobInPST = moment.tz(DOB, "Asia/Karachi").format(); // Adjust to PST (UTC +5)

    // Create the new user with the corrected DOB (in PST)
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
      DOB: dobInPST, // Store DOB in PST
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

    // Generate access token
    const token = JWTService.signAccessToken(
      { _id: user._id.toString() },
      "1d"
    );

    // Store the token in the database
    await JWTService.storeAccessToken(token, user._id);

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, fcmToken } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (user.employeeStatus === "Inactive") {
      return res
        .status(403)
        .json({ message: "Your account is inactive. Please contact admin." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Replace old FCM token with new one
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

    // 🔄 Reload user to ensure updated token is sent
    const freshUser = await User.findById(user._id).select("-password"); // remove password for security

    const token = JWTService.signAccessToken(
      { _id: freshUser!._id.toString() },
      "1d"
    );
    await JWTService.storeAccessToken(token, freshUser!._id);

    res.json({ user: freshUser, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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

// export const updateUser = async (req: Request, res: Response) => {
//   try {
//     const updateData = { ...req.body };

//     // If password exists in the update, hash it
//     if (updateData.password) {
//       const salt = await bcrypt.genSalt(10);
//       updateData.password = await bcrypt.hash(updateData.password, salt);
//     }

//     const user = await User.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//     });

//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// Delete User

export const updateUser = async (req: Request, res: Response) => {
  try {
    const updateData: any = { ...req.body };

    // NEVER update password here
    if (updateData.password) delete updateData.password;

    // Convert DOB to Pakistan Standard Time if provided
    if (updateData.DOB) {
      updateData.DOB = moment.tz(updateData.DOB, "Asia/Karachi").format();
    }

    // Find the user before update
    const userBeforeUpdate = await User.findById(req.params.id);
    if (!userBeforeUpdate)
      return res.status(404).json({ message: "User not found" });

    // Update the user
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (
      updateData.employeeStatus &&
      updateData.employeeStatus !== userBeforeUpdate.employeeStatus &&
      updateData.employeeStatus.toLowerCase() === "inactive"
    ) {
      if (user.fcmToken) {
        try {
          await sendNotification(
            [user.fcmToken], // must be an array
            "Account Status Update ❌",
            "You are now inactive. Please contact your admin."
          );
          console.log(`✅ Notification sent to ${user.name}`);
        } catch (notifError) {
          console.error(
            `❌ Failed to send notification to ${user.name}:`,
            notifError
          );
        }
      } else {
        console.log(`⚠️ User ${user.name} has no FCM token`);
      }
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const userId = req.params.id;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password only
    const user = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
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

    const todayDay = today.getDate(); // local day
    const todayMonth = today.getMonth() + 1; // local month

    // Fetch users whose DOB matches today (in UTC or local)
    const allUsers = await User.find().select(
      "name email employeeId role department image DOB employeeType"
    );

    const birthdays = allUsers.filter((user) => {
      const dob = new Date(user.DOB);
      const day = dob.getDate(); // local day
      const month = dob.getMonth() + 1; // local month
      return day === todayDay && month === todayMonth;
    });

    res.status(200).json({
      message: "Today's birthdays",
      total: birthdays.length,
      data: birthdays,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch today's birthdays",
      error,
    });
  }
};
