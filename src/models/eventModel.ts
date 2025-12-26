import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  coverImage: string;
  date: Date;
  heading: string;
  overview: string;
  category: "Office Staff" | "Field Staff" | "HR";
  createdAt?: Date;
  updatedAt?: Date;
}

const EventSchema: Schema<IEvent> = new Schema(
  {
    coverImage: { type: String, required: true },
    date: { type: Date, required: true },
    heading: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      //   enum: ["Office Staff", "Field Staff", "HR"],
    },
  },
  { timestamps: true }
);

const Event = mongoose.model<IEvent>("Event", EventSchema);
export default Event;
