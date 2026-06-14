/**
 * Helper to resolve the correct backend API endpoint.
 * Points to the same-origin Next.js serverless API routes.
 */
export function getBackendUrl(path) {
  return `/api/v1/${path}`;
}
