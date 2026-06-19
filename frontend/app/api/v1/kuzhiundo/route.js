import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

// Define schema for input validation using Zod
const SearchQuerySchema = z.object({
  q: z
    .string({
      required_error: "Search query parameter 'q' or 'search' is required.",
    })
    .trim()
    .min(3, "Search query must be at least 3 characters long.")
    .max(100, "Search query cannot exceed 100 characters."),
  limit: z
    .preprocess(
      (val) => (val ? parseInt(val, 10) : undefined),
      z.number().int().min(1).max(50),
    )
    .default(10),
});

// Timing-safe comparison of API keys using SHA-256 hashing first to prevent length leaks
function isValidApiKey(providedKey, expectedKey) {
  if (!providedKey || !expectedKey) return false;

  const hashProvided = crypto.createHash("sha256").update(providedKey).digest();
  const hashExpected = crypto.createHash("sha256").update(expectedKey).digest();

  return crypto.timingSafeEqual(hashProvided, hashExpected);
}

export async function GET(request) {
  try {
    // 1. Verify API Key
    const expectedKey = process.env.EXTERNAL_SEARCH_API_KEY;
    if (!expectedKey) {
      console.error(
        "[Search API] Config Error: EXTERNAL_SEARCH_API_KEY is not defined.",
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFIGURATION_ERROR",
            message: "API key is not configured on server.",
          },
        },
        { status: 500 },
      );
    }

    const apiKeyHeader = request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");
    let providedKey = apiKeyHeader;

    if (
      !providedKey &&
      authHeader &&
      authHeader.toLowerCase().startsWith("bearer ")
    ) {
      providedKey = authHeader.substring(7);
    }

    if (!providedKey || !isValidApiKey(providedKey, expectedKey)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing API key.",
          },
        },
        { status: 401 },
      );
    }

    // 2. Parse and Validate Query Parameters using Zod
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || searchParams.get("search") || "";
    const limitParam = searchParams.get("limit") || undefined;

    const validationResult = SearchQuerySchema.safeParse({
      q,
      limit: limitParam,
    });

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request parameters failed validation.",
            details: fieldErrors,
          },
        },
        { status: 400 },
      );
    }

    const { q: cleanQuery, limit } = validationResult.data;

    // 3. Check Supabase Configurations
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "[Search API] Config Error: Supabase credentials are not configured.",
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database not configured.",
          },
        },
        { status: 503 },
      );
    }

    // 4. Query Database (Optimized: select only required fields and limit rows using concurrent queries)
    const selectFields = "id,name,user_id,email,avatar_url,team";
    const encodedQuery = encodeURIComponent(cleanQuery);

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    const fetchFromDb = async (url) => {
      const res = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Database query failed: ${await res.text()}`);
      }
      return res.json();
    };

    // 1. Try prefix search on name, email, user_id concurrently (high chance of index hits)
    const namePrefixUrl = `${supabaseUrl}/rest/v1/registrations?select=${selectFields}&name=ilike.${encodedQuery}*&limit=${limit}`;
    const emailPrefixUrl = `${supabaseUrl}/rest/v1/registrations?select=${selectFields}&email=ilike.${encodedQuery}*&limit=${limit}`;
    const userIdPrefixUrl = `${supabaseUrl}/rest/v1/registrations?select=${selectFields}&user_id=ilike.${encodedQuery}*&limit=${limit}`;

    let users = [];
    try {
      const [nameUsers, emailUsers, userIdUsers] = await Promise.all([
        fetchFromDb(namePrefixUrl),
        fetchFromDb(emailPrefixUrl),
        fetchFromDb(userIdPrefixUrl),
      ]);

      // Merge and deduplicate by user id
      const uniqueUsers = new Map();
      [...nameUsers, ...emailUsers, ...userIdUsers].forEach((u) => {
        uniqueUsers.set(u.id, u);
      });
      users = Array.from(uniqueUsers.values()).slice(0, limit);
    } catch (dbErr) {
      console.error("[Search API] Prefix query failed:", dbErr);
      throw dbErr;
    }

    // 2. Fallback: if no prefix matches, run substring search concurrently
    if (users.length === 0) {
      const nameSubUrl = `${supabaseUrl}/rest/v1/registrations?select=${selectFields}&name=ilike.*${encodedQuery}*&limit=${limit}`;
      const emailSubUrl = `${supabaseUrl}/rest/v1/registrations?select=${selectFields}&email=ilike.*${encodedQuery}*&limit=${limit}`;
      const userIdSubUrl = `${supabaseUrl}/rest/v1/registrations?select=${selectFields}&user_id=ilike.*${encodedQuery}*&limit=${limit}`;

      try {
        const [nameUsers, emailUsers, userIdUsers] = await Promise.all([
          fetchFromDb(nameSubUrl),
          fetchFromDb(emailSubUrl),
          fetchFromDb(userIdSubUrl),
        ]);

        const uniqueUsers = new Map();
        [...nameUsers, ...emailUsers, ...userIdUsers].forEach((u) => {
          uniqueUsers.set(u.id, u);
        });
        users = Array.from(uniqueUsers.values()).slice(0, limit);
      } catch (dbErr) {
        console.error("[Search API] Substring query failed:", dbErr);
        throw dbErr;
      }
    }

    // 5. Map results to requested format
    const results = users.map((user) => ({
      id: user.id,
      name: user.name,
      user_id: user.user_id,
      email: user.email,
      avatar_url: user.avatar_url,
      team: user.team,
    }));

    // 6. Return response with caching disabled
    return NextResponse.json(
      {
        success: true,
        data: results,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("[Search API] Unexpected error:", error);
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
