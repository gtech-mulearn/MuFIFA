import { NextResponse } from "next/server";
import { generateTicketPng } from "@/utils/email";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") || "Test Player";
    const user_id = searchParams.get("user_id") || "test_user";
    const team = searchParams.get("team") || "Brazil";
    const domain = searchParams.get("domain") || "Coder";
    const created_at = searchParams.get("created_at") || new Date().toISOString();

    const pngBuffer = await generateTicketPng({
      name,
      user_id,
      team,
      domain,
      created_at,
    });

    return new NextResponse(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to generate ticket preview:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
