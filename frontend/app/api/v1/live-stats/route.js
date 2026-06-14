import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Database credentials are not configured in environment variables.",
          details: null,
        },
      }, { status: 503 });
    }

    // Call Supabase REST API directly (no client dependency needed)
    const targetUrl = `${supabaseUrl}/rest/v1/registrations?select=user_id,team`;
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 0 }, // Prevent caching
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Supabase REST error: ${errorText}`);
    }

    const registrations = await res.json();

    const organisation_count = {};
    registrations.forEach((r) => {
      if (r.team) {
        organisation_count[r.team] = (organisation_count[r.team] || 0) + 1;
      }
    });

    const referral_analytics = {};
    registrations.forEach((r) => {
      if (r.user_id) {
        referral_analytics[r.user_id] = (referral_analytics[r.user_id] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      response: {
        organisation_count,
        referral_analytics,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Next.js live-stats API error:", error);
    return NextResponse.json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while compiling live stats.",
        details: null,
      },
    }, { status: 500 });
  }
}
