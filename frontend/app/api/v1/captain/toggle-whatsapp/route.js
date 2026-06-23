import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

export async function POST(request) {
  try {
    // 1. Authenticate user
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`));
    if (!match) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = match[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      );
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    // 2. Fetch captain's current role and team
    const captainQuery = `${supabaseUrl}/rest/v1/registrations?id=eq.${decoded.id}&select=id,team,role,banned&limit=1`;
    const captainRes = await fetch(captainQuery, { method: "GET", headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
    if (!captainRes.ok) {
      throw new Error(`Failed to query captain: ${await captainRes.text()}`);
    }

    const captainRows = await captainRes.json();
    if (!captainRows || captainRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Captain profile not found" },
        { status: 404 }
      );
    }

    const captain = captainRows[0];

    // 3. Authorization check: must be captain or vice-captain
    if (captain.role !== "captain" && captain.role !== "vicecaptain") {
      return NextResponse.json(
        { success: false, error: "Access denied. Only team captains or vice-captains can perform this action." },
        { status: 403 }
      );
    }

    if (!captain.team) {
      return NextResponse.json(
        { success: false, error: "You are not assigned to any team." },
        { status: 400 }
      );
    }

    // 4. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON body" },
        { status: 400 }
      );
    }

    const { memberId, joined } = body;
    if (memberId === undefined || joined === undefined) {
      return NextResponse.json(
        { success: false, error: "memberId and joined fields are required" },
        { status: 400 }
      );
    }

    // 5. Verify target member exists and is in the captain's team
    const memberQuery = `${supabaseUrl}/rest/v1/registrations?id=eq.${memberId}&select=id,team`;
    const memberRes = await fetch(memberQuery, { method: "GET", headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
    if (!memberRes.ok) {
      throw new Error(`Failed to fetch target member: ${await memberRes.text()}`);
    }

    const memberRows = await memberRes.json();
    if (!memberRows || memberRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Target member not found" },
        { status: 404 }
      );
    }

    const member = memberRows[0];
    if (member.team !== captain.team) {
      return NextResponse.json(
        { success: false, error: "Forbidden. You can only toggle status for members of your own team." },
        { status: 403 }
      );
    }

    // 6. Update target member's whatsapp_joined status in Supabase
    const updateUrl = `${supabaseUrl}/rest/v1/registrations?id=eq.${member.id}`;
    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        whatsapp_joined: !!joined,
      }),
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update member status: ${await updateRes.text()}`);
    }

    // 7. Evict the team's members list cache for all search/filter keys
    if (global.captainCache) {
      for (const key of global.captainCache.keys()) {
        if (key.startsWith(`${captain.team}:`)) {
          global.captainCache.delete(key);
        }
      }
    }

    return NextResponse.json({
      success: true,
      whatsapp_joined: !!joined,
    });
  } catch (error) {
    console.error("Captain toggle-whatsapp error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
