import { NextResponse } from "next/server";

const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

const DOMAINS = ["Maker", "Creative", "Coder", "Strategist"];
const TEAMS = [
  "Brazil",
  "Argentina",
  "Portugal",
  "Germany",
  "France",
  "England",
  "Spain",
  "Netherlands",
  "Belgium",
  "Croatia",
  "Uruguay",
  "Japan",
];

function isRateLimited(ip) {
  const now = Date.now();
  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, []);
  }
  const timestamps = rateLimitCache.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitCache.set(ip, timestamps);
  if (timestamps.length >= MAX_REQUESTS) {
    return true;
  }
  timestamps.push(now);
  return false;
}

async function incrementSquadPoints(supabaseUrl, supabaseKey, team, pointsToAdd = 10) {
  try {
    // 1. Try RPC first (atomic)
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/increment_squad_points`;
    const rpcRes = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        squad_name: team,
        points_to_add: pointsToAdd,
      }),
    });

    if (rpcRes.ok) {
      console.log(`Successfully incremented points for squad ${team} via RPC.`);
      return true;
    }

    const errorText = await rpcRes.text();
    console.warn(`RPC increment failed (status ${rpcRes.status}): ${errorText}. Falling back to Read-Modify-Write.`);
    
    // 2. Fallback: Fetch current points
    const getUrl = `${supabaseUrl}/rest/v1/squads?select=points&name=eq.${encodeURIComponent(team)}`;
    const getRes = await fetch(getUrl, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    if (!getRes.ok) {
      throw new Error(`Failed to fetch squad points: ${await getRes.text()}`);
    }

    const rows = await getRes.json();
    if (!rows || rows.length === 0) {
      throw new Error(`Squad not found: ${team}`);
    }

    const currentPoints = rows[0].points || 0;
    const newPoints = currentPoints + pointsToAdd;

    // 3. Fallback: Patch new points
    const patchUrl = `${supabaseUrl}/rest/v1/squads?name=eq.${encodeURIComponent(team)}`;
    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        points: newPoints,
      }),
    });

    if (!patchRes.ok) {
      throw new Error(`Failed to update squad points: ${await patchRes.text()}`);
    }

    console.log(`Successfully updated points for squad ${team} to ${newPoints} via PATCH fallback.`);
    return true;
  } catch (err) {
    console.error(`Error in incrementSquadPoints for squad ${team}:`, err);
    return false;
  }
}

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    if (isRateLimited(ip)) {
      return NextResponse.json({
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Too many registration attempts. Please try again after 1 minute.",
          details: null,
        },
      }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Malformed JSON body.",
          details: null,
        },
      }, { status: 400 });
    }

    const { name, email, phone, domain, team } = body || {};

    const errors = {};
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      errors.name = ["Name must be between 2 and 100 characters."];
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = ["Please enter a valid email address."];
    }
    if (!phone || typeof phone !== "string" || !/^(?:\+91|91|0)?[6-9]\d{9}$/.test(phone.trim())) {
      errors.phone = ["Please enter a valid 10-digit Indian phone number."];
    }
    if (!domain || !DOMAINS.includes(domain)) {
      errors.domain = ["Invalid domain selected."];
    }
    if (!team || !TEAMS.includes(team)) {
      errors.team = ["Invalid team selected."];
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request parameters failed validation.",
          details: errors,
        },
      }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const userId = trimmedEmail.split("@")[0];

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Database credentials are not configured in environment variables.",
          details: null,
        },
      }, { status: 503 });
    }

    // Call Supabase REST API directly (no client dependency needed)
    const targetUrl = `${supabaseUrl}/rest/v1/registrations`;
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify([{
        name: trimmedName,
        email: trimmedEmail,
        user_id: userId,
        phone: trimmedPhone,
        domain,
        team,
        mu_points: 10,
      }]),
    });

    if (!res.ok) {
      const errorText = await res.text();
      if (res.status === 409 || errorText.includes("duplicate") || errorText.includes("unique")) {
        return NextResponse.json({
          success: false,
          error: {
            code: "CONFLICT_ERROR",
            message: "This email address or user ID has already been registered.",
            details: null,
          },
        }, { status: 409 });
      }
      throw new Error(`Supabase REST error: ${errorText}`);
    }

    const data = await res.json();

    // Increment points for the selected team
    await incrementSquadPoints(supabaseUrl, supabaseKey, team, 10);

    return NextResponse.json({
      success: true,
      message: "Registration completed successfully.",
      data: data[0],
    }, { status: 201 });

  } catch (error) {
    console.error("Next.js registration API error:", error);
    return NextResponse.json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
        details: null,
      },
    }, { status: 500 });
  }
}
