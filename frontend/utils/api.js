/**
 * Helper to resolve the correct backend API endpoint.
 * If NEXT_PUBLIC_BACKEND_API_URL is configured (e.g. during local machine testing),
 * requests will connect directly from the browser. Otherwise, they route through
 * the Next.js serverless API proxy.
 */
export function getBackendUrl(path) {
  const directUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (directUrl) {
    return `${directUrl}/${path}`;
  }
  return `/api/proxy?path=${path}`;
}
