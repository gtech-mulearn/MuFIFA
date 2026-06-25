import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { fetchAllSupabase } from "@/utils/supabase";

const PLAYER_COOKIE = "player_token";

export async function GET(request) {
  try {
    // 1. Authenticate requester
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`));
    if (!match) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const token = match[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // 2. Fetch requester role & team
    const userQuery = `${supabaseUrl}/rest/v1/registrations?id=eq.${decoded.id}&select=id,team,role&limit=1`;
    const userRes = await fetch(userQuery, { method: "GET", headers });
    if (!userRes.ok) {
      throw new Error(`Failed to query requester: ${await userRes.text()}`);
    }
    const userRows = await userRes.json();
    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ success: false, error: "Requester profile not found" }, { status: 404 });
    }
    const captain = userRows[0];

    // Access check: must be captain or vice-captain
    if (captain.role !== "captain" && captain.role !== "vicecaptain") {
      return NextResponse.json({ success: false, error: "Access denied. Only captains/vice-captains can query member tasks." }, { status: 403 });
    }

    // Get target member ID from search params
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId"); // The user_id (username) of the member
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Member user_id is required." }, { status: 400 });
    }

    // 3. Fetch target member details to verify same team
    const memberQuery = `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(targetUserId)}&select=id,name,team,user_id&limit=1`;
    const memberRes = await fetch(memberQuery, { method: "GET", headers });
    if (!memberRes.ok) {
      throw new Error(`Failed to query member details: ${await memberRes.text()}`);
    }
    const memberRows = await memberRes.json();
    if (!memberRows || memberRows.length === 0) {
      return NextResponse.json({ success: false, error: "Member profile not found" }, { status: 404 });
    }
    const member = memberRows[0];

    if (member.team !== captain.team) {
      return NextResponse.json({ success: false, error: "Access denied. Member belongs to a different team." }, { status: 403 });
    }

    // 4. Fetch all tasks and completed tasks concurrently using fetchAllSupabase
    const [tasks, completions] = await Promise.all([
      fetchAllSupabase(`${supabaseUrl}/rest/v1/tasks?select=id,title,mupoint,category,verification`, headers),
      fetchAllSupabase(`${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(member.user_id)}&select=task_id,points_awarded,completed_at`, headers)
    ]);

    // Map completions by task_id
    const completionsMap = {};
    completions.forEach((c) => {
      completionsMap[c.task_id] = c;
    });

    // Match tasks with completion data
    const completedTasks = [];
    tasks.forEach((t) => {
      const comp = completionsMap[t.id];
      if (comp) {
        let hashtag = "";
        if (t.verification && typeof t.verification === "string" && t.verification.startsWith("discord_api:")) {
          hashtag = t.verification.substring("discord_api:".length);
        }

        completedTasks.push({
          id: t.id,
          title: t.title,
          category: t.category,
          hashtag: hashtag,
          maxPoints: t.mupoint,
          pointsAwarded: comp.points_awarded,
          completedAt: comp.completed_at,
        });
      }
    });

    // Also check for completions of task_id = 100 or tasks that might not exist in the tasks list
    completions.forEach((comp) => {
      const taskExists = tasks.some(t => t.id === comp.task_id);
      if (!taskExists) {
        completedTasks.push({
          id: comp.task_id,
          title: comp.task_id === 100 ? "Referral Points" : `Special Task #${comp.task_id}`,
          category: comp.task_id === 100 ? "Referral" : "Special",
          hashtag: "",
          maxPoints: comp.points_awarded,
          pointsAwarded: comp.points_awarded,
          completedAt: comp.completed_at,
        });
      }
    });

    // Sort completed tasks by completedAt DESC
    completedTasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return NextResponse.json({
      success: true,
      memberName: member.name,
      memberUserId: member.user_id,
      completedTasks,
    });
  } catch (error) {
    console.error("Captain member-tasks GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
