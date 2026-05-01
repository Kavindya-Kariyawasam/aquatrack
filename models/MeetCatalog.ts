import mongoose, { Schema, models } from "mongoose";

export interface IMeetCatalog {
  _id: string;
  name: string;
  normalizedName: string;
  type: "meet" | "trial";
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const meetCatalogSchema = new Schema<IMeetCatalog>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["meet", "trial"],
      required: true,
    },
    createdBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

meetCatalogSchema.index({ createdAt: -1 });

const MeetCatalog =
  models.MeetCatalog ||
  mongoose.model<IMeetCatalog>("MeetCatalog", meetCatalogSchema);

export default MeetCatalog;
