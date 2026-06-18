import { NextResponse } from "next/server";
import { verifyToken, requireRole } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

export async function GET(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    // 1. Authenticate user (optional for GET, but let's check for completions)
    let userId = null;
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`));
    if (cookieMatch) {
      const decoded = verifyToken(cookieMatch[1]);
      if (decoded && decoded.role === "player") {
        userId = decoded.user_id;
      }
    }

    // 2. Fetch tasks (paginated if params present)
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page") || "1";

    let url = `${supabaseUrl}/rest/v1/tasks?select=*&order=id.asc`;
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      const page = parseInt(pageParam, 10);
      const offset = (page - 1) * limit;
      url += `&offset=${offset}&limit=${limit}`;
      headers["Prefer"] = "count=exact";
    }

    const tasksRes = await fetch(url, {
      headers,
      next: { revalidate: 0 },
    });

    if (!tasksRes.ok) {
      throw new Error(`Failed to fetch tasks: ${await tasksRes.text()}`);
    }
    const tasks = await tasksRes.json();
    const totalCount = limitParam
      ? parseInt(tasksRes.headers.get("content-range")?.split("/")[1] || "0", 10)
      : tasks.length;

    // 3. Fetch user completions if logged in
    let completionsMap = {};
    if (userId) {
      const compRes = await fetch(`${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(userId)}&select=*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        next: { revalidate: 0 },
      });
      if (compRes.ok) {
        const completions = await compRes.json();
        completions.forEach((c) => {
          completionsMap[c.task_id] = c;
        });
      }
    }

    // 4. Map completions to tasks
    const processedTasks = tasks.map((t) => {
      const completion = completionsMap[t.id];
      return {
        ...t,
        completed: !!completion,
        completed_at: completion ? completion.completed_at : null,
        points_awarded: completion ? completion.points_awarded : 0,
        xp_earned: completion
          ? {
              creativity: completion.xp_creativity,
              branding: completion.xp_branding,
              innovation: completion.xp_innovation,
              teamwork: completion.xp_teamwork,
              execution: completion.xp_execution,
            }
          : null,
      };
    });

    const responseData = { success: true, data: processedTasks };
    if (limitParam) {
      responseData.pagination = {
        page: parseInt(pageParam, 10),
        limit: parseInt(limitParam, 10),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limitParam, 10)),
      };
    }
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET tasks error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Authenticate Admin
    const auth = requireRole(request, "admin", "superadmin");
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    const body = await request.json();
    const {
      id,
      title,
      description,
      short_desc,
      guidelines,
      action_label,
      action_url,
      mupoint,
      xp_creativity,
      xp_branding,
      xp_innovation,
      xp_teamwork,
      xp_execution,
      tier,
    } = body;

    if (!id || !title || !description) {
      return NextResponse.json({ success: false, error: "Task ID, title, and description are required." }, { status: 400 });
    }

    // Insert task into Supabase
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/tasks?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: parseInt(id, 10),
        title,
        description,
        short_desc: short_desc || description,
        guidelines: guidelines || "",
        action_label: action_label || "View Details",
        action_url: action_url || "#",
        mupoint: parseInt(mupoint || 0, 10),
        xp_creativity: parseInt(xp_creativity || 0, 10),
        xp_branding: parseInt(xp_branding || 0, 10),
        xp_innovation: parseInt(xp_innovation || 0, 10),
        xp_teamwork: parseInt(xp_teamwork || 0, 10),
        xp_execution: parseInt(xp_execution || 0, 10),
        tier: parseInt(tier || 1, 10),
      }),
    });

    if (!insertRes.ok) {
      throw new Error(`Failed to insert task: ${await insertRes.text()}`);
    }

    const savedTasks = await insertRes.json();
    return NextResponse.json({ success: true, data: savedTasks[0] });
  } catch (error) {
    console.error("POST task error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
