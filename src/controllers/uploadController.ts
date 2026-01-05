import { Request, Response } from "express";
import multer from "multer";
import cloudinary from "../cloudinary/cloudinaryConfig";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: false,
  },
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB
  },
}).single("file");

const uploadController = {
  async uploadFileToCloudinary(req: Request, res: Response) {
    upload(req, res, async (err: any) => {
      if (err) {
        console.error("Multer Error:", err);
        return res.status(400).json({ message: err.message });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      try {
        const fileType = (req.query.fileType as string) || "assets";

        const base64String = `data:${
          file.mimetype
        };base64,${file.buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(base64String, {
          folder: `MedRep/${fileType}`,
          public_id: uuidv4(),
          resource_type: "auto",
        });

        return res.status(200).json({
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (error) {
        console.error("Cloudinary Error:", error);
        return res.status(500).json({
          message: "Cloudinary upload failed",
        });
      }
    });
  },
};

export default uploadController;
