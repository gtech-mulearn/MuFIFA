import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

export async function GET(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);
    const offset = (page - 1) * limit;

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "count=exact",
    };

    // 1. Fetch released merchandise items (paginated)
    const url = `${supabaseUrl}/rest/v1/merch_items?is_released=eq.true&order=id.asc&offset=${offset}&limit=${limit}`;
    const merchRes = await fetch(url, { headers, next: { revalidate: 0 } });
    if (!merchRes.ok) {
      throw new Error(`Failed to fetch merch items: ${await merchRes.text()}`);
    }
    const merchItems = await merchRes.json();
    const totalCount = parseInt(merchRes.headers.get("content-range")?.split("/")[1] || "0", 10);

    // 2. Identify logged-in player
    let userId = null;
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`));
    if (cookieMatch) {
      const decoded = verifyToken(cookieMatch[1]);
      if (decoded && decoded.role === "player") {
        userId = decoded.user_id;
      }
    }

    // 3. Fetch claims if logged in
    let claimedIds = new Set();
    if (userId) {
      const claimsUrl = `${supabaseUrl}/rest/v1/user_merch_claims?user_id=eq.${encodeURIComponent(userId)}&select=merch_id`;
      const claimsRes = await fetch(claimsUrl, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, next: { revalidate: 0 } });
      if (claimsRes.ok) {
        const claims = await claimsRes.json();
        claims.forEach(c => claimedIds.add(c.merch_id));
      }
    }

    // 4. Map claimed status
    const data = merchItems.map(item => ({
      ...item,
      claimed: claimedIds.has(item.id),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error("GET rewards store error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    // 1. Authenticate user
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`));
    if (!cookieMatch) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const decoded = verifyToken(cookieMatch[1]);
    if (!decoded || decoded.role !== "player") {
      return NextResponse.json({ success: false, error: "Invalid session." }, { status: 401 });
    }
    const userId = decoded.user_id;

    // 2. Parse request body
    const body = await request.json();
    const { merch_id } = body;
    if (!merch_id) {
      return NextResponse.json({ success: false, error: "Merchandise ID is required." }, { status: 400 });
    }
    const merchIdInt = parseInt(merch_id, 10);

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    };

    // 3. Fetch Merch Item details
    const merchRes = await fetch(`${supabaseUrl}/rest/v1/merch_items?id=eq.${merchIdInt}&select=*`, { headers });
    if (!merchRes.ok) {
      throw new Error(`Fetch merch item failed: ${await merchRes.text()}`);
    }
    const merchList = await merchRes.json();
    if (merchList.length === 0) {
      return NextResponse.json({ success: false, error: "Merchandise item not found." }, { status: 404 });
    }
    const merch = merchList[0];

    if (!merch.is_released) {
      return NextResponse.json({ success: false, error: "This merchandise is not currently available." }, { status: 400 });
    }

    if (merch.quantity <= 0) {
      return NextResponse.json({ success: false, error: "This item is out of stock." }, { status: 400 });
    }

    // 4. Fetch User Details
    const userRes = await fetch(`${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(userId)}&select=id,user_id,mu_points`, { headers });
    if (!userRes.ok) {
      throw new Error(`Fetch user failed: ${await userRes.text()}`);
    }
    const users = await userRes.json();
    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "Player profile not found." }, { status: 404 });
    }
    const player = users[0];

    // Compute player level from completed tasks XP breakdown
    const compQuery = `${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(player.user_id)}&select=xp_creativity,xp_branding,xp_innovation,xp_teamwork,xp_execution`;
    const compRes = await fetch(compQuery, { headers });
    let totalXp = 0;
    if (compRes.ok) {
      const completions = await compRes.json();
      completions.forEach((c) => {
        totalXp += (c.xp_creativity || 0) +
                   (c.xp_branding || 0) +
                   (c.xp_innovation || 0) +
                   (c.xp_teamwork || 0) +
                   (c.xp_execution || 0);
      });
    }
    const userLevel = Math.floor(totalXp / 1500) + 1;
    const userPoints = player.mu_points || 0;

    // 5. Verify Eligibility
    if (userLevel < merch.min_level || userPoints < merch.min_points) {
      return NextResponse.json({
        success: false,
        error: `Ineligible. Requires Level ${merch.min_level} and ${merch.min_points} μPoints.`,
      }, { status: 400 });
    }

    // 6. Check if already claimed
    const claimsCheckRes = await fetch(`${supabaseUrl}/rest/v1/user_merch_claims?user_id=eq.${encodeURIComponent(userId)}&merch_id=eq.${merchIdInt}&select=id`, { headers });
    if (!claimsCheckRes.ok) {
      throw new Error(`Fetch claim check failed: ${await claimsCheckRes.text()}`);
    }
    const claims = await claimsCheckRes.json();
    if (claims.length > 0) {
      return NextResponse.json({ success: false, error: "You have already claimed this merchandise." }, { status: 400 });
    }

    // 7. Insert Claim into user_merch_claims
    const insertClaimRes = await fetch(`${supabaseUrl}/rest/v1/user_merch_claims`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        merch_id: merchIdInt,
      }),
    });
    if (!insertClaimRes.ok) {
      throw new Error(`Failed to create claim record: ${await insertClaimRes.text()}`);
    }

    // 8. Decrement quantity in merch_items
    const patchMerchRes = await fetch(`${supabaseUrl}/rest/v1/merch_items?id=eq.${merchIdInt}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        quantity: merch.quantity - 1,
      }),
    });
    if (!patchMerchRes.ok) {
      throw new Error(`Failed to update merch item quantity: ${await patchMerchRes.text()}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully claimed "${merch.title}"!`,
    });
  } catch (error) {
    console.error("POST claim reward error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
