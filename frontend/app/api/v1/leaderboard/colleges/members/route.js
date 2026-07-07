import { NextResponse } from "next/server";
import { fetchAllSupabase } from "@/utils/supabase";

// Cache for members of each college, mapped by lowercase college name. Cache TTL set to 1 hour.
const _membersCache = new Map();
const CACHE_TTL_MS = 3_600_000;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collegeName = searchParams.get("college") || "";

    if (!collegeName.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "College name parameter is required.",
          },
        },
        { status: 400 },
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
        { status: 503 },
      );
    }

    const lookupKey = collegeName.trim().toLowerCase();
    const now = Date.now();

    // Serves cached members if within the one-hour freshness window.
    if (_membersCache.has(lookupKey)) {
      const cached = _membersCache.get(lookupKey);
      if (now - cached.ts < CACHE_TTL_MS) {
        return NextResponse.json({
          success: true,
          data: cached.data,
        });
      }
    }

    // Fetch members registered in the specified college case-insensitively using ilike.
    // Order by mu_points descending, then by name ascending.
    const queryUrl = `${supabaseUrl}/rest/v1/registrations?select=id,name,user_id,institutions,mu_points,team,avatar_url,tasks&team=neq.Test&institutions=ilike.${encodeURIComponent(collegeName.trim())}&order=mu_points.desc,name.asc`;

    const members = await fetchAllSupabase(queryUrl, {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    });

    // Save sorted members to the cache
    _membersCache.set(lookupKey, { data: members, ts: now });

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Fetch college members error:", error);
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
