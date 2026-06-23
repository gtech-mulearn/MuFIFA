import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function GET(request) {
  try {
    const auth = requireRole(request, "viewer", "admin", "superadmin", "merch_partner");
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
    const status = searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "count-exact",
    };

    let searchFilter = "";
    if (search.trim()) {
      const cleanSearch = search.trim();
      
      // 1. Fetch matching registrations
      const regRes = await fetch(
        `${supabaseUrl}/rest/v1/registrations?or=(name.ilike.*${encodeURIComponent(cleanSearch)}*,email.ilike.*${encodeURIComponent(cleanSearch)}*)&select=user_id`,
        { headers, next: { revalidate: 0 } }
      );
      const regUsers = regRes.ok ? await regRes.json() : [];
      const userIds = regUsers.map((u) => u.user_id);

      // 2. Fetch matching merchandise items
      const merchRes = await fetch(
        `${supabaseUrl}/rest/v1/merch_items?title=ilike.*${encodeURIComponent(cleanSearch)}*&select=id`,
        { headers, next: { revalidate: 0 } }
      );
      const merchItems = merchRes.ok ? await merchRes.json() : [];
      const merchIds = merchItems.map((m) => m.id);

      if (userIds.length === 0 && merchIds.length === 0) {
        return NextResponse.json({
          success: true,
          claims: [],
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      const orConditions = [];
      if (userIds.length > 0) {
        // Enclose in double quotes to handle special characters (e.g. auth0|...)
        const formattedUserIds = userIds.map((id) => `"${id}"`).join(",");
        orConditions.push(`user_id.in.(${formattedUserIds})`);
      }
      if (merchIds.length > 0) {
        orConditions.push(`merch_id.in.(${merchIds.join(",")})`);
      }

      searchFilter = `&or=(${orConditions.join(",")})`;
    }

    let statusFilter = "";
    if (status) {
      statusFilter = `&status=eq.${encodeURIComponent(status)}`;
    }

    // Fetch user_merch_claims paginated
    const url = `${supabaseUrl}/rest/v1/user_merch_claims?select=id,user_id,merch_id,claimed_at,status,merch_items(id,title,image_url,min_level,min_points)&order=claimed_at.desc&offset=${offset}&limit=${limit}${statusFilter}${searchFilter}`;
    const res = await fetch(url, { method: "GET", headers, next: { revalidate: 0 } });

    if (!res.ok) {
      throw new Error(`Failed to fetch claims: ${await res.text()}`);
    }

    const claims = await res.json();
    const totalCount = parseInt(res.headers.get("content-range")?.split("/")[1] || "0", 10);

    // Resolve user details
    let mergedClaims = [];
    if (claims.length > 0) {
      const userIdsToFetch = Array.from(new Set(claims.map((c) => c.user_id)));
      let usersMap = {};

      if (userIdsToFetch.length > 0) {
        const formattedFetchUserIds = userIdsToFetch.map((id) => `"${id}"`).join(",");
        const usersUrl = `${supabaseUrl}/rest/v1/registrations?user_id=in.(${formattedFetchUserIds})&select=user_id,name,email,phone,mu_points`;
        const usersRes = await fetch(usersUrl, { headers, next: { revalidate: 0 } });
        if (usersRes.ok) {
          const usersList = await usersRes.json();
          usersList.forEach((u) => {
            usersMap[u.user_id] = u;
          });
        }
      }

      mergedClaims = claims.map((c) => ({
        ...c,
        user: usersMap[c.user_id] || {
          name: "Unknown Player",
          email: "unknown@mulearn.org",
          phone: "-",
          mu_points: 0,
        },
      }));
    }

    return NextResponse.json({
      success: true,
      claims: mergedClaims,
      data: mergedClaims,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Admin claims list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch merchandise claims.",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = requireRole(request, "superadmin", "admin", "merch_partner");
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

    const { id, status } = body;

    if (!id || status === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Claim ID and status are required.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const VALID_STATUSES = ["Status pending", "order confirmed", "Out for delivery", "Shipped", "Delivered"];
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/user_merch_claims?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update status: ${await res.text()}`);
    }

    return NextResponse.json({
      success: true,
      message: "Claim status updated successfully.",
    });
  } catch (error) {
    console.error("Admin PATCH claim error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update claim status.",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
