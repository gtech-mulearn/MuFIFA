import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

export async function GET(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database not configured." },
        { status: 503 },
      );
    }

    // 1. Authenticate Player
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`),
    );
    if (!cookieMatch) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const decoded = verifyToken(cookieMatch[1]);
    if (!decoded || decoded.role !== "player") {
      return NextResponse.json(
        { success: false, error: "Invalid session." },
        { status: 401 },
      );
    }
    const userId = decoded.user_id;

    // 2. Fetch User Registration (to get their UUID/ID)
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(userId)}&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );
    if (!userRes.ok) {
      throw new Error(`Fetch user failed: ${await userRes.text()}`);
    }
    const users = await userRes.json();
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: "Player not found." },
        { status: 404 },
      );
    }
    const player = users[0];

    const uuid = player.id;

    // 3. Fetch history from Kuzhiundo
    const kuzhiRes = await fetch(
      `https://kuzhiundo.com/api/user/${encodeURIComponent(uuid)}/history`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );
    if (!kuzhiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch history from Kuzhiundo.",
        },
        { status: 400 },
      );
    }

    const kuzhiData = await kuzhiRes.json();
    return NextResponse.json({
      success: true,
      linked: true,
      reports: kuzhiData.reports || [],
    });
  } catch (error) {
    console.error("Kuzhiundo history proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
