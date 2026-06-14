import { NextResponse } from "next/server";
import { clearTokenCookie } from "@/utils/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out." });
  response.headers.set("Set-Cookie", clearTokenCookie());
  return response;
}
