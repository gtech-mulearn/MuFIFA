import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function GET(request) {
  try {
    // 1. Authenticate Admin
    const auth = requireRole(request, "admin", "superadmin", "viewer", "iglead");
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page") || "1";

    // 2. Fetch completions joined with registrations details (name, team)
    let completionsUrl = `${supabaseUrl}/rest/v1/user_completed_tasks?select=*,registrations(name,team)&order=completed_at.desc`;
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      const page = parseInt(pageParam, 10);
      const offset = (page - 1) * limit;
      completionsUrl += `&offset=${offset}&limit=${limit}`;
      headers["Prefer"] = "count=exact";
    }

    const res = await fetch(completionsUrl, {
      headers,
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch completions: ${await res.text()}`);
    }

    const completions = await res.json();
    const totalCount = limitParam
      ? parseInt(res.headers.get("content-range")?.split("/")[1] || "0", 10)
      : completions.length;

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

    const responseData = { success: true, data: formatted };
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
    console.error("GET completions error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
