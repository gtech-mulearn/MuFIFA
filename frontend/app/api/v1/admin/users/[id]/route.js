import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";
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

    return NextResponse.json({ success: true, user: rows[0], data: rows[0] });
  } catch (error) {
    console.error("Admin get user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user.",
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

    const updates = validationResult.data;

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
    return NextResponse.json({ success: true, user: data[0], data: data[0] });
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

    const user = existingRows[0];

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
