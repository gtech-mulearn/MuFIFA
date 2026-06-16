import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";
import { adjustSquadPoints } from "@/utils/squad";


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

    // Check if match is already rewarded
    let isRewarded = false;
    const cacheRewardedRes = await fetch(
      `${supabaseUrl}/rest/v1/match_cache?match_id=eq.rewarded_matches&select=match_data`,
      {
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      }
    );

    if (cacheRewardedRes.ok) {
      const rows = await cacheRewardedRes.json();
      if (rows.length > 0) {
        const rewardedList = rows[0].match_data?.match_ids || [];
        isRewarded = rewardedList.includes(String(matchId));
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedPredictions,
      isRewarded,
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

export async function POST(request) {
  try {
    const auth = requireRole(request, "superadmin", "admin");
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
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const { matchId } = body;
    if (!matchId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "matchId is required.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabaseHeaders = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // 1. Check if already rewarded
    let rewardedList = [];
    const cacheRewardedRes = await fetch(
      `${supabaseUrl}/rest/v1/match_cache?match_id=eq.rewarded_matches&select=match_data`,
      {
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      }
    );

    if (cacheRewardedRes.ok) {
      const rows = await cacheRewardedRes.json();
      if (rows.length > 0) {
        rewardedList = rows[0].match_data?.match_ids || [];
      }
    }

    if (rewardedList.includes(String(matchId))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "This match has already been rewarded.",
            details: null,
          },
        },
        { status: 409 }
      );
    }

    // 2. Fetch the match score from match_cache (WC_season key)
    const wcRes = await fetch(
      `${supabaseUrl}/rest/v1/match_cache?match_id=eq.WC_season&select=match_data`,
      {
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      }
    );

    if (!wcRes.ok) {
      throw new Error(`Failed to fetch WC matches cache: ${await wcRes.text()}`);
    }

    const wcRows = await wcRes.json();
    if (wcRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Match cache not found.",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    const matchData = wcRows[0].match_data;
    const match = matchData?.matches?.find(
      (m) => String(m.id) === String(matchId)
    );

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Match details not found in cache.",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    const actualHome = match.score?.fullTime?.home;
    const actualAway = match.score?.fullTime?.away;

    if (actualHome === null || actualHome === undefined || actualAway === null || actualAway === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Match scores are not fully available yet. Cannot award points.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    let actualOutcome = "draw";
    if (actualHome > actualAway) actualOutcome = "home_win";
    else if (actualAway > actualHome) actualOutcome = "away_win";

    // 3. Fetch ALL predictions for this match (select user_id, predicted_outcome, predicted_home_goals, predicted_away_goals)
    const predsRes = await fetch(
      `${supabaseUrl}/rest/v1/match_predictions?match_id=eq.${matchId}&select=user_id,predicted_outcome,predicted_home_goals,predicted_away_goals&limit=5000`,
      {
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      }
    );

    if (!predsRes.ok) {
      throw new Error(`Failed to fetch predictions: ${await predsRes.text()}`);
    }

    const predictions = await predsRes.json();

    if (predictions.length === 0) {
      // No predictions to award, but let's mark the match as rewarded anyway
      rewardedList.push(String(matchId));
      await fetch(`${supabaseUrl}/rest/v1/match_cache`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation,resolution=merge-duplicates",
        },
        body: JSON.stringify([
          {
            match_id: "rewarded_matches",
            match_data: { match_ids: rewardedList },
            fetched_at: new Date().toISOString(),
          },
        ]),
      });

      return NextResponse.json({
        success: true,
        message: "No predictions found. Match marked as rewarded.",
        awardedCount: 0,
      });
    }

    // 4. Fetch user registration data to get current points and team
    const userIds = [...new Set(predictions.map((p) => p.user_id).filter(Boolean))];
    const formattedIds = userIds.map(id => `"${id.replace(/"/g, '\\"')}"`).join(",");
    const usersRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?user_id=in.(${encodeURIComponent(formattedIds)})&select=id,user_id,name,team,mu_points`,
      {
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      }
    );

    if (!usersRes.ok) {
      throw new Error(`Failed to fetch user registrations: ${await usersRes.text()}`);
    }

    const users = await usersRes.json();
    const usersMap = {};
    users.forEach((u) => {
      usersMap[u.user_id] = u;
    });

    let awardedCount = 0;

    // 5. Update user points & squad points
    for (const pred of predictions) {
      const user = usersMap[pred.user_id];
      if (!user) continue;

      const predHome = Number(pred.predicted_home_goals);
      const predAway = Number(pred.predicted_away_goals);
      const predOutcome = pred.predicted_outcome;

      const isExactScore = (predHome === actualHome && predAway === actualAway);
      const isCorrectOutcome = (predOutcome === actualOutcome);

      let pointsDelta = -1;
      if (isExactScore) {
        pointsDelta = 25;
      } else if (isCorrectOutcome) {
        pointsDelta = 2;
      }

      const currentPoints = Number(user.mu_points || 0);
      const newPoints = Math.max(0, currentPoints + pointsDelta);

      // A. Update registration points
      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/registrations?id=eq.${user.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mu_points: newPoints }),
        }
      );

      if (!updateRes.ok) {
        console.error(`Failed to update points for user ${user.user_id}:`, await updateRes.text());
        continue;
      }

      // B. Update squad points
      const pointsDiff = newPoints - currentPoints;
      if (user.team && pointsDiff !== 0) {
        await adjustSquadPoints(supabaseUrl, supabaseKey, user.team, pointsDiff);
      }

      awardedCount++;
    }

    // 6. Add to rewarded matches cache list
    rewardedList.push(String(matchId));
    const finalCacheRes = await fetch(`${supabaseUrl}/rest/v1/match_cache`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify([
        {
          match_id: "rewarded_matches",
          match_data: { match_ids: rewardedList },
          fetched_at: new Date().toISOString(),
        },
      ]),
    });

    if (!finalCacheRes.ok) {
      throw new Error(`Failed to save rewarded matches list: ${await finalCacheRes.text()}`);
    }

    return NextResponse.json({
      success: true,
      message: `Points awarded successfully for ${awardedCount} players.`,
      awardedCount,
    });
  } catch (error) {
    console.error("Admin predictions award error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to award points to all.",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

