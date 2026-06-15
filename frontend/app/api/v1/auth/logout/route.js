import { NextResponse } from "next/server";

const PLAYER_COOKIE = "player_token";

function clearPlayerTokenCookie() {
  return `${PLAYER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });
  response.headers.set("Set-Cookie", clearPlayerTokenCookie());
  return response;
}
