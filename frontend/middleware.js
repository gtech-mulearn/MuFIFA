import { NextResponse } from "next/server";

/**
 * Verify a JWT token's HMAC-SHA256 signature and expiry using the Web Crypto API.
 * This runs in Edge Runtime where Node.js `crypto`/`jsonwebtoken` are unavailable.
 */
async function isTokenValid(token) {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode payload and check expiry first (cheap check)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (!payload || !payload.exp || payload.exp * 1000 <= Date.now()) {
      return false;
    }

    // Verify HMAC-SHA256 signature
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      // If no secret configured, reject all tokens (fail-closed)
      console.error("ADMIN_JWT_SECRET not set — rejecting token in middleware");
      return false;
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureInput = encoder.encode(`${parts[0]}.${parts[1]}`);

    // Convert base64url signature to Uint8Array
    const sigBase64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const sigBinary = atob(sigBase64);
    const signature = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      signature[i] = sigBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, signature, signatureInput);
    return isValid;
  } catch (err) {
    console.error("Failed to verify token in middleware:", err);
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


  // Handle Admin routes
  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get("admin_token")?.value;
    const isLoginPage = pathname === "/admin/login";
    const hasValidAdminToken = await isTokenValid(adminToken);

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
  const hasValidPlayerToken = await isTokenValid(playerToken);

  // Protect Player Dashboard, Tasks/Challenges, Kuzhiundo, Rewards, and Captain routes
  const playerRoutes = ["/dashboard", "/tasks", "/kuzhiundo", "/rewards", "/captain"];
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
