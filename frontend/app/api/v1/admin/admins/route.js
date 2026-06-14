import { NextResponse } from "next/server";
import { requireRole, hashPassword } from "@/utils/auth";
import { z } from "zod";

const adminSchema = z.object({
  username: z.string({ required_error: "Username is required." }).trim().min(1, "Username is required."),
  email: z.string({ required_error: "Email is required." }).trim().email("Please enter a valid email address."),
  password: z.string({ required_error: "Password is required." }).trim().min(6, "Password must be at least 6 characters."),
  role: z.enum(["superadmin", "admin", "viewer"], { errorMap: () => ({ message: "Invalid role selected." }) }).optional(),
});

export async function GET(request) {
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

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/admin_users?select=id,username,email,role,created_at&order=created_at.desc`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      throw new Error(`Supabase error: ${await res.text()}`);
    }

    const admins = await res.json();
    return NextResponse.json({ success: true, admins, data: admins });
  } catch (error) {
    console.error("Admin list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch admins.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const validationResult = adminSchema.safeParse(body);
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

    const { username, email, password, role } = validationResult.data;
    const password_hash = await hashPassword(password);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/admin_users`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify([{
          username: username.trim(),
          email: email.trim(),
          password_hash,
          role: role || "viewer",
        }]),
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
              message: "An admin with this username or email already exists.",
              details: null,
            },
          },
          { status: 409 }
        );
      }
      throw new Error(`Supabase error: ${errText}`);
    }

    const data = await res.json();
    const created = data[0];
    const adminData = {
      id: created.id,
      username: created.username,
      email: created.email,
      role: created.role,
      created_at: created.created_at,
    };

    return NextResponse.json({
      success: true,
      admin: adminData,
      data: adminData,
    }, { status: 201 });
  } catch (error) {
    console.error("Admin create error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create admin.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
