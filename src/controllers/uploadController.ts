// import { Request, Response, NextFunction } from "express";
// import multer from "multer";
// import cloudinary from "../cloudinary/cloudinaryConfig";

// interface MulterRequestFixed extends Request {
//   file: multer.File; // use multer.File type
// }
// const storage = multer.memoryStorage();
// export const upload = multer({ storage }).single("file");

// const uploadController = {
//   async uploadFileToCloudinary(
//     req: MulterRequestFixed,
//     res: Response,
//     next: NextFunction
//   ): Promise<Response | void> {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ error: "No file uploaded" });
//       }
//       const { v4: uuidv4 } = await import("uuid");
//       const fileType = (req.query.fileType as string) || "assets";
//       const file = req.file;
//       const fileName = `${uuidv4()}-${file.originalname}`;
//       const base64String = `data:${file.mimetype};base64,${file.buffer.toString(
//         "base64"
//       )}`;

//       const result = await cloudinary.uploader.upload(base64String, {
//         folder: `MedRep/${fileType}`,
//         public_id: fileName,
//         resource_type: "auto",
//       });

//       return res.status(200).json({
//         url: result.secure_url,
//         public_id: result.public_id,
//       });
//     } catch (err) {
//       console.error("Error uploading to Cloudinary:", err);
//       next(err);
//     }
//   },
// };

// export default uploadController;

// controllers/uploadController.ts
import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

const storage = multer.memoryStorage();
export const upload = multer({ storage }).single("file");

const uploadController = {
  async uploadFileToCloudinary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { v4: uuidv4 } = await import("uuid");
      const fileType = (req.query.fileType as string) || "assets";
      const file = req.file;
      const fileName = `${uuidv4()}-${file.originalname}`;
      const base64String = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;

      // Configure Cloudinary if not already configured
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });

      const result = await cloudinary.uploader.upload(base64String, {
        folder: `MedRep/${fileType}`,
        public_id: fileName,
        resource_type: "auto",
      });

      return res.status(200).json({
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (err) {
      console.error("Error uploading to Cloudinary:", err);
      next(err);
    }
  },
};

export default uploadController;
