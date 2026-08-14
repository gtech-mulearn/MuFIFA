/**
 * Shared deadline utility for Ascend portal tasks.
 * Normalizes midnight dates (e.g. "2026-08-12", "2026-08-12T00:00:00Z") to end-of-day (23:59:59.999 UTC).
 */

export const DEFAULT_INITIAL_DEADLINE = "2026-08-12T23:59:59.999Z";

/**
 * Returns the Date object representing the exact cutoff for a deadline.
 * If deadline is missing or invalid, returns default initial cutoff.
 */
export function getDeadlineCutoff(rawDeadline) {
  if (!rawDeadline) {
    return new Date(DEFAULT_INITIAL_DEADLINE);
  }

  const str = String(rawDeadline).trim();
  const d = new Date(str);

  if (isNaN(d.getTime())) {
    return new Date(DEFAULT_INITIAL_DEADLINE);
  }

  // Check if string is date-only (YYYY-MM-DD) or represents 00:00:00 UTC midnight
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(str);
  const isMidnight =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0;

  if (isDateOnly || isMidnight) {
    d.setUTCHours(23, 59, 59, 999);
  }

  return d;
}

/**
 * Checks if a given timestamp (or current time if omitted) is past the cutoff.
 */
export function isPastDeadline(submittedAt, rawDeadline) {
  const cutoff = getDeadlineCutoff(rawDeadline);
  const checkTime = submittedAt ? new Date(submittedAt) : new Date();
  return checkTime > cutoff;
}
