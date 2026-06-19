import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "desc";

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
        { status: 503 },
      );
    }

    const selectFields =
      "id,name,user_id,team,domain,mu_points,avatar_url,created_at";

    const orderDirection = sort === "asc" ? "asc" : "desc";
    let query = `${supabaseUrl}/rest/v1/registrations?select=${selectFields}&order=mu_points.${orderDirection},name.asc&limit=${limit}&offset=${offset}`;

    if (search.trim()) {
      const cleanSearch = search.trim();
      query += `&or=(name.ilike.*${encodeURIComponent(cleanSearch)}*,user_id.ilike.*${encodeURIComponent(cleanSearch)}*)`;
    }

    const res = await fetch(query, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "count=exact",
      },
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      throw new Error(`Supabase query failed: ${await res.text()}`);
    }

    const players = await res.json();

    // Parse total count from Content-Range header
    const contentRange = res.headers.get("content-range");
    let totalCount = players.length + offset;
    if (contentRange) {
      const parts = contentRange.split("/");
      if (parts.length === 2) {
        totalCount = parseInt(parts[1], 10);
      }
    }

    return NextResponse.json({
      success: true,
      data: players,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + players.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Fetch individual standings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 },
    );
  }
}
