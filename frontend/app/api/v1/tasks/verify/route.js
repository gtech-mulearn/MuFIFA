import { NextResponse } from "next/server";
import { verifyToken, isPlayerBanned } from "@/utils/auth";
import { adjustSquadPoints } from "@/utils/squad";
import { createRateLimiter, getClientIp } from "@/utils/rateLimit";
import {
  KUZHIUNDO_BASE_POINTS,
  KUZHIUNDO_PER_SUBMISSION,
  KUZHIUNDO_SUBMISSION_TASK_ID,
} from "@/utils/kuzhiundo";
import { verifyDiscordSubmission } from "../../discord-api/route";

const PLAYER_COOKIE = "player_token";
const checkRate = createRateLimiter("task-verify", 15, 5 * 60 * 1000);

export async function POST(request) {
  try {
    // Rate limit check
    const rateCheck = checkRate(getClientIp(request));
    if (rateCheck.limited) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many requests. Try again in ${rateCheck.retryAfter}s.`,
        },
        { status: 429 },
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database not configured." },
        { status: 503 },
      );
    }

    // 1. Authenticate Player
    let userId = null;
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
    userId = decoded.user_id;

    const body = await request.json();
    const { task_id } = body;
    if (!task_id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required." },
        { status: 400 },
      );
    }

    const taskIdInt = parseInt(task_id, 10);

    // 2. Fetch User & Task to verify they exist
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(userId)}&select=id,user_id,email,team,mu_points,tasks,bio,referal_id,avatar_url,muid,banned`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );
    if (!userRes.ok)
      throw new Error(`Fetch user failed: ${await userRes.text()}`);
    const users = await userRes.json();
    if (users.length === 0)
      return NextResponse.json(
        { success: false, error: "Player not found." },
        { status: 404 },
      );
    const player = users[0];

    // Check if player is banned
    const banCheck = isPlayerBanned(player.banned);
    if (banCheck.isBanned) {
      return NextResponse.json(
        { success: false, error: banCheck.message },
        { status: 403 },
      );
    }

    const taskRes = await fetch(
      `${supabaseUrl}/rest/v1/tasks?id=eq.${taskIdInt}&select=id,mupoint,xp_creativity,xp_branding,xp_innovation,xp_teamwork,xp_execution,verification`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );
    if (!taskRes.ok)
      throw new Error(`Fetch task failed: ${await taskRes.text()}`);
    const tasks = await taskRes.json();
    if (tasks.length === 0)
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 },
      );
    const task = tasks[0];

    // 3. Check if already completed in user_completed_tasks
    const compCheckRes = await fetch(
      `${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(userId)}&task_id=eq.${taskIdInt}&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );
    if (!compCheckRes.ok)
      throw new Error(
        `Fetch completion check failed: ${await compCheckRes.text()}`,
      );
    const completions = await compCheckRes.json();
    if (completions.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Task already completed.",
      });
    }

    let pointsDiff = task.mupoint || 0;

    // 4. Resolve the verification mechanism dynamically
    let verificationMethod = "none";
    if (task.verification) {
      if (
        task.verification.startsWith("discord_api:") ||
        task.verification === "discord_api" ||
        task.verification === "discord api"
      ) {
        verificationMethod = "discord_api";
      } else if (task.verification === "referral") {
        verificationMethod = "referral";
      } else if (task.verification === "profile") {
        verificationMethod = "profile";
      } else if (task.verification === "kuzhiundo") {
        verificationMethod = "kuzhiundo";
      } else if (task.verification === "points") {
        verificationMethod = "points";
      } else if (task.verification === "custom") {
        // Fallback to task ID heuristics for older custom configurations
        if (taskIdInt === 1) verificationMethod = "referral";
        else if (taskIdInt === 2) verificationMethod = "profile";
        else if (taskIdInt === 4) verificationMethod = "kuzhiundo";
        else if (taskIdInt === 5) verificationMethod = "points";
        else if (taskIdInt === 6) verificationMethod = "discord_api";
      } else {
        verificationMethod = task.verification; // e.g. "none"
      }
    } else {
      // Fallback for tasks without explicit verification field set
      if (taskIdInt === 1) verificationMethod = "referral";
      else if (taskIdInt === 2) verificationMethod = "profile";
      else if (taskIdInt === 4) verificationMethod = "kuzhiundo";
      else if (taskIdInt === 5) verificationMethod = "points";
      else if (taskIdInt === 6) verificationMethod = "discord_api";
    }

    if (verificationMethod === "referral") {
      // Referral Program Challenge
      const refQuery = `${supabaseUrl}/rest/v1/registrations?referred_by=eq.${encodeURIComponent(player.id)}&select=id`;
      const refRes = await fetch(refQuery, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "count=exact",
        },
      });
      if (!refRes.ok)
        throw new Error(`Failed to check referrals: ${await refRes.text()}`);
      const contentRange = refRes.headers.get("content-range");
      const refCount = parseInt(contentRange?.split("/")[1] || "0", 10);
      if (refCount < 1) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Referral not found. Please ensure at least 1 friend has registered using your unique link.",
          },
          { status: 400 },
        );
      }
    } else if (verificationMethod === "profile") {
      // Profile Page Update
      const isProfileComplete = !!(
        player.bio &&
        player.bio.trim().length > 0 &&
        player.avatar_url &&
        player.avatar_url.trim().length > 0 &&
        player.muid &&
        player.muid.trim().length > 0
      );
      if (!isProfileComplete) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Profile details incomplete. Please ensure bio, avatar image, and µID (µLearn ID) are updated on your profile.",
          },
          { status: 400 },
        );
      }
    } else if (verificationMethod === "kuzhiundo") {
      // Kuzhiyundo Challenge Pothole Mapping verification
      const uuid = player.id; // MuFIFA registration UUID is the player.id

      let history;
      try {
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
              error:
                "Failed to verify ID on Kuzhiundo. Please verify your ID has contributions on kuzhiundo.com.",
            },
            { status: 400 },
          );
        }
        history = await kuzhiRes.json();
      } catch (err) {
        console.error("External Kuzhiundo API error:", err);
        return NextResponse.json(
          {
            success: false,
            error:
              "Kuzhiundo API server is temporarily unreachable. Please try again later.",
          },
          { status: 502 },
        );
      }

      if (!history || !Array.isArray(history.reports)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid history data returned from Kuzhiundo.",
          },
          { status: 400 },
        );
      }

      const reportsCount = history.reports.length;
      if (reportsCount < 1) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No pothole submissions found for this player. Please map at least 1 pothole on kuzhiundo.com first.",
          },
          { status: 400 },
        );
      }

      if (
        !history.user_id ||
        !player.user_id ||
        history.user_id.toLowerCase() !== player.user_id.toLowerCase()
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Username mismatch! This Kuzhiundo ID belongs to '${history.user_id}' but you are logged in as '${player.user_id}'.`,
          },
          { status: 400 },
        );
      }

      // 1. Insert/Upsert Task 100 row into user_completed_tasks for initial submissions
      const submissionPoints =
        Math.max(0, reportsCount - 1) * KUZHIUNDO_PER_SUBMISSION;
      const upsertTask100Res = await fetch(
        `${supabaseUrl}/rest/v1/user_completed_tasks?on_conflict=user_id,task_id`,
        {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation,resolution=merge-duplicates",
          },
          body: JSON.stringify({
            user_id: player.user_id,
            task_id: KUZHIUNDO_SUBMISSION_TASK_ID,
            points_awarded: submissionPoints,
            xp_creativity: 0,
            xp_branding: 0,
            xp_innovation: 0,
            xp_teamwork: 0,
            xp_execution: reportsCount,
            completed_at: new Date().toISOString(),
          }),
        },
      );
      if (!upsertTask100Res.ok) {
        throw new Error(
          `Failed to record initial Kuzhiundo submissions: ${await upsertTask100Res.text()}`,
        );
      }

      // 2. Adjust squad points for the initial submissions
      if (player.team && submissionPoints > 0) {
        await adjustSquadPoints(
          supabaseUrl,
          supabaseKey,
          player.team,
          submissionPoints,
        );
      }

      // 3. Update local player.mu_points so the default flow awards the correct total points
      player.mu_points = (player.mu_points || 0) + submissionPoints;

      // First time verification strictly awards the base task points (10 uPoints)
      pointsDiff = KUZHIUNDO_BASE_POINTS;
    } else if (verificationMethod === "points") {
      // Squad Synergy (20 points)
      const currentMuPoints = player.mu_points || 0;
      if (currentMuPoints < 20) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Insufficient points. Please accumulate a total of at least 20 μPoints.",
          },
          { status: 400 },
        );
      }
    } else if (verificationMethod === "discord_api") {
      if (!player.muid || !player.email) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please complete your µLearn ID (µID) and Email in your profile.",
          },
          { status: 400 },
        );
      }

      let hashtag = "";
      if (task.verification && task.verification.startsWith("discord_api:")) {
        hashtag = task.verification.substring("discord_api:".length);
      } else if (taskIdInt === 6) {
        hashtag = "#mufifa2026-intro";
      }

      if (!hashtag) {
        return NextResponse.json(
          {
            success: false,
            error: "Task verification hashtag is not configured.",
          },
          { status: 400 },
        );
      }

      try {
        const verifyData = await verifyDiscordSubmission(player.muid, player.email, hashtag);

        if (verifyData.hasError) {
          const errMsg =
            verifyData.message?.general?.[0] || "Verification failed.";
          return NextResponse.json(
            {
              success: false,
              error: `Verification failed: ${errMsg}`,
            },
            { status: verifyData.statusCode || 400 },
          );
        }

        if (!verifyData.response || !verifyData.response.verified) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Discord submission not found. Please ensure you have posted in the Discord channel with the correct hashtag and try again.",
            },
            { status: 400 },
          );
        }

        // Successfully verified
        pointsDiff = task.mupoint || 0;
      } catch (err) {
        console.error("External Discord API verification error:", err);
        return NextResponse.json(
          {
            success: false,
            error:
              "µLearn verification server is temporarily unreachable. Please try again later.",
          },
          { status: 502 },
        );
      }
    } else {
      // Manual admin review / none / unrecognized
      return NextResponse.json(
        {
          success: false,
          error: "This challenge must be verified and credited by an admin.",
        },
        { status: 400 },
      );
    }

    // 5. Insert into user_completed_tasks
    const insertRes = await fetch(
      `${supabaseUrl}/rest/v1/user_completed_tasks`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          task_id: taskIdInt,
          points_awarded: pointsDiff,
          xp_creativity: task.xp_creativity,
          xp_branding: task.xp_branding,
          xp_innovation: task.xp_innovation,
          xp_teamwork: task.xp_teamwork,
          xp_execution: task.xp_execution,
        }),
      },
    );
    if (!insertRes.ok)
      throw new Error(`Insert completion failed: ${await insertRes.text()}`);

    // 6. Update user's registrations points and tasks JSON
    const newMuPoints = (player.mu_points || 0) + pointsDiff;

    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?id=eq.${player.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mu_points: newMuPoints }),
      },
    );
    if (!patchRes.ok)
      throw new Error(`Update user profile failed: ${await patchRes.text()}`);

    // 7. Update Squad points if user has a team
    if (player.team && pointsDiff > 0) {
      await adjustSquadPoints(
        supabaseUrl,
        supabaseKey,
        player.team,
        pointsDiff,
      );
    }

    return NextResponse.json({
      success: true,
      message: `Task ${taskIdInt} verified and completed! Awarded ${pointsDiff} uPoints.`,
    });
  } catch (error) {
    console.error("Verify task endpoint error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
