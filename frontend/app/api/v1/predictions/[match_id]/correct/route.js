import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { match_id: matchId } = await params;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database not configured.",
            details: null,
          },
        },
        { status: 503 }
      );
    }

    const supabaseHeaders = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // 1. Fetch match score from match_cache (WC_season key)
    const cacheRes = await fetch(
      `${supabaseUrl}/rest/v1/match_cache?match_id=eq.WC_season&select=match_data,fetched_at&limit=1`,
      {
        method: "GET",
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      }
    );

    if (!cacheRes.ok) {
      throw new Error(`Supabase cache fetch failed: ${await cacheRes.text()}`);
    }

    const rows = await cacheRes.json();

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Match data not cached yet.",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    const matchData = rows[0].match_data;
    const match = matchData?.matches?.find(
      (m) => String(m.id) === String(matchId)
    );

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Match not found.",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    const actualHome = match.score?.fullTime?.home;
    const actualAway = match.score?.fullTime?.away;

    // If game has not completed or score is unavailable, return empty list
    if (actualHome === null || actualHome === undefined || actualAway === null || actualAway === undefined) {
      return NextResponse.json(
        {
          success: true,
          data: {
            match: {
              status: match.status,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              score: match.score,
            },
            correctPredictors: [],
          },
        },
        { status: 200 }
      );
    }

    let actualOutcome = "draw";
    if (actualHome > actualAway) actualOutcome = "home_win";
    else if (actualAway > actualHome) actualOutcome = "away_win";

    // 2. Fetch all predictions for this match
    const predictionsRes = await fetch(
      `${supabaseUrl}/rest/v1/match_predictions?match_id=eq.${matchId}&select=user_id,predicted_outcome,predicted_home_goals,predicted_away_goals&limit=5000`,
      {
        method: "GET",
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      }
    );

    if (!predictionsRes.ok) {
      throw new Error(`Supabase predictions fetch failed: ${await predictionsRes.text()}`);
    }

    const predictions = await predictionsRes.json();

    const correctPredictorsRaw = [];
    for (const p of predictions) {
      const predHome = Number(p.predicted_home_goals);
      const predAway = Number(p.predicted_away_goals);
      const predOutcome = p.predicted_outcome;

      const isExactScore = (predHome === actualHome && predAway === actualAway);
      const isCorrectOutcome = (predOutcome === actualOutcome);

      if (isExactScore) {
        correctPredictorsRaw.push({
          user_id: p.user_id,
          type: "exact_score",
          predictedScore: `${predHome} - ${predAway}`,
          points: 25,
        });
      }
    }

    // 3. Enrich with user registration profiles (name, team)
    let correctPredictors = [];
    const userIds = [...new Set(correctPredictorsRaw.map((p) => p.user_id).filter(Boolean))];
    
    if (userIds.length > 0) {
      const formattedIds = userIds.map(id => `"${id.replace(/"/g, '\\"')}"`).join(",");
      const userRes = await fetch(
        `${supabaseUrl}/rest/v1/registrations?user_id=in.(${encodeURIComponent(formattedIds)})&select=user_id,name,team`,
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

        correctPredictors = correctPredictorsRaw.map((p) => {
          const u = usersMap[p.user_id];
          return {
            ...p,
            name: u?.name || "Unknown Player",
            team: u?.team || null,
          };
        });
      } else {
        console.error("Failed to fetch registrations for correct predictors:", await userRes.text());
        correctPredictors = correctPredictorsRaw.map((p) => ({
          ...p,
          name: "Unknown Player",
          team: null,
        }));
      }
    }

    // 4. Sort: Exact Score (+25) first, then Correct Outcome (+2), then alphabetical by player name
    correctPredictors.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          match: {
            status: match.status,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            score: match.score,
          },
          correctPredictors,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET correct predictions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
