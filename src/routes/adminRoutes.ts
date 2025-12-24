import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  logoutAdmin,
} from "../controllers/adminController";
import { validateBody } from "../validations/validateMiddleware";
import {
  registerAdminSchema,
  loginAdminSchema,
  updateAdminSchema,
} from "../validations/adminValidation";

const router = express.Router();

router.post("/register", validateBody(registerAdminSchema), registerAdmin);
router.post("/login", validateBody(loginAdminSchema), loginAdmin);
router.get("/getAllAdmins", getAllAdmins);
router.put("/updateAdmin/:id", validateBody(updateAdminSchema), updateAdmin);
router.delete("/deleteAdmin/:id", deleteAdmin);
router.post("/logoutAdmin", logoutAdmin);

export default router;
