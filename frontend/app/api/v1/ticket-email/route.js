import { NextResponse } from "next/server";
import { sendRegistrationEmail } from "@/utils/email";

function jsonError(status, code, message, details = null) {
  return NextResponse.json(
    { success: false, error: { code, message, details } },
    { status }
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || !body.email || !body.user_id) {
      return jsonError(
        400,
        "BAD_REQUEST",
        "Missing required player details (email, user_id)."
      );
    }

    const success = await sendRegistrationEmail(body);
    if (!success) {
      return jsonError(
        500,
        "EMAIL_SEND_FAILED",
        "Failed to dispatch ticket email."
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ticket email dispatch requested successfully.",
    });
  } catch (error) {
    console.error("[Ticket Email API] Error:", error);
    return jsonError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred."
    );
  }
}
