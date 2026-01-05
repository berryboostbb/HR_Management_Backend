import express from "express";
import {
  register,
  login,
  getAllUsers,
  updateUser,
  deleteUser,
  logout,
  getTodayBirthdays,
  updatePassword,
} from "../controllers/authController";
import { validateBody } from "../validations/validateMiddleware";
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
} from "../validations/userValidation";
import { getRoles } from "../controllers/roleController";

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/getAllUsers", getAllUsers);
router.put("/updateUser/:id", validateBody(updateUserSchema), updateUser);
router.delete("/deleteUser/:id", deleteUser);
router.post("/logout", logout);
router.get("/birthdays", getTodayBirthdays);
router.patch("/updatePassword/:id", updatePassword);

//roles route

router.get("/getRoles", getRoles);

export default router;
