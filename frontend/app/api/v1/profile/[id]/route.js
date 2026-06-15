import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Player ID parameter is required.",
          },
        },
        { status: 400 }
      );
    }

    const cleanId = id.trim().startsWith("@") ? id.trim().slice(1) : id.trim();

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

    const selectFields = "id,name,user_id,team,domain,mu_points,avatar_url,created_at";

    // 1. Try to find the user by user_id (username)
    let query = `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(cleanId)}&select=${selectFields}&limit=1`;
    let res = await fetch(query, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Supabase query for user_id failed: ${await res.text()}`);
    }

    let rows = await res.json();

    // 2. If not found, check if cleanId could be a database ID (UUID or numeric)
    if (!rows || rows.length === 0) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      const isInteger = /^\d+$/.test(cleanId);

      if (isUuid || isInteger) {
        query = `${supabaseUrl}/rest/v1/registrations?id=eq.${encodeURIComponent(cleanId)}&select=${selectFields}&limit=1`;
        res = await fetch(query, {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Supabase query for id failed: ${await res.text()}`);
        }

        rows = await res.json();
      }
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Player profile not found.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get player profile error:", error);
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
