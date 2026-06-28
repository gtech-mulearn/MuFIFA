import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { fetchAllSupabase } from "@/utils/supabase";

const PLAYER_COOKIE = "player_token";

function calculateOdds(predictions) {
  const counts = { home_win: 0, draw: 0, away_win: 0 };
  for (const p of predictions) {
    if (p.predicted_outcome in counts) {
      counts[p.predicted_outcome]++;
    } else {
      // Corrupted outcome value — this should not happen in normal operation
      // The caller handles the 500 response for this case
      return null;
    }
  }
  const total = counts.home_win + counts.draw + counts.away_win;
  if (total === 0) {
    return { odds: { home_win: 33.3, draw: 33.3, away_win: 33.3 }, total: 0 };
  }
  return {
    odds: {
      home_win: Math.round((counts.home_win / total) * 1000) / 10,
      draw: Math.round((counts.draw / total) * 1000) / 10,
      away_win: Math.round((counts.away_win / total) * 1000) / 10,
    },
    total,
  };
}

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

    // Fetch all predictions for this match (only predicted_outcome needed for odds)
    const rows = await fetchAllSupabase(
      `${supabaseUrl}/rest/v1/match_predictions?match_id=eq.${matchId}&select=predicted_outcome`,
      supabaseHeaders,
      { fetchOptions: { next: { revalidate: 0 } } }
    );


    // Check for corrupted predicted_outcome values
    const validOutcomes = ["home_win", "draw", "away_win"];
    const hasCorrupted = rows.some((p) => !validOutcomes.includes(p.predicted_outcome));
    if (hasCorrupted) {
      console.error("Corrupted predicted_outcome in DB for match", matchId, rows);
      return NextResponse.json(
        {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected data error occurred.",
          details: null,
        },
        { status: 500 }
      );
    }

    // Calculate odds from the aggregated predictions
    const oddsResult = calculateOdds(rows);
    if (oddsResult === null) {
      console.error("Corrupted predicted_outcome in DB for match", matchId, rows);
      return NextResponse.json(
        {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected data error occurred.",
          details: null,
        },
        { status: 500 }
      );
    }

    const { odds, total } = oddsResult;

    // Optionally read player cookie for myPrediction
    let myPrediction = null;

    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`)
    );

    if (cookieMatch) {
      const token = cookieMatch[1];
      const decoded = verifyToken(token);

      if (decoded && decoded.user_id) {
        const myPredictionRes = await fetch(
          `${supabaseUrl}/rest/v1/match_predictions?match_id=eq.${matchId}&user_id=eq.${decoded.user_id}&select=*&limit=1`,
          {
            method: "GET",
            headers: supabaseHeaders,
            next: { revalidate: 0 },
          }
        );

        if (myPredictionRes.ok) {
          const myRows = await myPredictionRes.json();
          myPrediction = myRows[0] || null;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { odds, total, myPrediction },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET predictions error:", error);
    return NextResponse.json(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
        details: null,
      },
      { status: 500 }
    );
  }
}
