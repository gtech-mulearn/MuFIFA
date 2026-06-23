import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";
import { adjustSquadPoints } from "@/utils/squad";

export async function POST(request) {
  try {
    // 1. Authenticate Admin
    const auth = requireRole(request, "admin", "superadmin", "iglead");
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
      user_id,
      task_id,
      points_awarded,
      xp_creativity,
      xp_branding,
      xp_innovation,
      xp_teamwork,
      xp_execution,
    } = body;

    if (!user_id || !task_id) {
      return NextResponse.json({ success: false, error: "User ID and Task ID are required." }, { status: 400 });
    }

    // 2. Fetch User & Task to verify they exist
    const userRes = await fetch(`${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(user_id)}&select=id,user_id,team,mu_points,tasks`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!userRes.ok) {
      throw new Error(`Failed to fetch user: ${await userRes.text()}`);
    }
    const users = await userRes.json();
    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "Player not found." }, { status: 404 });
    }
    const player = users[0];

    const taskRes = await fetch(`${supabaseUrl}/rest/v1/tasks?id=eq.${parseInt(task_id, 10)}&select=*`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!taskRes.ok) {
      throw new Error(`Failed to fetch task: ${await taskRes.text()}`);
    }
    const tasks = await taskRes.json();
    if (tasks.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }
    const task = tasks[0];

    // Determine target points and XP (use custom inputs or fall back to task defaults)
    const finalPoints = points_awarded !== undefined ? parseInt(points_awarded, 10) : task.mupoint;
    const finalXp = {
      creativity: xp_creativity !== undefined ? parseInt(xp_creativity, 10) : task.xp_creativity,
      branding: xp_branding !== undefined ? parseInt(xp_branding, 10) : task.xp_branding,
      innovation: xp_innovation !== undefined ? parseInt(xp_innovation, 10) : task.xp_innovation,
      teamwork: xp_teamwork !== undefined ? parseInt(xp_teamwork, 10) : task.xp_teamwork,
      execution: xp_execution !== undefined ? parseInt(xp_execution, 10) : task.xp_execution,
    };

    // 3. Query existing completion to calculate point changes
    const compRes = await fetch(
      `${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(user_id)}&task_id=eq.${parseInt(task_id, 10)}&select=*`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    if (!compRes.ok) {
      throw new Error(`Failed to check existing completion: ${await compRes.text()}`);
    }
    const completions = await compRes.json();
    const existingComp = completions.length > 0 ? completions[0] : null;

    const oldPointsAwarded = existingComp ? existingComp.points_awarded : 0;
    const pointsDiff = finalPoints - oldPointsAwarded;

    // 4. Upsert into user_completed_tasks
    const upsertRes = await fetch(
      `${supabaseUrl}/rest/v1/user_completed_tasks?on_conflict=user_id,task_id`,
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
            user_id: player.user_id,
            task_id: task.id,
            points_awarded: finalPoints,
            xp_creativity: finalXp.creativity,
            xp_branding: finalXp.branding,
            xp_innovation: finalXp.innovation,
            xp_teamwork: finalXp.teamwork,
            xp_execution: finalXp.execution,
            completed_at: new Date().toISOString(),
          },
        ]),
      }
    );

    if (!upsertRes.ok) {
      throw new Error(`Failed to save completion: ${await upsertRes.text()}`);
    }

    // 5. Update user's registrations points balance
    const currentMuPoints = player.mu_points || 0;
    const newMuPoints = Math.max(currentMuPoints + pointsDiff, 0);

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${player.id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mu_points: newMuPoints }),
    });

    if (!patchRes.ok) {
      throw new Error(`Failed to update user points: ${await patchRes.text()}`);
    }

    // 6. Update Squad points if user has a team
    if (player.team && pointsDiff !== 0) {
      await adjustSquadPoints(supabaseUrl, supabaseKey, player.team, pointsDiff);
    }

    return NextResponse.json({
      success: true,
      message: `Task points credited successfully. Added ${pointsDiff} points to user balance.`,
    });
  } catch (error) {
    console.error("Credit task error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
