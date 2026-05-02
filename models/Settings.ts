import mongoose, { Schema, models } from "mongoose";

export interface ISettings {
  _id: string;
  statsPageVisible: boolean;
  overallStatsVisible: boolean;
  aiGenerationEnabled: boolean;
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
  specialDates: Array<{
    date: Date;
    label: string;
    category: "meet" | "trial" | "team-event" | "other";
    sessionType: "swimming" | "land" | "none";
  }>;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const specialDatesSchema = {
  date: { type: Date, required: true },
  label: { type: String, default: "" },
  category: {
    type: String,
    enum: ["meet", "trial", "team-event", "other"],
    default: "other",
  },
  sessionType: {
    type: String,
    enum: ["swimming", "land", "none"],
    default: "none",
  },
};

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
    aiGenerationEnabled: {
      type: Boolean,
      default: true,
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
    specialDates: {
      type: [specialDatesSchema],
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

const existingSettings = models.Settings as
  | mongoose.Model<ISettings>
  | undefined;

if (existingSettings && !existingSettings.schema.path("specialDates")) {
  existingSettings.schema.add({
    specialDates: {
      type: [specialDatesSchema],
      default: [],
    },
  });
}

const Settings =
  existingSettings || mongoose.model<ISettings>("Settings", settingsSchema);

export default Settings;
