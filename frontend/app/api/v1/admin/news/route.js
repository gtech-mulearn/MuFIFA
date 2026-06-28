import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function POST(request) {
  try {
    const auth = requireRole(request, "admin", "superadmin");
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { title, content, type, image_url, action_url } = body;

    if (!title || !content || !type) {
      return NextResponse.json(
        { success: false, error: "Title, content, and type are required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const res = await fetch(`${supabaseUrl}/rest/v1/news_updates`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ title, content, type, image_url, action_url }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create news: ${await res.text()}`);
    }

    const created = await res.json();
    return NextResponse.json({ success: true, data: created[0] });
  } catch (error) {
    console.error("Admin POST news error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const auth = requireRole(request, "admin", "superadmin");
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { id, title, content, type, image_url, action_url } = body;

    if (!id || !title || !content || !type) {
      return NextResponse.json(
        { success: false, error: "ID, title, content, and type are required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const res = await fetch(`${supabaseUrl}/rest/v1/news_updates?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ title, content, type, image_url, action_url }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update news: ${await res.text()}`);
    }

    const updated = await res.json();
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("Admin PUT news error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = requireRole(request, "admin", "superadmin");
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.message },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const res = await fetch(`${supabaseUrl}/rest/v1/news_updates?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to delete news: ${await res.text()}`);
    }

    return NextResponse.json({ success: true, message: "News deleted successfully." });
  } catch (error) {
    console.error("Admin DELETE news error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
