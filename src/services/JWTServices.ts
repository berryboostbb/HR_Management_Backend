import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { Types } from "mongoose";
import AccessToken from "../models/accessToken";
import RefreshToken from "../models/refreshToken";

interface JwtPayload {
  _id: string;
  [key: string]: any; // for any additional payload properties
}

// Assuming these are string or undefined, make sure to check before use
const ACCESS_TOKEN_SECRET: Secret =
  process.env.ACCESS_TOKEN_SECRET || "default_access_secret";
const REFRESH_TOKEN_SECRET: Secret =
  process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret";

class JWTService {
  static signAccessToken(payload: JwtPayload, expiryTime: string): string {
    const options: SignOptions = { expiresIn: expiryTime as any };
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, options);
  }

  static signRefreshToken(payload: JwtPayload, expiryTime: string): string {
    const options: SignOptions = { expiresIn: expiryTime as any };
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
  }

  // Verify access token
  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, ACCESS_TOKEN_SECRET as string) as JwtPayload;
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, REFRESH_TOKEN_SECRET as string) as JwtPayload;
  }

  // Store refresh token in DB
  static async storeRefreshToken(
    token: string,
    userId?: Types.ObjectId,
    adminId?: Types.ObjectId
  ): Promise<void> {
    try {
      const newToken = new RefreshToken({
        token,
        userId,
        adminId,
      });

      await newToken.save();
    } catch (error) {
      console.error("Error storing refresh token:", error);
    }
  }

  // Store access token in DB
  static async storeAccessToken(
    token: string,
    userId?: Types.ObjectId,
    adminId?: Types.ObjectId
  ): Promise<void> {
    try {
      const newToken = new AccessToken({
        token,
        userId,
        adminId,
      });

      await newToken.save();
    } catch (error) {
      console.error("Error storing access token:", error);
    }
  }
}

export default JWTService;
