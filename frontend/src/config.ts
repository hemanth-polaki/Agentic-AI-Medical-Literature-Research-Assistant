/**
 * Application environment configuration
 * In development, defaults to relative /api paths proxied by Vite.
 * In production (e.g. Vercel), points to the Render backend service via VITE_API_URL.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.info(
    '[BrightLit AI] VITE_API_URL is not set. API calls will use relative paths. ' +
    'If your backend is hosted on Render, configure VITE_API_URL in your Vercel Project Settings.'
  );
}

