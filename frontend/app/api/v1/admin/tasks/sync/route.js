import { NextResponse } from "next/server";
import { verifyToken, requireRole } from "@/utils/auth";
import { adjustSquadPoints } from "@/utils/squad";
import { fetchAllSupabase, fetchInSupabase } from "@/utils/supabase";

export async function POST(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    // 1. Authenticate Admin
    const authResult = requireRole(request, "admin", "superadmin", "iglead");
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.message }, { status: authResult.status });
    }

    const body = await request.json();
    const { taskId, targetUserId, points } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: "Task ID is required." }, { status: 400 });
    }

    // 2. Patch Task Definition if points are provided
    if (points) {
      const patchTaskRes = await fetch(`${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mupoint: points.mupoint || 0,
          xp_creativity: points.xp_creativity || 0,
          xp_branding: points.xp_branding || 0,
          xp_innovation: points.xp_innovation || 0,
          xp_teamwork: points.xp_teamwork || 0,
          xp_execution: points.xp_execution || 0
        })
      });
      if (!patchTaskRes.ok) {
        return NextResponse.json({ success: false, error: "Failed to update main task definition." }, { status: 500 });
      }
    }

    // 3. Fetch the Task
    const taskRes = await fetch(`${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}&select=*`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const tasks = await taskRes.json();
    if (tasks.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }
    const task = tasks[0];

    // 4. Fetch user_completed_tasks for this task
    let compQuery = `${supabaseUrl}/rest/v1/user_completed_tasks?task_id=eq.${taskId}&select=*`;
    if (targetUserId && targetUserId !== "all") {
      compQuery += `&user_id=eq.${encodeURIComponent(targetUserId)}`;
    }

    const completions = await fetchAllSupabase(compQuery, {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    });

    if (completions.length === 0) {
      return NextResponse.json({ success: true, message: "No completions found to sync.", updatedCount: 0 });
    }

    // Prepare true task values (use edited points if provided, else fallback to fetched DB task)
    const truePoints = points ? (points.mupoint || 0) : (task.mupoint || 0);
    const trueCr = points ? (points.xp_creativity || 0) : (task.xp_creativity || 0);
    const trueBr = points ? (points.xp_branding || 0) : (task.xp_branding || 0);
    const trueIn = points ? (points.xp_innovation || 0) : (task.xp_innovation || 0);
    const trueTe = points ? (points.xp_teamwork || 0) : (task.xp_teamwork || 0);
    const trueEx = points ? (points.xp_execution || 0) : (task.xp_execution || 0);

    let updatedCount = 0;

    // 5. Batch update all user_completed_tasks rows for this task in one PATCH
    const patchAllCompRes = await fetch(`${supabaseUrl}/rest/v1/user_completed_tasks?task_id=eq.${taskId}${targetUserId && targetUserId !== "all" ? `&user_id=eq.${encodeURIComponent(targetUserId)}` : ""}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        points_awarded: truePoints,
        xp_creativity: trueCr,
        xp_branding: trueBr,
        xp_innovation: trueIn,
        xp_teamwork: trueTe,
        xp_execution: trueEx
      })
    });

    if (!patchAllCompRes.ok) {
      return NextResponse.json({ success: false, error: "Failed to update completion records." }, { status: 500 });
    }

    // 6. Batch fetch all affected users in one query
    const affectedUserIds = [...new Set(completions.map(c => c.user_id))];
    let allUsers = [];
    if (affectedUserIds.length > 0) {
      try {
        allUsers = await fetchInSupabase(
          `${supabaseUrl}/rest/v1/registrations`,
          "user_id",
          affectedUserIds,
          { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          "id,user_id,mu_points,team"
        );
      } catch (err) {
        console.error("Failed to fetch registrations for task sync:", err);
      }
    }
    const userMap = {};
    allUsers.forEach(u => { userMap[u.user_id] = u; });

    // 7. Calculate per-user deltas and aggregate squad deltas
    const squadDeltas = {}; // team -> total delta

    // Process user mu_points updates in parallel batches
    const userPatchPromises = [];
    for (const comp of completions) {
      const delta = truePoints - (comp.points_awarded || 0);
      const user = userMap[comp.user_id];
      if (!user || delta === 0) {
        updatedCount++;
        continue;
      }

      const newMuPoints = Math.max((user.mu_points || 0) + delta, 0);
      userPatchPromises.push(
        fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${user.id}`, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ mu_points: newMuPoints })
        })
      );

      // Also update the in-memory mu_points so subsequent completions for the same user use updated values
      user.mu_points = newMuPoints;

      if (user.team) {
        squadDeltas[user.team] = (squadDeltas[user.team] || 0) + delta;
      }

      updatedCount++;
    }

    // Execute all user patches in parallel (drastically faster than sequential)
    await Promise.all(userPatchPromises);

    // 8. Apply aggregated squad point adjustments (one call per team instead of per user)
    const squadPromises = Object.entries(squadDeltas).map(([team, delta]) =>
      adjustSquadPoints(supabaseUrl, supabaseKey, team, delta)
    );
    await Promise.all(squadPromises);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized points for ${updatedCount} players.`,
      updatedCount
    });

  } catch (err) {
    console.error("Task sync error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
