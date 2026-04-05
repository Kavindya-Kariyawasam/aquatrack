# AquaTrack

AquaTrack is a swimming team management platform for the University of Moratuwa team.

## Stack

- Next.js (App Router) + TypeScript
- MongoDB + Mongoose
- JWT auth with HTTP-only cookie
- Google Gemini for AI training-set generation
- Tailwind CSS + reusable UI primitives

## Initial bootstrap commands used

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Core backend
npm install mongoose jsonwebtoken bcryptjs @google/generative-ai

# UI + utils
npm install lucide-react recharts react-hot-toast date-fns framer-motion clsx tailwind-merge tesseract.js

# Types
npm install -D @types/jsonwebtoken @types/bcryptjs
```

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create env file from template

```bash
cp .env.example .env.local
```

3. Fill `.env.local`

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_generated_jwt_secret
GOOGLE_AI_API_KEY=your_google_ai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_EMAIL_DOMAIN=
ALLOWED_EMAIL_EXCEPTIONS=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

4. Run dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run admin:bootstrap -- --email captain@uom.lk --password StrongPass123 --name "Team Captain"
```

## Current Routes

- `/login` - Sign in
- `/register` - Create account
- `/forgot-password` - Generate reset token/link
- `/reset-password` - Set a new password using reset token
- `/dashboard` - Protected home
- `/profile`, `/progress`, `/training`, `/attendance`, `/stats`, `/admin` - Protected module pages

## Create first admin user

After setting `.env.local` and running `npm install`, run:

```bash
npm run admin:bootstrap -- --email captain@uom.lk --password StrongPass123 --name "Team Captain"
```

What it does:

- If user exists: promotes to `admin` (and updates password if provided)
- If user does not exist: creates a new `admin` user

## Account and approval workflow

- Admin account: create manually with `npm run admin:bootstrap ...`
- Swimmer accounts: self-register from `/register` (default role is `swimmer`)
- Swimmer login: blocked until approved by admin
- Coach account: create by either:
  - Registering first, then set role to `coach` from Admin > Users
  - Or bootstrap/create as admin first and then downgrade role to `coach` from Admin > Users

## Email restriction with exceptions

To allow only `@uom.lk` plus a few specific non-uom emails:

```env
ALLOWED_EMAIL_DOMAIN=uom.lk
ALLOWED_EMAIL_EXCEPTIONS=youradmin@gmail.com,coach1@gmail.com
```

Behavior:

- Any `@uom.lk` email is allowed
- Only explicitly listed non-uom emails are allowed
- Other Gmail (or other domains) are blocked

## Commands to run and verify

```bash
# 1) install
npm install

# 2) quality checks
npm run lint
npm run build

# 3) start dev server
npm run dev
```

## Notes

- `.env.local` is intentionally gitignored.
- `COPILOT_INSTRUCTIONS.md` is local-only and gitignored.
- AI-generated training sets are **not** persisted automatically.
