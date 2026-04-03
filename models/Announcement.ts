import mongoose, { Schema, models } from "mongoose";

export interface IAnnouncement {
  _id: string;
  title: string;
  content: string;
  postedBy: string;
  postedByName: string;
  priority: "low" | "medium" | "high";
  status: "active" | "cancelled" | "completed";
  cancelledBy?: string;
  cancelledAt?: Date;
  completedBy?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    postedBy: {
      type: String,
      required: true,
    },
    postedByName: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "completed"],
      default: "active",
    },
    cancelledBy: {
      type: String,
      default: "",
    },
    cancelledAt: {
      type: Date,
    },
    completedBy: {
      type: String,
      default: "",
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const Announcement =
  models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", announcementSchema);

export default Announcement;
