import express from "express";
import uploadController, { upload } from "../controllers/uploadController";

const router = express.Router();

router.post("/uploadFile", upload, uploadController.uploadFileToCloudinary);

export default router;
