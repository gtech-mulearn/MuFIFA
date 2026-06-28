import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { fetchInSupabase } from "@/utils/supabase";

const PLAYER_COOKIE = "player_token";

// Initialize global cache if not present
if (!global.captainCache) {
  global.captainCache = new Map();
}

export async function GET(request) {
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
    };

    // 2. Fetch user's current role and team
    const userQuery = `${supabaseUrl}/rest/v1/registrations?id=eq.${decoded.id}&select=id,team,role,banned&limit=1`;
    const userRes = await fetch(userQuery, { method: "GET", headers });
    if (!userRes.ok) {
      throw new Error(`Failed to query user: ${await userRes.text()}`);
    }

    const userRows = await userRes.json();
    if (!userRows || userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    const player = userRows[0];

    // 3. Authorization check: must be captain or vice-captain
    if (player.role !== "captain" && player.role !== "vicecaptain") {
      return NextResponse.json(
        { success: false, error: "Access denied. Only team captains or vice-captains can access this page." },
        { status: 403 }
      );
    }

    if (!player.team) {
      return NextResponse.json(
        { success: false, error: "You are not currently assigned to any team." },
        { status: 400 }
      );
    }

    // 4. Read query parameters
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "not_joined";
    const search = searchParams.get("search") || "";

    // Cache check
    const cacheKey = `${player.team}:${filter}:${search}`;
    const cached = global.captainCache.get(cacheKey);
    const cacheExpiry = 60 * 60 * 1000; // 1 hour in ms

    if (cached && (Date.now() - cached.timestamp < cacheExpiry)) {
      return NextResponse.json({
        success: true,
        team: player.team,
        members: cached.data,
        fromCache: true,
      });
    }

    // 5. Build dynamic query for registrations
    const filterParts = [`team=eq.${encodeURIComponent(player.team)}`];
    
    if (filter === "joined") {
      filterParts.push("whatsapp_joined=eq.true");
    } else if (filter === "not_joined") {
      filterParts.push("whatsapp_joined=eq.false");
    }

    if (search) {
      const cleanSearch = search.trim().replace(/[.*(),]/g, "");
      if (cleanSearch.length > 0) {
        filterParts.push(`name=ilike.*${encodeURIComponent(cleanSearch)}*`);
      }
    }

    const filterQuery = filterParts.join("&");
    const membersQuery = `${supabaseUrl}/rest/v1/registrations?select=id,name,user_id,whatsapp_joined,role&order=name.asc&${filterQuery}`;
    const membersRes = await fetch(membersQuery, { method: "GET", headers });
    if (!membersRes.ok) {
      throw new Error(`Failed to fetch team members: ${await membersRes.text()}`);
    }

    const rawMembers = await membersRes.json();

    // Fetch completed tasks count for all team members in a single query
    const userIds = rawMembers.map((m) => m.user_id).filter(Boolean);
    const completionsCountMap = {};
    if (userIds.length > 0) {
      try {
        const completions = await fetchInSupabase(
          `${supabaseUrl}/rest/v1/user_completed_tasks`,
          "user_id",
          userIds,
          headers,
          "user_id,task_id"
        );
        completions.forEach((c) => {
          if (c.task_id !== 100) {
            completionsCountMap[c.user_id] = (completionsCountMap[c.user_id] || 0) + 1;
          }
        });
      } catch (err) {
        console.error("Failed to fetch completions count in members API:", err);
      }
    }

    const members = rawMembers.map((m) => ({
      id: m.id,
      name: m.name,
      user_id: m.user_id,
      whatsapp_joined: !!m.whatsapp_joined,
      role: m.role || "player",
      completed_tasks_count: completionsCountMap[m.user_id] || 0,
    }));


    // Save to global cache
    global.captainCache.set(cacheKey, {
      data: members,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      team: player.team,
      members,
      fromCache: false,
    });
  } catch (error) {
    console.error("Captain members GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
