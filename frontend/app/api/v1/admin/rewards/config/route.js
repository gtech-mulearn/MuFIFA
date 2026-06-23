import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function GET(request) {
  try {
    const auth = requireRole(request, "admin", "superadmin", "viewer", "merch_partner");
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/level_rewards_config?select=*&order=level.asc`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch level configs: ${await res.text()}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET level config error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, "admin", "superadmin", "merch_partner");
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    const body = await request.json();
    const { level, choice_limit } = body;

    if (level === undefined || choice_limit === undefined) {
      return NextResponse.json({ success: false, error: "Level and choice limit are required." }, { status: 400 });
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/level_rewards_config?level=eq.${parseInt(level, 10)}`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        level: parseInt(level, 10),
        choice_limit: parseInt(choice_limit, 10),
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to upsert level config: ${await res.text()}`);
    }

    return NextResponse.json({ success: true, message: "Choice limit updated successfully." });
  } catch (error) {
    console.error("POST level config error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
