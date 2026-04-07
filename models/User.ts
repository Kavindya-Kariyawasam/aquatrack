import mongoose, { Schema, models } from "mongoose";

export interface IUser {
  _id: string;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isApproved: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  role: "swimmer" | "coach" | "admin";
  profile: {
    fullName: string;
    callingName: string;
    gender: "male" | "female" | "";
    dob: Date;
    contact: string;
    emergencyContact: string;
    faculty: string;
    batch: number;
    universityId: string;
    nicNumber: string;
    mainEvents: string[];
    extraEvents: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetPasswordToken: {
      type: String,
      default: "",
    },
    resetPasswordExpires: {
      type: Date,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["swimmer", "coach", "admin"],
      default: "swimmer",
    },
    profile: {
      fullName: { type: String, default: "" },
      callingName: { type: String, default: "" },
      gender: {
        type: String,
        enum: ["male", "female", ""],
        default: "",
      },
      dob: { type: Date },
      contact: { type: String, default: "" },
      emergencyContact: { type: String, default: "" },
      faculty: {
        type: String,
        enum: [
          "Faculty of Engineering",
          "Faculty of IT",
          "Faculty of Medicine",
          "Faculty of Architecture",
          "Faculty of Business",
          "NDT",
          "",
        ],
        default: "",
      },
      batch: { type: Number },
      universityId: { type: String, default: "" },
      nicNumber: { type: String, default: "" },
      mainEvents: {
        type: [String],
        default: [],
        validate: {
          validator: function (v: string[]) {
            return v.length <= 3;
          },
          message: "Cannot have more than 3 main events",
        },
      },
      extraEvents: {
        type: [String],
        default: [],
        validate: {
          validator: function (v: string[]) {
            return v.length <= 2;
          },
          message: "Cannot have more than 2 extra events",
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

const User = models.User || mongoose.model<IUser>("User", userSchema);

export default User;
