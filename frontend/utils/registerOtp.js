const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 2 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  "Content-Type": "application/json",
};

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// Deletes OTP records that are older than 5 minutes
async function deleteOldOtps() {
  if (!supabaseUrl || !supabaseKey) return;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/otp?created_at=lt.${encodeURIComponent(fiveMinutesAgo)}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) {
      console.error("Failed to delete expired OTPs:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Failed to delete expired OTPs from database:", err);
  }
}

export async function createOtpSession(email, payload, otp) {
  await deleteOldOtps();

  const key = normalizeEmail(email);
  const now = Date.now();

  const session = {
    email: key,
    otp,
    payload,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + OTP_TTL_MS).toISOString(),
    resend_available_at: new Date(now + OTP_RESEND_MS).toISOString(),
    attempts: 0,
  };

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/otp`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(session),
    });

    if (!res.ok) {
      throw new Error(`Failed to insert/update OTP session: ${await res.text()}`);
    }
  } catch (err) {
    console.error("Error creating OTP session in DB:", err);
  }

  return {
    otp,
    payload,
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    resendAvailableAt: now + OTP_RESEND_MS,
    attempts: 0,
  };
}

export async function getOtpSession(email) {
  await deleteOldOtps();

  const key = normalizeEmail(email);

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/otp?email=eq.${encodeURIComponent(key)}`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to query OTP session: ${await res.text()}`);
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) return null;

    const row = rows[0];

    // Check expiration locally as well
    const expiresAtMs = new Date(row.expires_at).getTime();
    if (Date.now() > expiresAtMs) {
      await clearOtpSession(email);
      return null;
    }

    return {
      otp: row.otp,
      payload: row.payload,
      createdAt: new Date(row.created_at).getTime(),
      expiresAt: expiresAtMs,
      resendAvailableAt: new Date(row.resend_available_at).getTime(),
      attempts: row.attempts,
    };
  } catch (err) {
    console.error("Error retrieving OTP session from DB:", err);
    return null;
  }
}

export async function updateOtpSession(email, updater) {
  const current = await getOtpSession(email);
  if (!current) return null;

  const updated = updater({ ...current });
  const key = normalizeEmail(email);

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/otp?email=eq.${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        attempts: updated.attempts,
        otp: updated.otp,
        payload: updated.payload,
        expires_at: new Date(updated.expiresAt).toISOString(),
        resend_available_at: new Date(updated.resendAvailableAt).toISOString(),
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update OTP session in DB: ${await res.text()}`);
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      otp: row.otp,
      payload: row.payload,
      createdAt: new Date(row.created_at).getTime(),
      expiresAt: new Date(row.expires_at).getTime(),
      resendAvailableAt: new Date(row.resend_available_at).getTime(),
      attempts: row.attempts,
    };
  } catch (err) {
    console.error("Error updating OTP session in DB:", err);
    return null;
  }
}

export async function clearOtpSession(email) {
  const key = normalizeEmail(email);

  try {
    await fetch(`${supabaseUrl}/rest/v1/otp?email=eq.${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers,
    });
  } catch (err) {
    console.error("Error deleting OTP session from DB:", err);
  }
}

export { OTP_TTL_MS, OTP_RESEND_MS, OTP_MAX_ATTEMPTS };
