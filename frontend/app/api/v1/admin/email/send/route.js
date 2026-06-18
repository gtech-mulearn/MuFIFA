import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";
import { sendCustomAdminEmail } from "@/utils/email";

// Initialize the global bulk email job state if not already set
if (!global.bulkEmailJob) {
  global.bulkEmailJob = {
    status: "idle", // "idle" | "sending" | "completed" | "failed"
    total: 0,
    sent: 0,
    failed: 0,
    error: null,
  };
}

// Background bulk email dispatch task
async function runBulkEmailJob(users, subject, title, message) {
  global.bulkEmailJob = {
    status: "sending",
    total: users.length,
    sent: 0,
    failed: 0,
    error: null,
  };

  console.log(`[Bulk Email Job] Starting campaign for ${users.length} recipients...`);

  for (const user of users) {
    if (global.bulkEmailJob.status !== "sending") {
      console.log(`[Bulk Email Job] Campaign halted or cancelled.`);
      break;
    }

    try {
      const success = await sendCustomAdminEmail({
        email: user.email,
        name: user.name,
        subject,
        title,
        body: message,
      });

      if (success) {
        global.bulkEmailJob.sent++;
      } else {
        global.bulkEmailJob.failed++;
      }
    } catch (err) {
      console.error(`[Bulk Email Job] Failed sending to ${user.email}:`, err);
      global.bulkEmailJob.failed++;
    }

    // Delay 1.5 seconds between emails to protect SMTP rate limits
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  global.bulkEmailJob.status = "completed";
  console.log(`[Bulk Email Job] Bulk campaign completed. Sent: ${global.bulkEmailJob.sent}, Failed: ${global.bulkEmailJob.failed}.`);
}

export async function POST(request) {
  try {
    // 1. Authenticate Admin/Superadmin
    const auth = requireRole(request, "admin", "superadmin");
    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
            message: auth.message,
            details: null,
          },
        },
        { status: auth.status }
      );
    }

    // 2. Parse request JSON body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Malformed JSON body.",
          },
        },
        { status: 400 }
      );
    }

    const { userId, subject, title, message } = body;

    // Validate parameters
    if (!userId || !subject || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required fields (userId, subject, title, message).",
          },
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database credentials are not configured.",
          },
        },
        { status: 503 }
      );
    }

    const supabaseHeaders = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // 3. Handle Bulk Sending Option
    if (userId === "@all") {
      // Check if a bulk job is already in progress
      if (global.bulkEmailJob.status === "sending") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "A bulk email campaign is currently in progress. Please wait for it to complete.",
            },
          },
          { status: 409 }
        );
      }

      // Fetch all registered users
      const usersRes = await fetch(
        `${supabaseUrl}/rest/v1/registrations?select=name,email&limit=5000`,
        {
          method: "GET",
          headers: supabaseHeaders,
          next: { revalidate: 0 },
        }
      );

      if (!usersRes.ok) {
        throw new Error(`Failed to fetch users: ${await usersRes.text()}`);
      }

      const rawUsers = await usersRes.json();
      const usersWithEmails = rawUsers.filter((u) => u.email && u.email.trim());

      if (usersWithEmails.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UNPROCESSABLE_ENTITY",
              message: "No users with valid email addresses found to send to.",
            },
          },
          { status: 422 }
        );
      }

      // Start the job in the background asynchronously (no await!)
      runBulkEmailJob(usersWithEmails, subject.trim(), title.trim(), message.trim());

      return NextResponse.json({
        success: true,
        message: `Bulk email campaign initiated for ${usersWithEmails.length} players.`,
        total: usersWithEmails.length,
      });
    }

    // 4. Handle Single Recipient Send Option
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(userId)}&select=name,email&limit=1`,
      {
        method: "GET",
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      }
    );

    if (!userRes.ok) {
      throw new Error(`Failed to fetch user registration: ${await userRes.text()}`);
    }

    const users = await userRes.json();
    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Recipient user not found.",
          },
        },
        { status: 404 }
      );
    }

    const recipient = users[0];

    if (!recipient.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNPROCESSABLE_ENTITY",
            message: "Recipient does not have a registered email address.",
          },
        },
        { status: 422 }
      );
    }

    const success = await sendCustomAdminEmail({
      email: recipient.email,
      name: recipient.name,
      subject,
      title,
      body: message,
    });

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_SEND_FAILED",
            message: "Failed to dispatch custom email. Check SMTP server configuration.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email successfully sent to ${recipient.name} (${recipient.email}).`,
    });
  } catch (error) {
    console.error("[Admin Send Email API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
