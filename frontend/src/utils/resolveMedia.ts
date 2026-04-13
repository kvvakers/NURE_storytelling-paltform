const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/**
 * Resolves a media path to a full URL.
 * - Relative /uploads/... paths are prefixed with the API base URL.
 * - Absolute http(s) and data: URLs are returned as-is.
 * - Null/empty returns an empty string.
 */
export function resolveMedia(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  return `${API_BASE}${path}`;
}
