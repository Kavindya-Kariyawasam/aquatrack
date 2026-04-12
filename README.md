# AquaTrack

AquaTrack is a role-based swimming team management system built for the University of Moratuwa team.

## Tech Stack

- Next.js (App Router) with TypeScript
- MongoDB with Mongoose
- JWT authentication via HTTP-only cookies
- Tailwind CSS UI with reusable components
- Google Gemini integration for training set generation

## Core Features

- Authentication and account approval workflow
- Role-based access for swimmer, coach, and admin
- Profile management and swimmer event preferences
- Timing and progress tracking
- Attendance with leave request approval flow
- Team and statistics dashboards
- Announcement publishing, status updates, and editing
- Training set posting, generation, and private set requests
- Past meet results viewer from static CSV data

## Project Setup

1. Install dependencies

```bash
npm install
```

2. Create local environment file

```bash
cp .env.example .env.local
```

3. Configure environment variables

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret_min_32_chars
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

4. Run development server

```bash
npm run dev
```

5. Validate production readiness locally

```bash
npm run lint
npm run build
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run admin:bootstrap -- --email captain@uom.lk --password StrongPass123 --name "Team Captain"
```

## Role Access Summary

- Swimmer:
  - Track timings and progress
  - View assigned/public training sets
  - Submit attendance leave requests
  - View announcements and team stats (based on settings)

- Coach:
  - Manage attendance and training sets
  - Post and edit announcements
  - View team and stats pages
  - Manage swimmer set requests

- Admin:
  - All coach permissions
  - User approval and role assignment
  - System settings management

## Main App Routes

- Public:
  - /login
  - /register
  - /forgot-password
  - /reset-password

- Protected:
  - /dashboard
  - /profile
  - /progress
  - /training
  - /attendance
  - /stats
  - /past-results
  - /announcements
  - /team
  - /admin

## Initial Admin Bootstrap

After setting environment variables and running npm install:

```bash
npm run admin:bootstrap -- --email captain@uom.lk --password StrongPass123 --name "Team Captain"
```

Behavior:

- If user already exists, role is updated to admin.
- If user does not exist, a new admin account is created.

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add all required environment variables in Vercel Project Settings.
4. Do not commit .env.local.
5. Deploy and verify critical flows (login, dashboard, role-protected actions).

## Security Notes

- Secrets are safe from source exposure if kept only in Vercel environment variables and never committed.
- API authorization is enforced server-side using JWT and role checks.
- UI hiding alone is not trusted for security; server routes still validate permissions.
- Login and register routes include request rate limiting.
- Passwords are hashed with bcrypt.

## Ownership and Usage Notice

- Project owner: Nexivo Labs (GitHub organization)
- Original creator account: kavinyda-kariyawasam
- Copyright (c) 2026 Nexivo Labs. All rights reserved.

Source visibility does not grant permission to copy, reuse, redistribute, rebrand, or create derivative commercial/academic products from this codebase without explicit written permission from Nexivo Labs.

If you need usage rights, integration rights, or collaboration approval, contact
Nexivo Labs first.
