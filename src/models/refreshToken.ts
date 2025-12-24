import mongoose, { Document, Schema, Model } from "mongoose";

export interface IRefreshToken extends Document {
  token: string;
  userId?: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const refreshTokenSchema: Schema<IRefreshToken> = new Schema(
  {
    token: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    adminId: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  {
    timestamps: true,
  }
);

const RefreshToken: Model<IRefreshToken> = mongoose.model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema,
  "refresh tokens"
);

export default RefreshToken;
