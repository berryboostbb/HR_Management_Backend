// import admin from "../firebase";

// export const sendNotification = async (
//   tokens: string[] | string,
//   title: string,
//   body: string,
//   data?: { [key: string]: string }
// ) => {
//   const messaging = admin.messaging();
//   const payload = { notification: { title, body }, data };

//   try {
//     if (Array.isArray(tokens)) {
//       // Loop through tokens one by one
//       const results = [];
//       for (const token of tokens) {
//         try {
//           const res = await messaging.send({ ...payload, token });
//           results.push({ token, success: true, res });
//         } catch (err) {
//           results.push({ token, success: false, error: err });
//           console.error(`Failed to send notification to ${token}:`, err);
//         }
//       }
//       return results;
//     } else {
//       // Single token
//       return await messaging.send({ ...payload, token: tokens });
//     }
//   } catch (error) {
//     console.error("Notification Error:", error);
//     throw error;
//   }
// };

import admin from "../firebase";

export const sendNotification = async (
  tokens: string[] | string,
  title: string,
  body: string,
  data?: { [key: string]: string }
) => {
  const messaging = admin.messaging();

  const payload = {
    notification: { title, body },
    data,
  };

  const tokenList = Array.isArray(tokens) ? tokens : [tokens];

  const results = [];

  for (const token of tokenList) {
    try {
      const res = await messaging.send({
        token,
        ...payload,
      });

      results.push({ token, success: true, res });
    } catch (error: any) {
      console.error(`❌ Failed to send notification to ${token}:`, error.code);

      // 🚨 REQUIRED: Remove invalid tokens
      if (
        error.code === "messaging/registration-token-not-registered" ||
        error.code === "messaging/invalid-registration-token"
      ) {
        console.warn("🔥 Removing invalid FCM token:", token);

        // TODO: REMOVE FROM DB
        // await User.updateOne({ fcmToken: token }, { $unset: { fcmToken: "" } });
      }

      results.push({
        token,
        success: false,
        error: error.code,
      });
    }
  }

  return results;
};
