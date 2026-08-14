import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { isPastDeadline } from "@/utils/ascendDeadline";

const PLAYER_COOKIE = "player_token";

function getPlayerFromReq(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`)
  );
  if (!match) return null;
  const token = match[1];
  return verifyToken(token);
}

export async function GET(request) {
  try {
    const player = getPlayerFromReq(request);
    if (!player || !player.user_id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
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

    const res = await fetch(
      `${supabaseUrl}/rest/v1/ascend_submissions?user_id=eq.${encodeURIComponent(player.user_id)}&select=*,ascend_tasks(*)`,
      { method: "GET", headers }
    );

    if (!res.ok) {
      console.error("Fetch ascend_submissions failed:", await res.text());
      return NextResponse.json({ success: true, submissions: [] });
    }

    const submissions = await res.json();
    return NextResponse.json({ success: true, submissions });
  } catch (error) {
    console.error("GET ascend/submissions error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const player = getPlayerFromReq(request);
    if (!player || !player.user_id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { task_id, submission_url, notes = "" } = body;

    if (!task_id || !submission_url) {
      return NextResponse.json(
        { success: false, error: "Task ID and submission link are required." },
        { status: 400 }
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
      Prefer: "resolution=merge-duplicates,return=representation",
    };

    // Check task deadline
    const taskFetchRes = await fetch(
      `${supabaseUrl}/rest/v1/ascend_tasks?id=eq.${encodeURIComponent(task_id)}&select=*`,
      { method: "GET", headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    if (!taskFetchRes.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to verify task deadline details" },
        { status: 500 }
      );
    }

    const taskArr = await taskFetchRes.json();
    if (!taskArr || taskArr.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    const taskObj = taskArr[0];
    if (isPastDeadline(new Date(), taskObj.deadline)) {
      return NextResponse.json(
        {
          success: false,
          error: "Your task wasn't uploaded as it's submitted after the deadline",
        },
        { status: 400 }
      );
    }

    const payload = {
      task_id: Number(task_id),
      user_id: player.user_id,
      submission_url,
      notes,
      status: "Pending",
      quality_score: 0,
      innovation_score: 0,
      total_rating: 0,
      submitted_at: new Date().toISOString(),
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/ascend_submissions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Insert ascend_submissions error:", errText);
      return NextResponse.json(
        { success: false, error: "Failed to submit solution." },
        { status: 500 }
      );
    }

    const saved = await res.json();
    return NextResponse.json({
      success: true,
      message: "Solution submitted successfully for review!",
      submission: saved[0] || payload,
    });
  } catch (error) {
    console.error("POST ascend/submissions error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
