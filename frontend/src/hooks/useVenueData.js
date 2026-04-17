import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/ws/venue';

/**
 * Custom hook for real-time venue data via WebSocket.
 * Now includes agent log messages.
 */
export function useVenueData() {
  const [venueData, setVenueData] = useState(null);
  const [incentives, setIncentives] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);
  const [atmosphere, setAtmosphere] = useState({ noise_level_db: 0, air_quality_aqi: 0, wifi_mesh_mbps: 0 });
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

        if (data.agent_logs) {
          setAgentLogs(data.agent_logs);
        }

        // UPGRADE: Extract atmosphere metrics
        if (data.noise_level_db !== undefined) {
          setAtmosphere({
            noise_level_db: data.noise_level_db,
            air_quality_aqi: data.air_quality_aqi,
            wifi_mesh_mbps: data.wifi_mesh_mbps
          });
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

  return { venueData, incentives, agentLogs, connected, tick, dismissIncentive, atmosphere };
}
