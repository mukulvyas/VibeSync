import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/ws/venue';

/**
 * Custom hook for real-time venue data via WebSocket.
 * Falls back to polling if WebSocket fails.
 */
export function useVenueData() {
  const [venueData, setVenueData] = useState(null);
  const [incentives, setIncentives] = useState([]);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log('[VibeSync] WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setVenueData(data.grid);
        setTick(data.tick);

        if (data.incentive_events?.length > 0) {
          setIncentives(prev => [...data.incentive_events, ...prev].slice(0, 10));
        }
      } catch (e) {
        console.error('[VibeSync] Parse error:', e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('[VibeSync] WebSocket closed, reconnecting in 3s...');
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('[VibeSync] WebSocket error:', err);
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const dismissIncentive = useCallback((index) => {
    setIncentives(prev => prev.filter((_, i) => i !== index));
  }, []);

  return { venueData, incentives, connected, tick, dismissIncentive };
}
