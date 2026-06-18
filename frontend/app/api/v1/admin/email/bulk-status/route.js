import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function GET(request) {
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

    // 2. Initialize global job status if empty
    if (!global.bulkEmailJob) {
      global.bulkEmailJob = {
        status: "idle",
        total: 0,
        sent: 0,
        failed: 0,
        error: null,
      };
    }

    return NextResponse.json({
      success: true,
      job: global.bulkEmailJob,
    });
  } catch (error) {
    console.error("[Bulk Email Status API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 }
    );
  }
}
