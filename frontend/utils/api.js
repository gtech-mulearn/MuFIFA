/**
 * Helper to resolve the correct backend API endpoint directly.
 * Calls the backend API directly from the client side without proxying.
 */
export function getBackendUrl(path) {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000/api/v1";
  return `${baseUrl}/${path}`;
}
