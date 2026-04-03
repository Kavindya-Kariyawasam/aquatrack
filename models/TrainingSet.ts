import mongoose, { Schema, models } from "mongoose";

export interface ITrainingSet {
  _id: string;
  type: "swimming" | "land";
  date: Date;
  content: string;
  imageUrl?: string;
  extractedText?: string;
  postedBy: string;
  postedByName: string;
  isAIGenerated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const trainingSetSchema = new Schema<ITrainingSet>(
  {
    type: {
      type: String,
      enum: ["swimming", "land"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    extractedText: {
      type: String,
      default: "",
    },
    postedBy: {
      type: String,
      required: true,
    },
    postedByName: {
      type: String,
      required: true,
    },
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

trainingSetSchema.index({ type: 1, date: -1 });

const TrainingSet =
  models.TrainingSet ||
  mongoose.model<ITrainingSet>("TrainingSet", trainingSetSchema);

export default TrainingSet;
