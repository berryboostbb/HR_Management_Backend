import { Router, Request, Response } from "express";
import { sendNotification } from "../utils/notifications";

const router = Router();

router.post("/send", async (req: Request, res: Response) => {
  const { token, title, message } = req.body;

  if (!token || !title || !message) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    // Wrap single token in an array
    const response = await sendNotification([token], title, message);
    return res.json({ success: true, response });
  } catch (error) {
    console.error("Error sending notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: (error as Error).message,
    });
  }
});

export default router;
