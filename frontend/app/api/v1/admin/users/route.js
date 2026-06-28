import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const search = searchParams.get("search") || "";
    const team = searchParams.get("team") || "";
    const domain = searchParams.get("domain") || "";

    const offset = (page - 1) * limit;

    let filterParts = [];
    if (search) {
      // Sanitize search input: strip PostgREST operator characters to prevent filter injection
      const cleanSearch = search.trim().replace(/[.*(),]/g, "");
      if (cleanSearch.length > 0) {
        const orFilter = `(name.ilike.*${cleanSearch}*,email.ilike.*${cleanSearch}*,phone.ilike.*${cleanSearch}*,user_id.ilike.*${cleanSearch}*)`;
        filterParts.push(`or=${encodeURIComponent(orFilter)}`);
      }
    }
    if (team) {
      filterParts.push(`team=eq.${encodeURIComponent(team)}`);
    } else {
      filterParts.push(`team=neq.Test`);
    }
    if (domain) {
      filterParts.push(`domain=eq.${encodeURIComponent(domain)}`);
    }

    const filterQuery = filterParts.length > 0 ? "&" + filterParts.join("&") : "";

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "count=exact",
    };

    const url = `${supabaseUrl}/rest/v1/registrations?select=id,name,email,user_id,phone,domain,team,mu_points,created_at,banned,role&order=created_at.desc&offset=${offset}&limit=${limit}${filterQuery}`;

    const res = await fetch(url, { method: "GET", headers, next: { revalidate: 0 } });

    if (!res.ok) {
      throw new Error(`Supabase query failed: ${await res.text()}`);
    }

    const users = await res.json();
    const totalCount = parseInt(res.headers.get("content-range")?.split("/")[1] || "0", 10);

    return NextResponse.json({
      success: true,
      users,
      data: users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
