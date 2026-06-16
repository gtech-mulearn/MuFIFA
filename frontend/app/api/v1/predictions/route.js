import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { z } from "zod";

const PLAYER_COOKIE = "player_token";

const predictionSchema = z.object({
  match_id: z.string({ required_error: "match_id is required." }).min(1, "match_id is required."),
  predicted_outcome: z.enum(["home_win", "draw", "away_win"], {
    errorMap: () => ({ message: "predicted_outcome must be home_win, draw, or away_win." }),
  }),
  predicted_home_goals: z
    .number({
      required_error: "predicted_home_goals is required.",
      invalid_type_error: "predicted_home_goals must be a number.",
    })
    .int("predicted_home_goals must be an integer.")
    .min(0, "predicted_home_goals must be >= 0.")
    .max(20, "predicted_home_goals must be <= 20."),
  predicted_away_goals: z
    .number({
      required_error: "predicted_away_goals is required.",
      invalid_type_error: "predicted_away_goals must be a number.",
    })
    .int("predicted_away_goals must be an integer.")
    .min(0, "predicted_away_goals must be >= 0.")
    .max(20, "predicted_away_goals must be <= 20."),
});

export async function POST(request) {
  try {
    // Check for required env vars
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

    // a. Authenticate player via player_token cookie
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`)
    );

    if (!cookieMatch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
            details: null,
          },
        },
        { status: 401 }
      );
    }

    const token = cookieMatch[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "player") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
            details: null,
          },
        },
        { status: 401 }
      );
    }

    // Check points limit: if points are below 0, player cannot predict
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(decoded.user_id)}&select=mu_points&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!userRes.ok) {
      throw new Error(`Failed to fetch user points check: ${await userRes.text()}`);
    }

    const users = await userRes.json();
    const userPoints = Number(users?.[0]?.mu_points ?? 0);

    if (userPoints < 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You cannot place or edit predictions because your point balance is below 0.",
            details: null,
          },
        },
        { status: 403 }
      );
    }

    // Time-window check: Predictions and editing are only allowed between 10:00 AM and 6:00 PM IST
    const now = new Date();
    const istTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istTimeStr);
    const istHour = istDate.getHours();

    const isOpen = (istHour >= 10 && istHour < 18);

    if (!isOpen) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Predictions are only allowed between 10:00 AM and 6:00 PM IST.",
            details: null,
          },
        },
        { status: 403 }
      );
    }

    // b. Parse request body JSON
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

    // c. Validate with Zod schema
    const result = predictionSchema.safeParse(body);
    if (!result.success) {
      const details = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0];
        if (!details[field]) details[field] = [];
        details[field].push(err.message);
      });
      const firstError = result.error.errors[0]?.message || "Validation failed.";
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: firstError,
            details,
          },
        },
        { status: 400 }
      );
    }

    const {
      match_id,
      predicted_outcome,
      predicted_home_goals,
      predicted_away_goals,
    } = result.data;

    // d. Check outcome/goals consistency
    const isConsistent =
      (predicted_outcome === "home_win" && predicted_home_goals > predicted_away_goals) ||
      (predicted_outcome === "away_win" && predicted_away_goals > predicted_home_goals) ||
      (predicted_outcome === "draw" && predicted_home_goals === predicted_away_goals);

    if (!isConsistent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Score is inconsistent with the predicted outcome.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    // e. Fetch match from match_cache
    // The cache stores the entire WC season under a single key "WC_season".
    // We look up that row and then find the specific match inside match_data.matches.
    const matchId = match_id;
    const cacheRes = await fetch(
      `${supabaseUrl}/rest/v1/match_cache?match_id=eq.WC_season&select=match_data,fetched_at&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
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
            message: "Match data not cached yet. Please reload the page.",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    // f. Check match status — cache stores the full API response { matches: [...] }
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
            message: "Match not found. Please reload the page.",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    const OPEN_STATUSES = ["SCHEDULED", "TIMED"];
    if (!OPEN_STATUSES.includes(match.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNPROCESSABLE_ENTITY",
            message: "Predictions are closed for this match.",
            details: null,
          },
        },
        { status: 422 }
      );
    }

    // g. UPSERT into match_predictions
    // on_conflict tells PostgREST which unique constraint to use for merge-duplicates
    const upsertRes = await fetch(
      `${supabaseUrl}/rest/v1/match_predictions?on_conflict=match_id,user_id`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation,resolution=merge-duplicates",
        },
        body: JSON.stringify([
          {
            match_id: String(matchId),
            user_id: decoded.user_id,
            predicted_outcome,
            predicted_home_goals,
            predicted_away_goals,
            updated_at: new Date().toISOString(),
          },
        ]),
      }
    );

    if (!upsertRes.ok) {
      throw new Error(`Supabase upsert failed: ${await upsertRes.text()}`);
    }

    const savedRows = await upsertRes.json();
    const savedRow = Array.isArray(savedRows) ? savedRows[0] : savedRows;

    // h. Return success
    return NextResponse.json(
      {
        success: true,
        data: savedRow,
      },
      { status: 200 }
    );
  } catch (error) {
    // i. Catch-all
    console.error("Prediction POST error:", error);
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
