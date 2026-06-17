import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function GET(request) {
  try {
    // 1. Authenticate Admin
    const auth = requireRole(request, "admin", "superadmin", "viewer");
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    // 2. Fetch completions joined with registrations details (name, team)
    const completionsUrl = `${supabaseUrl}/rest/v1/user_completed_tasks?select=*,registrations(name,team)&order=completed_at.desc`;
    const res = await fetch(completionsUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch completions: ${await res.text()}`);
    }

    const completions = await res.json();

    // Map nested PostgREST response to flat objects
    const formatted = completions.map((c) => ({
      id: c.id,
      user_id: c.user_id,
      task_id: c.task_id,
      completed_at: c.completed_at,
      points_awarded: c.points_awarded,
      xp: {
        creativity: c.xp_creativity,
        branding: c.xp_branding,
        innovation: c.xp_innovation,
        teamwork: c.xp_teamwork,
        execution: c.xp_execution,
      },
      name: c.registrations ? c.registrations.name : "Unknown Player",
      team: c.registrations ? c.registrations.team : "None",
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET completions error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
