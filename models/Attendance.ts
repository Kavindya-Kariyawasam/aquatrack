import mongoose, { Schema, models } from "mongoose";

export interface IAttendance {
  _id: string;
  userId: string;
  date: Date;
  type: "swimming" | "land";
  status:
    | "present"
    | "absent-unrequested"
    | "absent-requested"
    | "absent-approved";
  leaveType?: "exam" | "assignment" | "personal-day" | "other" | "";
  reason?: string;
  requestedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["swimming", "land"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "present",
        "absent-unrequested",
        "absent-requested",
        "absent-approved",
      ],
      default: "present",
    },
    leaveType: {
      type: String,
      enum: ["exam", "assignment", "personal-day", "other", ""],
      default: "",
    },
    reason: {
      type: String,
      default: "",
    },
    requestedAt: {
      type: Date,
    },
    approvedBy: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

attendanceSchema.index({ userId: 1, date: 1, type: 1 }, { unique: true });

const Attendance =
  models.Attendance ||
  mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;
