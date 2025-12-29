import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAccessToken extends Document {
  token: string;
  userId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const accessTokenSchema: Schema<IAccessToken> = new Schema(
  {
    token: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

const AccessToken: Model<IAccessToken> = mongoose.model<IAccessToken>(
  "AccessToken",
  accessTokenSchema,
  "access tokens"
);

export default AccessToken;
