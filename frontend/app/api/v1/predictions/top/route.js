import { NextResponse } from "next/server";

// Cache object stored on the Node global namespace to persist across hot-reloads
if (!global.topPredictorsCache_v2) {
  global.topPredictorsCache_v2 = {
    data: null,
    expiresAt: 0,
  };
}

const CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || "";

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

    const supabaseHeaders = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    const now = Date.now();
    const cache = global.topPredictorsCache_v2;

    // Refresh cache if expired or empty
    if (!cache.data || now > cache.expiresAt) {
      // 1. Fetch all registrations and predictions concurrently (with 5-minute Next.js caching)
      const [registrationsRes, predictionsRes] = await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/registrations?select=user_id,name,team,avatar_url,domain&limit=5000`,
          {
            method: "GET",
            headers: supabaseHeaders,
            next: { revalidate: 300 },
          }
        ),
        fetch(
          `${supabaseUrl}/rest/v1/match_predictions?select=user_id,outcome&limit=10000`,
          {
            method: "GET",
            headers: supabaseHeaders,
            next: { revalidate: 300 },
          }
        ),
      ]);

      if (!registrationsRes.ok) {
        throw new Error(
          `Failed to fetch registrations: ${await registrationsRes.text()}`
        );
      }
      if (!predictionsRes.ok) {
        throw new Error(
          `Failed to fetch predictions: ${await predictionsRes.text()}`
        );
      }

      const [registrations, predictions] = await Promise.all([
        registrationsRes.json(),
        predictionsRes.json(),
      ]);

      const usersMap = {};
      registrations.forEach((r) => {
        if (r.user_id) {
          usersMap[r.user_id] = r;
        }
      });

      // 3. Aggregate predictions by user
      const statsMap = {};

      predictions.forEach((p) => {
        const userId = p.user_id;
        if (!userId) return;

        if (!statsMap[userId]) {
          statsMap[userId] = {
            userId,
            totalPredictions: 0,
            evaluatedPredictions: 0,
            correctPredictions: 0,
            exactPredictions: 0,
            correctOutcomePredictions: 0,
            incorrectPredictions: 0,
            predictionPoints: 0,
          };
        }

        const stats = statsMap[userId];
        stats.totalPredictions++;

        if (p.outcome) {
          stats.evaluatedPredictions++;
          if (p.outcome === "exact") {
            stats.exactPredictions++;
            stats.correctPredictions++;
            stats.predictionPoints += 25;
          } else if (p.outcome === "correct_outcome") {
            stats.correctOutcomePredictions++;
            stats.correctPredictions++;
            stats.predictionPoints += 2;
          } else if (p.outcome === "incorrect") {
            stats.incorrectPredictions++;
            stats.predictionPoints -= 1;
          }
        }
      });

      // 4. Combine with user registrations and build final list
      const topPredictors = [];

      Object.keys(statsMap).forEach((userId) => {
        const stats = statsMap[userId];
        const user = usersMap[userId];

        // Calculate accuracy
        const accuracy = stats.evaluatedPredictions > 0
          ? Math.round((stats.correctPredictions / stats.evaluatedPredictions) * 100)
          : 0;

        topPredictors.push({
          user_id: userId,
          name: user?.name || "Unknown Player",
          team: user?.team || null,
          avatar_url: user?.avatar_url || null,
          institution: user?.institution || "N/A",
          domain: user?.domain || "N/A",
          ...stats,
          accuracy,
        });
      });

      // 5. Sort:
      // - Prediction Points DESC (sort as point-wise)
      // - Exact Predictions DESC
      // - Correct Predictions DESC
      // - Name ASC (case-insensitive)
      topPredictors.sort((a, b) => {
        if (b.predictionPoints !== a.predictionPoints) {
          return b.predictionPoints - a.predictionPoints;
        }
        if (b.exactPredictions !== a.exactPredictions) {
          return b.exactPredictions - a.exactPredictions;
        }
        if (b.correctPredictions !== a.correctPredictions) {
          return b.correctPredictions - a.correctPredictions;
        }
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });

      // Save to global cache
      cache.data = topPredictors;
      cache.expiresAt = now + CACHE_DURATION_MS;
      console.log(`[Top Predictors Cache] Refreshed in-memory data. Expiry in 3 hours.`);
    }

    // Serve from cache
    let filteredList = cache.data;

    // Apply search filter if present
    if (search.trim()) {
      const cleanSearch = search.trim().toLowerCase();
      filteredList = filteredList.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanSearch) ||
          p.user_id.toLowerCase().includes(cleanSearch)
      );
    }

    // Slice for pagination
    const paginatedList = filteredList.slice(offset, offset + limit);
    const hasMore = offset + paginatedList.length < filteredList.length;

    return NextResponse.json(
      {
        success: true,
        data: paginatedList,
        pagination: {
          total: filteredList.length,
          limit,
          offset,
          hasMore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET top predictors error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
