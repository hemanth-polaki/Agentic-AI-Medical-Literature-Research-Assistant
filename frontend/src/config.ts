/**
 * Application environment configuration
 * In development, defaults to relative /api paths proxied by Vite.
 * In production (e.g. Vercel), points to the Render backend service via VITE_API_URL.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
