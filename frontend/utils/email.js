/**
 * Email utility to delegate OTP and Ticket generation/sending to the Hono backend.
 */

export async function sendRegistrationOtpEmail({ email, name }) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3005";
  const backendApiKey = process.env.BACKEND_API_KEY || "";

  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (backendApiKey) {
      headers["X-Internal-API-Key"] = backendApiKey;
    }

    const response = await fetch(`${backendUrl}/api/v1/send-otp`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        name,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend send-otp request failed:", errorText);
      return null;
    }

    const result = await response.json();
    console.log("OTP email successfully generated and sent by backend. Result:", result);
    return result; // contains success, otp, resendAvailableAt, expiresAt
  } catch (error) {
    console.error("Failed to route OTP email via backend:", error);
    return null;
  }
}

export async function sendRegistrationEmail(player) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3005";
  const backendApiKey = process.env.BACKEND_API_KEY || "";

  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (backendApiKey) {
      headers["X-Internal-API-Key"] = backendApiKey;
    }

    const response = await fetch(`${backendUrl}/api/v1/send-ticket`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        player,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend send-ticket request failed:", errorText);
      return false;
    }

    const result = await response.json();
    console.log("Ticket email successfully routed to backend. Result:", result);
    return true;
  } catch (error) {
    console.error("Failed to route registration email via backend:", error);
    return false;
  }
}
