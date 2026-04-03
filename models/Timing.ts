import mongoose, { Schema, models } from "mongoose";

export interface ITiming {
  _id: string;
  userId: string;
  event: string;
  time: string;
  date: Date;
  type: "trial" | "meet";
  meetName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const timingSchema = new Schema<ITiming>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      enum: [
        "50 freestyle",
        "100 freestyle",
        "200 freestyle",
        "400 freestyle",
        "50 backstroke",
        "100 backstroke",
        "200 backstroke",
        "50 breaststroke",
        "100 breaststroke",
        "200 breaststroke",
        "50 butterfly",
        "100 butterfly",
        "200 butterfly",
        "200 individual medley",
      ],
    },
    time: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ["trial", "meet"],
      required: true,
    },
    meetName: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

timingSchema.index({ userId: 1, event: 1, date: -1 });

const Timing = models.Timing || mongoose.model<ITiming>("Timing", timingSchema);

export default Timing;
