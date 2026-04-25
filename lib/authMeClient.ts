export type AuthRole = "swimmer" | "coach" | "admin";

export type AuthMeUser = {
  email?: string;
  role?: AuthRole;
  isApproved?: boolean;
  name?: string;
  gender?: string;
  mainEvents?: string[];
  extraEvents?: string[];
};

type AuthMeResponse = {
  success?: boolean;
  user?: AuthMeUser;
};

const DEFAULT_TTL_MS = 60_000;

let cachedUser: AuthMeUser | null = null;
let cachedAt = 0;
let inFlight: Promise<AuthMeUser | null> | null = null;

export function clearAuthMeCache() {
  cachedUser = null;
  cachedAt = 0;
  inFlight = null;
}

export async function getAuthMeUser(options?: {
  force?: boolean;
  ttlMs?: number;
}): Promise<AuthMeUser | null> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();

  if (!options?.force && cachedUser && now - cachedAt < ttlMs) {
    return cachedUser;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = fetch("/api/auth/me")
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as AuthMeResponse;
      const user = payload?.user ?? null;

      cachedUser = user;
      cachedAt = Date.now();

      return user;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
