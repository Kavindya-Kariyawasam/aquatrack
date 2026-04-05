import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is missing. Add it to .env.local or .env first.");
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = value;
    index += 1;
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));
const email = String(args.email || "")
  .trim()
  .toLowerCase();
const password = String(args.password || "");
const fullName = String(args.name || "Admin User");

if (!email) {
  console.error("Missing email. Usage:");
  console.error(
    'npm run admin:bootstrap -- --email captain@uom.lk --password StrongPass123 --name "Team Captain"',
  );
  process.exit(1);
}

if (password && password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["swimmer", "coach", "admin"],
      default: "swimmer",
    },
    isApproved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    approvedBy: { type: String, default: "" },
    profile: {
      fullName: { type: String, default: "" },
      callingName: { type: String, default: "" },
      mainEvents: { type: [String], default: [] },
      extraEvents: { type: [String], default: [] },
    },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function run() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = "admin";
    existing.isApproved = true;
    existing.approvedAt = new Date();
    existing.approvedBy = "bootstrap-script";

    if (password) {
      existing.password = await bcrypt.hash(password, 10);
    }

    if (!existing.profile?.fullName && fullName) {
      existing.profile = {
        ...existing.profile,
        fullName,
      };
    }

    await existing.save();
    console.log(`Updated existing user to admin: ${email}`);
  } else {
    const resolvedPassword = password || "ChangeMe123!";
    const hashedPassword = await bcrypt.hash(resolvedPassword, 10);

    await User.create({
      email,
      password: hashedPassword,
      role: "admin",
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: "bootstrap-script",
      profile: {
        fullName,
        callingName: fullName,
        mainEvents: [],
        extraEvents: [],
      },
    });

    console.log(`Created new admin user: ${email}`);

    if (!password) {
      console.log(
        "No password provided. Temporary password set to: ChangeMe123!",
      );
      console.log("Please log in and change it immediately.");
    }
  }
}

run()
  .catch((error) => {
    console.error("Admin bootstrap failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
