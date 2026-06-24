import { NextResponse } from "next/server";
import { signToken, buildTokenCookie } from "@/utils/auth";

export async function GET() {
  const token = signToken({
    id: "00000000-0000-0000-0000-000000000000",
    username: "debug-admin",
    role: "superadmin",
  });
  
  const response = NextResponse.json({
    success: true,
    message: "Debug admin session initialized.",
    token
  });
  
  response.headers.set("Set-Cookie", buildTokenCookie(token));
  return response;
}
