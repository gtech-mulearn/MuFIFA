import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET environment variable is required. Refusing to start with no JWT secret.");
}
const TOKEN_COOKIE = "admin_token";
const TOKEN_EXPIRY = "24h";

/**
 * Hash a plaintext password with bcrypt (10 salt rounds).
 */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 */
export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * Sign a JWT payload with the admin secret.
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify and decode a JWT token. Returns the decoded payload or null.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Extract the admin session from the request's cookie.
 * Returns { id, username, role } or null if invalid/missing.
 */
export function getAdminFromRequest(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]*)`));
  if (!match) return null;

  const token = match[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) return null;

  return { id: decoded.id, username: decoded.username, role: decoded.role };
}

/**
 * Require the request to be authenticated with one of the given roles.
 * Returns the admin object if valid, or a NextResponse error.
 */
export function requireRole(request, ...roles) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return { error: true, status: 401, message: "Authentication required." };
  }
  if (roles.length > 0 && !roles.includes(admin.role)) {
    return { error: true, status: 403, message: "Insufficient permissions." };
  }
  return { error: false, admin };
}

/**
 * Build a Set-Cookie header string for the admin token.
 */
export function buildTokenCookie(token) {
  const maxAge = 24 * 60 * 60; // 24 hours in seconds
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${TOKEN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=${maxAge}`;
}

/**
 * Build a Set-Cookie header string to clear the admin token.
 */
export function clearTokenCookie() {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=0`;
}
