import { useState, useEffect } from 'react';
import { getAlerts, resolveAlert } from '../utils/api';

/**
 * StaffDashboard — security view showing active SOS alerts with seat locations.
 */
export default function StaffDashboard({ onAlertsUpdate }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Poll for alerts every 2 seconds
  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const data = await getAlerts();
        if (active) {
          setAlerts(data.alerts || []);
          onAlertsUpdate?.(data.alerts || []);
        }
      } catch (e) {
        console.error('Alert poll error:', e);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [onAlertsUpdate]);

  async function handleResolve(alertId) {
    setLoading(true);
    try {
      await resolveAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (e) {
      console.error('Resolve error:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-vibe-red flex items-center gap-2">
          🔒 Security Dashboard
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 bg-vibe-red/20 text-vibe-red text-xs rounded-full font-bold animate-pulse">
              {alerts.length} ACTIVE
            </span>
          )}
        </h2>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm text-gray-400">No active alerts — all clear</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 bg-vibe-red/5 border border-vibe-red/30 rounded-xl animate-slide-up"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-vibe-red font-bold text-sm">🚨 {alert.alert_level}</span>
                    <span className="text-xs text-gray-500">#{alert.id}</span>
                  </div>
                  <p className="text-sm text-white font-semibold">Seat {alert.seat_id}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    📍 Grid Position: ({alert.x}, {alert.y})
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg
                             hover:bg-green-500/30 transition-colors"
                >
                  ✓ Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
