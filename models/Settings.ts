import mongoose, { Schema, models } from "mongoose";

export interface ISettings {
  _id: string;
  statsPageVisible: boolean;
  overallStatsVisible: boolean;
  weeklySchedule: {
    monday: "swimming" | "land" | "none";
    tuesday: "swimming" | "land" | "none";
    wednesday: "swimming" | "land" | "none";
    thursday: "swimming" | "land" | "none";
    friday: "swimming" | "land" | "none";
    saturday: "swimming" | "land" | "none";
    sunday: "swimming" | "land" | "none";
  };
  holidays: Array<{
    date: Date;
    reason: string;
    sessionType: "swimming" | "land" | "none";
  }>;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    statsPageVisible: {
      type: Boolean,
      default: true,
    },
    overallStatsVisible: {
      type: Boolean,
      default: false,
    },
    weeklySchedule: {
      monday: {
        type: String,
        enum: ["swimming", "land", "none"],
        default: "swimming",
      },
      tuesday: {
        type: String,
        enum: ["swimming", "land", "none"],
        default: "swimming",
      },
      wednesday: {
        type: String,
        enum: ["swimming", "land", "none"],
        default: "none",
      },
      thursday: {
        type: String,
        enum: ["swimming", "land", "none"],
        default: "none",
      },
      friday: {
        type: String,
        enum: ["swimming", "land", "none"],
        default: "swimming",
      },
      saturday: {
        type: String,
        enum: ["swimming", "land", "none"],
        default: "land",
      },
      sunday: {
        type: String,
        enum: ["swimming", "land", "none"],
        default: "none",
      },
    },
    holidays: {
      type: [
        {
          date: { type: Date, required: true },
          reason: { type: String, default: "" },
          sessionType: {
            type: String,
            enum: ["swimming", "land", "none"],
            default: "none",
          },
        },
      ],
      default: [],
    },
    updatedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Settings =
  models.Settings || mongoose.model<ISettings>("Settings", settingsSchema);

export default Settings;
