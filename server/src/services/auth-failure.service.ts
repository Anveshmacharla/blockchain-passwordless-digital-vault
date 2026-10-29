import { createSecurityAlert } from "./security-alert.service";

interface FailedAttemptRecord {
  count: number;
  windowStart: number;
  throttledUntil?: number;
}

const failedAttempts = new Map<
  string,
  FailedAttemptRecord
>();

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const THROTTLE_MS = 10 * 60 * 1000;

export const checkAuthenticationThrottle = (
  identifier: string
): boolean => {
  const record =
    failedAttempts.get(identifier);

  if (!record) {
    return false;
  }

  const now = Date.now();

  if (
    record.throttledUntil &&
    now < record.throttledUntil
  ) {
    return true;
  }

  if (
    now - record.windowStart >=
    WINDOW_MS
  ) {
    failedAttempts.delete(identifier);
    return false;
  }

  return false;
};

export const recordFailedAuthenticationAttempt =
  async (
    identifier: string,
    userId?: string
  ): Promise<void> => {
    const now = Date.now();

    let record =
      failedAttempts.get(identifier);

    if (
      !record ||
      now - record.windowStart >=
        WINDOW_MS
    ) {
      record = {
        count: 0,
        windowStart: now,
      };
    }

    record.count += 1;

    if (record.count >= MAX_ATTEMPTS) {
      record.throttledUntil =
        now + THROTTLE_MS;

      failedAttempts.set(
        identifier,
        record
      );

      if (userId) {
        await createSecurityAlert({
          user_id: userId,
          alert_type:
            "AUTHENTICATION_FAILURE_THRESHOLD",
          description:
            "Five failed WebAuthn authentication attempts occurred within ten minutes",
          severity: "HIGH",
        });
      }

      return;
    }

    failedAttempts.set(
      identifier,
      record
    );
  };

export const resetAuthenticationAttempts = (
  identifier: string
): void => {
  failedAttempts.delete(identifier);
};