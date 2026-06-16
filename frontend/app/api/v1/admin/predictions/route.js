import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function GET(request) {
  try {
    const auth = requireRole(request, "superadmin", "admin", "viewer");
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

    const { searchParams } = new URL(request.url);

    const matchId = searchParams.get("match_id");
    if (!matchId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "match_id is required.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
    const limit = Math.max(1, Math.min(5000, isNaN(rawLimit) ? 20 : rawLimit));

    const rawOffset = parseInt(searchParams.get("offset") ?? "0", 10);
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const supabaseHeaders = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Fetch paginated prediction rows
    const dataRes = await fetch(
      `${supabaseUrl}/rest/v1/match_predictions?match_id=eq.${matchId}&select=user_id,predicted_outcome,predicted_home_goals,predicted_away_goals,created_at&order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      }
    );

    if (!dataRes.ok) {
      throw new Error(`Supabase error: ${await dataRes.text()}`);
    }

    const predictions = await dataRes.json();

    // Fetch total count via Content-Range header
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/match_predictions?match_id=eq.${matchId}&select=id`,
      {
        headers: {
          ...supabaseHeaders,
          Prefer: "count=exact",
        },
        next: { revalidate: 0 },
      }
    );

    // Parse Content-Range: "0-19/47" → total = 47
    const contentRange = countRes.headers.get("Content-Range") || "";
    const totalMatch = contentRange.match(/\/(\d+)$/);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;

    const hasMore = offset + predictions.length < total;

    // In-memory join: Fetch user profile info (name, email, team) from registrations
    let enrichedPredictions = predictions;
    const userIds = [...new Set(predictions.map((p) => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const formattedIds = userIds.map(id => `"${id.replace(/"/g, '\\"')}"`).join(",");
      const userRes = await fetch(
        `${supabaseUrl}/rest/v1/registrations?user_id=in.(${encodeURIComponent(formattedIds)})&select=id,user_id,name,email,team,mu_points`,
        {
          headers: supabaseHeaders,
          next: { revalidate: 0 },
        }
      );

      if (userRes.ok) {
        const users = await userRes.json();
        const usersMap = {};
        users.forEach((u) => {
          usersMap[u.user_id] = u;
        });

        enrichedPredictions = predictions.map((p) => ({
          ...p,
          user: usersMap[p.user_id] || {
            id: null,
            user_id: p.user_id,
            name: "Unknown Player",
            email: "N/A",
            team: "N/A",
            mu_points: 0,
          },
        }));
      } else {
        console.error("Failed to fetch registrations for predictions:", await userRes.text());
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedPredictions,
      pagination: {
        total,
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Admin predictions fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch predictions.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
