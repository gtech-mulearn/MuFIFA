const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 2 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const otpStore = globalThis.otpStore || new Map();
if (process.env.NODE_ENV !== "production") {
  globalThis.otpStore = otpStore;
}

// Periodic cleanup of all expired OTPs every 1 minute to prevent memory leaks
if (!globalThis.otpCleanupInterval) {
  globalThis.otpCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of otpStore.entries()) {
      if (now > entry.expiresAt) {
        otpStore.delete(key);
      }
    }
  }, 60 * 1000);
  if (typeof globalThis.otpCleanupInterval.unref === "function") {
    globalThis.otpCleanupInterval.unref();
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function cleanup(normalizedEmail) {
  const entry = otpStore.get(normalizedEmail);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    return null;
  }

  return entry;
}

export function createOtpSession(email, payload, otp) {
  const key = normalizeEmail(email);
  const now = Date.now();

  const session = {
    otp,
    payload,
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    resendAvailableAt: now + OTP_RESEND_MS,
    attempts: 0,
  };

  otpStore.set(key, session);

  return { ...session };
}

export function getOtpSession(email) {
  const key = normalizeEmail(email);
  const session = cleanup(key);
  return session ? { ...session } : null;
}

export function updateOtpSession(email, updater) {
  const key = normalizeEmail(email);
  const current = cleanup(key);

  if (!current) return null;

  const updated = updater({ ...current });
  otpStore.set(key, updated);
  return { ...updated };
}

export function clearOtpSession(email) {
  otpStore.delete(normalizeEmail(email));
}

export { OTP_TTL_MS, OTP_RESEND_MS, OTP_MAX_ATTEMPTS };
