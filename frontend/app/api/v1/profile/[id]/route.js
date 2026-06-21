import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

// Cache for avg_highest_xp. TTL: 10 minutes.
let _avgHighestXpCache = null; // { value: number, ts: number }
const AVG_HIGHEST_XP_TTL_MS = 600_000;

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Player ID parameter is required.",
          },
        },
        { status: 400 },
      );
    }

    const cleanId = id.trim().startsWith("@") ? id.trim().slice(1) : id.trim();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database credentials are not configured.",
          },
        },
        { status: 503 },
      );
    }

    const selectFields =
      "id,name,user_id,team,domain,mu_points,avatar_url,created_at,email,phone,referal_id,tasks,ticket_url,referred_by,bio,muid";

    // 1. Try to find the user by user_id (username)
    let query = `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(cleanId)}&select=${selectFields}&limit=1`;
    let res = await fetch(query, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Supabase query for user_id failed: ${await res.text()}`);
    }

    let rows = await res.json();

    // 2. If not found, check if cleanId could be a database ID (UUID or numeric)
    if (!rows || rows.length === 0) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          cleanId,
        );
      const isInteger = /^\d+$/.test(cleanId);

      if (isUuid || isInteger) {
        query = `${supabaseUrl}/rest/v1/registrations?id=eq.${encodeURIComponent(cleanId)}&select=${selectFields}&limit=1`;
        res = await fetch(query, {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Supabase query for id failed: ${await res.text()}`);
        }

        rows = await res.json();
      }
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Player profile not found.",
          },
        },
        { status: 404 },
      );
    }

    const profile = rows[0];

    // Fetch user rank dynamically by counting players with strictly more mu_points
    let rank = 1;
    try {
      const rankQuery = `${supabaseUrl}/rest/v1/registrations?mu_points=gt.${profile.mu_points}&limit=0`;
      const rankRes = await fetch(rankQuery, {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "count=exact",
        },
      });
      if (rankRes.ok) {
        const contentRange = rankRes.headers.get("content-range");
        if (contentRange) {
          const parts = contentRange.split("/");
          if (parts.length === 2) {
            rank = parseInt(parts[1], 10) + 1;
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch player rank:", err);
    }

    const cookieHeader = request.headers.get("cookie") || "";
    const matchToken = cookieHeader.match(/(?:^|;\s*)player_token=([^;]*)/);
    let isOwner = false;
    if (matchToken) {
      try {
        const decoded = verifyToken(matchToken[1]);
        if (
          decoded &&
          (decoded.id === profile.id || decoded.user_id === profile.user_id)
        ) {
          isOwner = true;
        }
      } catch (err) {
        console.error("Token verification failed in profile endpoint:", err);
      }
    }

    const responseData = { ...profile, rank };

    // Fetch user predictions count
    let predictionsCount = 0;
    try {
      const predQuery = `${supabaseUrl}/rest/v1/match_predictions?user_id=eq.${encodeURIComponent(profile.user_id)}&limit=1`;
      const predRes = await fetch(predQuery, {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "count=exact",
        },
      });
      if (predRes.ok) {
        const contentRange = predRes.headers.get("content-range");
        if (contentRange) {
          const parts = contentRange.split("/");
          if (parts.length === 2) {
            predictionsCount = parseInt(parts[1], 10);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch player predictions count:", err);
    }

    responseData.predictions_count = predictionsCount;

    // Fetch current user's completed tasks to sum domain XP values (fully optimized query selecting only XP columns)
    let xp_creativity = 0;
    let xp_branding = 0;
    let xp_innovation = 0;
    let xp_teamwork = 0;
    let xp_execution = 0;
    try {
      const compQuery = `${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(profile.user_id)}&select=xp_creativity,xp_branding,xp_innovation,xp_teamwork,xp_execution`;
      const compRes = await fetch(compQuery, {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      if (compRes.ok) {
        const completions = await compRes.json();
        responseData.completed_tasks_count = completions.length;
        completions.forEach((c) => {
          xp_creativity += c.xp_creativity || 0;
          xp_branding += c.xp_branding || 0;
          xp_innovation += c.xp_innovation || 0;
          xp_teamwork += c.xp_teamwork || 0;
          xp_execution += c.xp_execution || 0;
        });
      }
    } catch (err) {
      console.error("Failed to fetch player completed tasks for stats:", err);
    }

    // Retrieve or calculate global average of student highest XP (with in-memory cache and optimized selects)
    let avgHighestXp = 38;
    const now = Date.now();
    if (_avgHighestXpCache && now - _avgHighestXpCache.ts < AVG_HIGHEST_XP_TTL_MS) {
      avgHighestXp = _avgHighestXpCache.value;
    } else {
      try {
        const globalQuery = `${supabaseUrl}/rest/v1/user_completed_tasks?select=user_id,xp_creativity,xp_branding,xp_innovation,xp_teamwork,xp_execution`;
        const globalRes = await fetch(globalQuery, {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });
        if (globalRes.ok) {
          const completions = await globalRes.json();
          const userXpMap = {};
          completions.forEach((c) => {
            const uid = c.user_id;
            if (!userXpMap[uid]) {
              userXpMap[uid] = { creativity: 0, branding: 0, innovation: 0, teamwork: 0, execution: 0 };
            }
            userXpMap[uid].creativity += c.xp_creativity || 0;
            userXpMap[uid].branding += c.xp_branding || 0;
            userXpMap[uid].innovation += c.xp_innovation || 0;
            userXpMap[uid].teamwork += c.xp_teamwork || 0;
            userXpMap[uid].execution += c.xp_execution || 0;
          });

          const uids = Object.keys(userXpMap);
          let sumOfStudentHighest = 0;
          uids.forEach((uid) => {
            const xp = userXpMap[uid];
            const highest = Math.max(xp.creativity, xp.branding, xp.innovation, xp.teamwork, xp.execution);
            sumOfStudentHighest += highest;
          });
          avgHighestXp = uids.length > 0 ? sumOfStudentHighest / uids.length : 38;
          _avgHighestXpCache = { value: avgHighestXp, ts: now };
        }
      } catch (err) {
        console.error("Failed to fetch global completions for avg_highest_xp:", err);
        if (_avgHighestXpCache) avgHighestXp = _avgHighestXpCache.value;
      }
    }
    responseData.avg_highest_xp = avgHighestXp;

    responseData.xp_breakdown = {
      creativity: xp_creativity,
      branding: xp_branding,
      innovation: xp_innovation,
      teamwork: xp_teamwork,
      execution: xp_execution,
    };

    delete responseData.institution;

    if (!isOwner) {
      delete responseData.email;
      delete responseData.phone;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Get player profile error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        { success: false, error: "Player ID parameter is required." },
        { status: 400 },
      );
    }

    const cleanId = id.trim().startsWith("@") ? id.trim().slice(1) : id.trim();

    // 1. Authenticate user
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)player_token=([^;]*)/);
    if (!match) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update profile." },
        { status: 401 },
      );
    }

    const token = match[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: "Invalid session. Please log in again." },
        { status: 401 },
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database credentials are not configured." },
        { status: 503 },
      );
    }

    // 2. Fetch the target profile to check ownership
    const selectFields = "id,user_id";
    let query = `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(cleanId)}&select=${selectFields}&limit=1`;
    let res = await fetch(query, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to query registrations: ${await res.text()}`);
    }

    let rows = await res.json();
    if (!rows || rows.length === 0) {
      // Check if it's database UUID or integer id
      query = `${supabaseUrl}/rest/v1/registrations?id=eq.${encodeURIComponent(cleanId)}&select=${selectFields}&limit=1`;
      res = await fetch(query, {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      if (!res.ok) {
        throw new Error(
          `Failed to query registrations by id: ${await res.text()}`,
        );
      }
      rows = await res.json();
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Player profile not found." },
        { status: 404 },
      );
    }

    const profile = rows[0];

    // 3. Authorization check
    if (decoded.id !== profile.id && decoded.user_id !== profile.user_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You are not authorized to edit this profile.",
        },
        { status: 403 },
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const { name, bio, phone, tasks, muid } = body;

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (tasks !== undefined) updateData.tasks = tasks;
    if (muid !== undefined) updateData.muid = muid.trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided for update." },
        { status: 400 },
      );
    }

    // 5. Update Database Row
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?id=eq.${profile.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      // Handle unique constraint check (for phone)
      if (errText.includes("registrations_phone_key")) {
        return NextResponse.json(
          {
            success: false,
            error: "Phone number is already registered by another player.",
          },
          { status: 400 },
        );
      }
      throw new Error(`Supabase PATCH failed: ${errText}`);
    }

    const updatedRows = await patchRes.json();
    return NextResponse.json({
      success: true,
      data: updatedRows[0],
    });
  } catch (error) {
    console.error("Update player profile error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
