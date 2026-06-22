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

  let isUnderMaintenance = false;
  const hasVercelEnv = !!(
    process.env.EDGE_CONFIG ||
    process.env.VERCEL_PROJECT_ID ||
    process.env.VERCEL_ENV
  );

  if (hasVercelEnv) {
    try {
      // Race the flag check with a 150ms timeout to avoid blocking page loads on slow API responses
      const flagVal = await Promise.race([
        underMaintenanceFlag(),
        new Promise((resolve) =>
          setTimeout(() => resolve({ under_maintainence: false }), 150)
        ),
      ]);
      isUnderMaintenance = flagVal?.under_maintainence === true;
    } catch (err) {
      console.error("Failed to check UnderMaintenance flag in middleware:", err);
    }
  }

  if (isUnderMaintenance) {
    const devUrl = new URL("/development", request.url);
    return NextResponse.redirect(devUrl);
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

  // Protect Player Dashboard, Tasks/Challenges, Kuzhiundo, and Rewards routes
  const playerRoutes = ["/dashboard", "/tasks", "/kuzhiundo", "/rewards"];
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
