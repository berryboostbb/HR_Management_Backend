import express from "express";
import uploadController from "../controllers/uploadController";

const router = express.Router();

router.post("/uploadFile", uploadController.uploadFileToCloudinary);

export default router;
