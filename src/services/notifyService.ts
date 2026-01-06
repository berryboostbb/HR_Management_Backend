import User from "../models/userModel";
import { sendNotification } from "../utils/notifications";
export const notifyUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || !user.fcmToken) return;

  const response = await sendNotification(
    user.fcmToken,
    "Hello!",
    "Your FCM integration is working!",
    { key: "value" }
  );

  console.log("Notification sent response:", response);
  return response;
};
