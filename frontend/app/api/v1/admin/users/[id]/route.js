import { NextResponse } from "next/server";
import { requireRole, hashPassword } from "@/utils/auth";
import { z } from "zod";
import { adjustSquadPoints } from "@/utils/squad";

const DOMAINS = ["Maker", "Creative", "Coder", "Strategist"];
const TEAMS = [
  "Brazil",
  "Argentina",
  "Portugal",
  "Germany",
  "France",
  "England",
  "Spain",
  "Netherlands",
  "Belgium",
  "Croatia",
  "Uruguay",
  "Japan",
];

const userPatchSchema = z.object({
  name: z.string().trim().min(2, "Name must be between 2 and 100 characters.").max(100, "Name must be between 2 and 100 characters.").optional(),
  email: z.string().trim().email("Please enter a valid email address.").toLowerCase().optional(),
  phone: z.string().trim().regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number.").optional(),
  domain: z.enum(DOMAINS, { errorMap: () => ({ message: "Invalid domain selected." }) }).optional(),
  team: z.enum(TEAMS, { errorMap: () => ({ message: "Invalid team selected." }) }).optional(),
  mu_points: z.number().int().min(0, "Points must be a positive integer.").optional(),
  password: z.string().min(6, "Password must be at least 6 characters long.").optional(),
  banned: z.string().optional(),
  role: z.enum(["player", "captain", "vicecaptain"], { errorMap: () => ({ message: "Invalid role selected." }) }).optional(),
  muid: z.string().trim().nullable().optional(),
});

