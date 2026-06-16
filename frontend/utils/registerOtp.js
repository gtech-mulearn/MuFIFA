const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 2 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const otpStore = globalThis.otpStore || new Map();
if (process.env.NODE_ENV !== "production") {
  globalThis.otpStore = otpStore;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function cleanup(email) {
  const key = normalizeEmail(email);
  const entry = otpStore.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return null;
  }

  return entry;
}

export function createOtpSession(email, payload, otp) {
  const key = normalizeEmail(email);
  const now = Date.now();

  otpStore.set(key, {
    otp,
    payload,
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    resendAvailableAt: now + OTP_RESEND_MS,
    attempts: 0,
  });

  return otpStore.get(key);
}

export function getOtpSession(email) {
  return cleanup(email);
}

export function updateOtpSession(email, updater) {
  const key = normalizeEmail(email);
  const current = cleanup(key);

  if (!current) return null;

  const updated = updater(current);
  otpStore.set(key, updated);
  return updated;
}

export function clearOtpSession(email) {
  otpStore.delete(normalizeEmail(email));
}

export { OTP_TTL_MS, OTP_RESEND_MS, OTP_MAX_ATTEMPTS };
