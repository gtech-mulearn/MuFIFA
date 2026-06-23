import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function GET(request) {
  try {
    const auth = requireRole(request, "admin", "superadmin", "viewer", "merch_partner");
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

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Fetch items with count of claims
    const url = `${supabaseUrl}/rest/v1/merch_items?select=*,user_merch_claims(count)&order=id.asc`;
    const res = await fetch(url, { headers, next: { revalidate: 0 } });
    if (!res.ok) {
      throw new Error(`Failed to fetch merch items: ${await res.text()}`);
    }
    const merchItems = await res.json();

    // Map user_merch_claims count to claimed_count
    const data = merchItems.map(item => {
      const claimed_count = item.user_merch_claims?.[0]?.count || 0;
      const { user_merch_claims, ...rest } = item;
      return {
        ...rest,
        claimed_count,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Admin GET rewards error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch rewards.",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, "admin", "superadmin", "merch_partner");
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

    const body = await request.json();
    const {
      title,
      description,
      tag,
      min_level,
      min_points,
      quantity,
      is_released,
      sponsor_name,
      sponsor_url,
      buy_url,
      image_url,
    } = body;

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Title is required.",
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
      Prefer: "return=representation",
    };

    const payload = {
      title,
      description: description || "",
      tag: tag || "",
      min_level: parseInt(min_level || 1, 10),
      min_points: parseInt(min_points || 0, 10),
      quantity: parseInt(quantity || 0, 10),
      is_released: is_released !== false,
      sponsor_name: sponsor_name || "Zycoz",
      sponsor_url: sponsor_url || "https://www.zycoz.com/",
      buy_url: buy_url || "",
      image_url: image_url || "",
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/merch_items`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to create merch item: ${await res.text()}`);
    }

    const created = await res.json();
    return NextResponse.json({ success: true, data: created[0] });
  } catch (error) {
    console.error("Admin POST rewards error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create reward item.",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = requireRole(request, "admin", "superadmin", "merch_partner");
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Merchandise ID is required in query params.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    const payload = {};
    if (body.title !== undefined) payload.title = body.title;
    if (body.description !== undefined) payload.description = body.description;
    if (body.tag !== undefined) payload.tag = body.tag;
    if (body.min_level !== undefined) payload.min_level = parseInt(body.min_level, 10);
    if (body.min_points !== undefined) payload.min_points = parseInt(body.min_points, 10);
    if (body.quantity !== undefined) payload.quantity = parseInt(body.quantity, 10);
    if (body.is_released !== undefined) payload.is_released = !!body.is_released;
    if (body.sponsor_name !== undefined) payload.sponsor_name = body.sponsor_name;
    if (body.sponsor_url !== undefined) payload.sponsor_url = body.sponsor_url;
    if (body.buy_url !== undefined) payload.buy_url = body.buy_url;
    if (body.image_url !== undefined) payload.image_url = body.image_url;

    payload.updated_at = new Date().toISOString();

    const res = await fetch(`${supabaseUrl}/rest/v1/merch_items?id=eq.${parseInt(id, 10)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to update merch item: ${await res.text()}`);
    }

    const updated = await res.json();
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("Admin PATCH rewards error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update reward item.",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Merchandise ID is required in query params.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/merch_items?id=eq.${parseInt(id, 10)}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to delete merch item: ${await res.text()}`);
    }

    return NextResponse.json({ success: true, message: "Merchandise item deleted successfully." });
  } catch (error) {
    console.error("Admin DELETE rewards error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete reward item.",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
