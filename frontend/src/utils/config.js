/**
 * API / WebSocket base URLs — dev hits localhost; production uses same origin (Cloud Run).
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? 'http://localhost:8000' : '');

export function getVenueWebSocketUrl() {
  if (import.meta.env.DEV) {
    return 'ws://localhost:8000/ws/venue';
  }
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws/venue`;
}
