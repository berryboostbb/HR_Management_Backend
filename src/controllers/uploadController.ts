import { Request, Response } from "express";
import multer from "multer";
import cloudinary from "../cloudinary/cloudinaryConfig";
import { v4 as uuidv4 } from "uuid";

interface MulterRequestFixed extends Request {
  file?: Express.Multer.File;
}

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
}).single("file");

const uploadController = {
  async uploadFileToCloudinary(
    req: MulterRequestFixed,
    res: Response
  ): Promise<Response> {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileType = (req.query.fileType as string) || "assets";
      const file = req.file;

      const base64String = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;

      const result = await cloudinary.uploader.upload(base64String, {
        folder: `MedRep/${fileType}`,
        public_id: `${uuidv4()}`,
        resource_type: "auto",
      });

      return res.status(200).json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);

      return res.status(500).json({
        success: false,
        message: "Upload failed on server",
      });
    }
  },
};

export default uploadController;
