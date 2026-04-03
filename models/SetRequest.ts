import mongoose, { Schema, models } from "mongoose";

export interface ISetRequest {
  _id: string;
  userId: string;
  userName: string;
  type: "swimming" | "land";
  message: string;
  status: "pending" | "approved" | "fulfilled";
  fulfilledBy?: string;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}

const setRequestSchema = new Schema<ISetRequest>(
  {
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["swimming", "land"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "fulfilled"],
      default: "pending",
    },
    fulfilledBy: {
      type: String,
      default: "",
    },
    response: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const SetRequest =
  models.SetRequest ||
  mongoose.model<ISetRequest>("SetRequest", setRequestSchema);

export default SetRequest;
