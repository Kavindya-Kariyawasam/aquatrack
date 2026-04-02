import { NextRequest } from "next/server";

type RateLimiterStore = {
  count: number;
  resetAt: number;
};

type RateLimiterResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type RateLimiterOptions = {
  maxRequests: number;
  windowMs: number;
};

export function normalizeEmail(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function sanitizeText(value: unknown, maxLength: number): string {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isAllowedEmailDomain(email: string): boolean {
  const normalizedEmail = normalizeEmail(email);

  const allowedExceptions = String(process.env.ALLOWED_EMAIL_EXCEPTIONS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  if (allowedExceptions.includes(normalizedEmail)) {
    return true;
  }

  const allowedDomain = String(process.env.ALLOWED_EMAIL_DOMAIN || "")
    .trim()
    .toLowerCase();

  if (!allowedDomain) {
    return true;
  }

  return normalizedEmail.endsWith(`@${allowedDomain}`);
}

export function isStrongPassword(password: string): boolean {
  if (password.length < 8 || password.length > 128) {
    return false;
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return hasUpper && hasLower && hasNumber && hasSymbol;
}

export function getRequestIdentifier(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for") || "";
  const firstIp = forwardedFor.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();

  return firstIp || realIp || "unknown-client";
}

export function createRateLimiter(options: RateLimiterOptions) {
  const store = new Map<string, RateLimiterStore>();

  return (key: string): RateLimiterResult => {
    const now = Date.now();
    const existing = store.get(key);

    if (!existing || now > existing.resetAt) {
      store.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });

      return {
        allowed: true,
        retryAfterSeconds: 0,
      };
    }

    existing.count += 1;

    if (existing.count > options.maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((existing.resetAt - now) / 1000),
        ),
      };
    }

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  };
}
