import { NextResponse } from "next/server";
import { comparePassword, signToken, buildTokenCookie } from "@/utils/auth";

export async function POST(request) {
  try {
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

    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Username and password are required.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database not configured.",
            details: null,
          },
        },
        { status: 503 }
      );
    }

    const url = `${supabaseUrl}/rest/v1/admin_users?username=eq.${encodeURIComponent(username)}&select=id,username,email,password_hash,role`;


    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Supabase query failed: ${await res.text()}`);
    }

    const rows = await res.json();

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid username or password.",
            details: null,
          },
        },
        { status: 401 }
      );
    }

    const admin = rows[0];
    const passwordMatch = await comparePassword(password, admin.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid username or password.",
            details: null,
          },
        },
        { status: 401 }
      );
    }

    const token = signToken({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    });

    const adminData = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    };

    const response = NextResponse.json({
      success: true,
      admin: adminData,
      data: adminData,
    });

    response.headers.set("Set-Cookie", buildTokenCookie(token));
    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
