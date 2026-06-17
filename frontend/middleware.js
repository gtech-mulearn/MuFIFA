import { NextResponse } from "next/server";
import { underMaintenanceFlag } from "./flags";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Bypass checks for:
  // - Admin routes
  // - API routes
  // - Static files / next assets / favicon
  // - The /development route itself
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/development" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    const flagVal = await underMaintenanceFlag();
    const isUnderMaintenance = flagVal?.under_maintainence === true;
    if (isUnderMaintenance) {
      const devUrl = new URL("/development", request.url);
      return NextResponse.redirect(devUrl);
    }
  } catch (err) {
    console.error("Failed to check UnderMaintainence flag in middleware:", err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
