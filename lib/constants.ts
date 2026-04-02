export const SWIMMING_EVENTS = [
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
] as const;

export const FACULTIES = [
  "Faculty of Engineering",
  "Faculty of IT",
  "Faculty of Medicine",
  "Faculty of Architecture",
  "Faculty of Business",
  "NDT",
] as const;

export const LEAVE_TYPES = {
  exam: "Exam Leave",
  assignment: "Assignment Leave",
  "personal-day": "Personal Day Off",
  other: "Other",
} as const;

export const USER_ROLES = {
  swimmer: "Swimmer",
  coach: "Coach",
  admin: "Admin",
} as const;

export const TRAINING_DAYS = {
  swimming: ["Monday", "Tuesday", "Thursday"],
  land: ["Saturday"],
} as const;

export type SwimmingEvent = (typeof SWIMMING_EVENTS)[number];
export type Faculty = (typeof FACULTIES)[number];
export type LeaveType = keyof typeof LEAVE_TYPES;
export type UserRole = keyof typeof USER_ROLES;