export async function GET(request, { params }) {
  try {
    const auth = requireRole(request, "admin", "superadmin", "viewer");
    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
            message: auth.message,
            details: null,
          },
        },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    // 1. Fetch user registration details
    const res = await fetch(
      `${supabaseUrl}/rest/v1/registrations?id=eq.${id}&select=*`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Supabase error: ${await res.text()}`);
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found.",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    const user = rows[0];

    // 2. Fetch referrals
    let referrals = [];
    const referralsRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?referred_by=eq.${user.id}&select=id,name,user_id,email,phone,created_at&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    if (referralsRes.ok) {
      referrals = await referralsRes.json();
    }

    // 3. Fetch predictions
    let predictions = [];
    if (user.user_id) {
      const predictionsRes = await fetch(
        `${supabaseUrl}/rest/v1/match_predictions?user_id=eq.${encodeURIComponent(user.user_id)}&select=id,match_id,predicted_outcome,predicted_home_goals,predicted_away_goals,updated_at,outcome&order=updated_at.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (predictionsRes.ok) {
        predictions = await predictionsRes.json();
      }
    }

    // 4. Fetch WC season match data to map match details
    let matchesList = [];
    const wcRes = await fetch(
      `${supabaseUrl}/rest/v1/match_cache?match_id=eq.WC_season&select=match_data`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    if (wcRes.ok) {
      const rows = await wcRes.json();
      if (rows.length > 0) {
        matchesList = rows[0].match_data?.matches || [];
      }
    }

    const matchesMap = {};
    matchesList.forEach((m) => {
      matchesMap[String(m.id)] = m;
    });

    const enrichedPredictions = predictions.map((p) => {
      const match = matchesMap[String(p.match_id)];
      return {
        ...p,
        match_title: match
          ? `${match.homeTeam?.name || "Home"} vs ${match.awayTeam?.name || "Away"}`
          : `Match #${p.match_id}`,
        match_home_goals: match ? match.homeTeamScore : null,
        match_away_goals: match ? match.awayTeamScore : null,
        status: match ? match.status : null,
      };
    });

    // 5. Fetch completed tasks
    let completedTasks = [];
    if (user.user_id) {
      const completedTasksRes = await fetch(
        `${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(user.user_id)}&select=id,task_id,completed_at,points_awarded,xp_creativity,xp_branding,xp_innovation,xp_teamwork,xp_execution,tasks(title)&order=completed_at.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (completedTasksRes.ok) {
        const rawCompletions = await completedTasksRes.json();
        completedTasks = rawCompletions.filter((ct) => ct.task_id !== 100);
      }
    }

    return NextResponse.json({
      success: true,
      user,
      data: user,
      referrals,
      predictions: enrichedPredictions,
      completedTasks,
    });
  } catch (error) {
    console.error("Admin get user details error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user details.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = requireRole(request, "admin", "superadmin");
    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
            message: auth.message,
            details: null,
          },
        },
        { status: auth.status }
      );
    }

    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Malformed JSON body.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const validationResult = userPatchSchema.safeParse(body);
    if (!validationResult.success) {
      const details = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0];
        if (!details[field]) details[field] = [];
        details[field].push(err.message);
      });
      const firstError = validationResult.error.errors[0]?.message || "Validation failed.";
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: firstError,
            details,
          },
        },
        { status: 400 }
      );
    }

    const updates = { ...validationResult.data };

    if (updates.password) {
      updates.password_hash = await hashPassword(updates.password);
      delete updates.password;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "No valid fields to update.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?id=eq.${id}&select=id,team,mu_points`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!existingRes.ok) {
      throw new Error(`Supabase lookup error: ${await existingRes.text()}`);
    }

    const existingRows = await existingRes.json();
    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found.",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    const oldUser = existingRows[0];
    const oldTeam = oldUser.team;
    const oldPoints = Number(oldUser.mu_points || 0);

    const res = await fetch(
      `${supabaseUrl}/rest/v1/registrations?id=eq.${id}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes("duplicate") || errText.includes("unique")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT_ERROR",
              message: "This email is already registered to another user.",
              details: null,
            },
          },
          { status: 409 }
        );
      }
      throw new Error(`Supabase error: ${errText}`);
    }

    const data = await res.json();
    const updatedUser = data[0];

    if (updatedUser) {
      const newTeam = updatedUser.team;
      const newPoints = Number(updatedUser.mu_points || 0);

      if (oldTeam !== newTeam) {
        if (oldTeam && oldPoints > 0) {
          await adjustSquadPoints(supabaseUrl, supabaseKey, oldTeam, -oldPoints);
        }
        if (newTeam && newPoints > 0) {
          await adjustSquadPoints(supabaseUrl, supabaseKey, newTeam, newPoints);
        }
      } else if (oldPoints !== newPoints) {
        const pointsDiff = newPoints - oldPoints;
        if (newTeam && pointsDiff !== 0) {
          await adjustSquadPoints(supabaseUrl, supabaseKey, newTeam, pointsDiff);
        }
      }
    }

    return NextResponse.json({ success: true, user: updatedUser, data: updatedUser });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = requireRole(request, "superadmin");
    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
            message: auth.message,
            details: null,
          },
        },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?id=eq.${id}&select=id,user_id,team,mu_points`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!existingRes.ok) {
      throw new Error(`Supabase lookup error: ${await existingRes.text()}`);
    }

    const existingRows = await existingRes.json();
    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found.",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    const user = existingRows[0];

    // Delete foreign-key referenced rows in match_predictions if user_id exists
    if (user.user_id) {
      const deletePredsRes = await fetch(
        `${supabaseUrl}/rest/v1/match_predictions?user_id=eq.${encodeURIComponent(user.user_id)}`,
        {
          method: "DELETE",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!deletePredsRes.ok) {
        throw new Error(`Failed to delete user predictions: ${await deletePredsRes.text()}`);
      }
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/registrations?id=eq.${id}`,
      {
        method: "DELETE",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Supabase error: ${await res.text()}`);
    }

    if (user.team && Number(user.mu_points || 0) > 0) {
      await adjustSquadPoints(
        supabaseUrl,
        supabaseKey,
        user.team,
        -Number(user.mu_points || 0)
      );
    }

    return NextResponse.json({ success: true, message: "User deleted." });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete user.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
