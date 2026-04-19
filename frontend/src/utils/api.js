/**
 * VibeSync API helpers — fetch wrappers for all backend endpoints.
 */

import { API_BASE } from './config.js';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API Error');
  }
  return res.json();
}

/** GET current venue grid state */
export const getVenue = () => request('/venue');

/** GET all valid seat IDs */
export const getSeats = () => request('/seats');

/** POST find cool path to a seat */
export const findPath = (seatId, startRow = 0, startCol = 0) =>
  request('/find-path', {
    method: 'POST',
    body: JSON.stringify({ seat_id: seatId, start_row: startRow, start_col: startCol }),
  });

/** POST trigger SOS alert */
export const triggerSOS = (seatId) =>
  request('/sos', {
    method: 'POST',
    body: JSON.stringify({ seat_id: seatId }),
  });

/** GET active SOS alerts (staff view) */
export const getAlerts = () => request('/sos/alerts');

/** POST resolve an SOS alert */
export const resolveAlert = (alertId) =>
  request(`/sos/resolve/${alertId}`, { method: 'POST' });

/** POST join Line-Buddy queue */
export const joinQueue = (userId, fanInterest) =>
  request('/join-queue', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, fan_interest: fanInterest }),
  });

/** GET queue stats */
export const getQueueStats = () => request('/queue-stats');

/** POST chat message to Gemini Concierge */
export const chatWithAI = (message, venueState, history = []) =>
  request('/concierge', {
    method: 'POST',
    body: JSON.stringify({ message, venue_state: venueState, history }),
  });

/** POST get operational agent insight */
export const getAgentInsight = (venueState, eventType) =>
  request('/agent-insight', {
    method: 'POST',
    body: JSON.stringify({ venue_state: venueState, event_type: eventType }),
  });

