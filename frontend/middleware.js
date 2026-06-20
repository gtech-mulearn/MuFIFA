import { NextResponse } from "next/server";
import { underMaintenanceFlag } from "./flags";

function isTokenValid(token) {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
        return true;
      }
    }
  } catch (err) {
    console.error("Failed to parse token in middleware:", err);
  }
  return false;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Bypass checks for:
  // - API routes
  // - Static files / next assets / favicon
  // - The /development route itself
  if (
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
    console.error("Failed to check UnderMaintenance flag in middleware:", err);
  }

  // Handle Admin routes
  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get("admin_token")?.value;
    const isLoginPage = pathname === "/admin/login";
    const hasValidAdminToken = isTokenValid(adminToken);

    if (isLoginPage) {
      if (hasValidAdminToken) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    if (!hasValidAdminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  const playerToken = request.cookies.get("player_token")?.value;
  const hasValidPlayerToken = isTokenValid(playerToken);

  // Protect Player Dashboard, Tasks/Challenges, Profile, and Kuzhiundo routes
  const playerRoutes = ["/dashboard", "/tasks", "/profile", "/kuzhiundo"];
  const isPlayerRoute = playerRoutes.some((route) => pathname.startsWith(route));

  if (isPlayerRoute) {
    if (!hasValidPlayerToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Redirect to dashboard if logged in and accessing access pages or root
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    if (hasValidPlayerToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
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
