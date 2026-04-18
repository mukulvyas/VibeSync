import { useState, useEffect } from "react";
import { getAlerts, resolveAlert } from "../utils/api";

/**
 * StaffDashboard — Command Center with diagnostics, SOS alerts, and
 * UPGRADE 5: Live Congestion Bar Chart using pure SVG.
 */

const CONGESTION_ZONES = [
  { label: "Gate Alfa", pct: 28, color: "#2ED573" },
  { label: "Sec North B", pct: 82, color: "#FF4757" },
  { label: "VIP Level 2", pct: 41, color: "#FFA502" },
  { label: "Parking W", pct: 97, color: "#FF4757" },
];

function barColor(pct) {
  if (pct > 80) return "#FF4757";
  if (pct > 60) return "#FFA502";
  return "#2ED573";
}

export default function StaffDashboard({ onAlertsUpdate, venueData }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

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
        console.error("Alert poll error:", e);
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
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (e) {
      console.error("Resolve error:", e);
    } finally {
      setLoading(false);
    }
  }

  const diagnostics = venueData ? computeDiagnostics(venueData) : null;

  return (
    <div className="glass-panel p-5 animate-fade-in space-y-5">
      {/* ── System Diagnostics ── */}
      <div>
        <SectionHeader label="System Diagnostics" />
        {diagnostics && (
          <div className="grid grid-cols-3 gap-2">
            <DiagTile
              label="Atmosphere"
              value={diagnostics.atmosphereScore}
              unit=""
              color={
                diagnostics.atmosphereScore > 80
                  ? "#2ED573"
                  : diagnostics.atmosphereScore > 60
                    ? "#FFA502"
                    : "#FF4757"
              }
            />
            <DiagTile
              label="Neural Load"
              value={diagnostics.neuralLoad}
              unit="%"
              color={
                diagnostics.neuralLoad > 85
                  ? "#FF4757"
                  : diagnostics.neuralLoad > 60
                    ? "#FFA502"
                    : "#00D4FF"
              }
            />
            <DiagTile
              label="SOS Active"
              value={alerts.length}
              unit=""
              color={alerts.length > 0 ? "#FF4757" : "#2ED573"}
              pulse={alerts.length > 0}
            />
          </div>
        )}
      </div>

      {/* ── Congestion Monitor ── */}
      <div>
        <SectionHeader label="Congestion Monitor" />
        <style>{`
          @keyframes barExpand { from { width: 0; } }
        `}</style>
        <div className="space-y-2">
          {CONGESTION_ZONES.map((z, i) => {
            const col = barColor(z.pct);
            return (
              <div key={z.label}>
                <div className="flex justify-between items-center mb-1">
                  <span
                    className="text-[9px] font-mono tracking-widest"
                    style={{ color: "#5a7a8a" }}
                  >
                    {z.label}
                  </span>
                  <span
                    className="text-[10px] font-bold font-mono"
                    style={{ color: col }}
                  >
                    {z.pct}%
                  </span>
                </div>
                <div
                  className="h-1.5 w-full rounded-none"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="h-full rounded-none"
                    style={{
                      background: col,
                      width: `${z.pct}%`,
                      boxShadow: `0 0 6px ${col}88`,
                      animation: `barExpand 1.2s ${i * 0.15}s ease both`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active Alerts ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-sm font-bold tracking-[0.15em] uppercase font-mono flex items-center gap-2"
            style={{ color: "#FF4757" }}
          >
            🔒 Security Alerts
            {alerts.length > 0 && (
              <span
                className="px-2 py-0.5 text-xs font-bold animate-pulse"
                style={{
                  background: "rgba(255,71,87,0.15)",
                  border: "1px solid rgba(255,71,87,0.3)",
                  color: "#FF4757",
                }}
              >
                {alerts.length} ACTIVE
              </span>
            )}
          </h3>
        </div>
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-1 opacity-50">✅</div>
            <p
              className="text-xs tracking-widest uppercase font-mono"
              style={{ color: "#5a7a8a" }}
            >
              All sectors nominal
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3"
                style={{
                  background: "rgba(255,71,87,0.04)",
                  border: "1px solid rgba(255,71,87,0.2)",
                  borderLeft: "3px solid #FF4757",
                  animation: "logSlideIn 0.3s ease-out",
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-bold text-xs font-mono"
                        style={{ color: "#FF4757" }}
                      >
                        🚨 {alert.alert_level}
                      </span>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: "#5a7a8a" }}
                      >
                        #{alert.id}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Seat {alert.seat_id}
                    </p>
                    <p
                      className="text-[10px] mt-0.5 font-mono"
                      style={{ color: "#5a7a8a" }}
                    >
                      📍 ({alert.x}, {alert.y})
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "#5a7a8a" }}
                    >
                      {alert.message}
                    </p>
                    <p
                      className="text-[9px] mt-0.5 font-mono"
                      style={{ color: "#3a5a6a" }}
                    >
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: "rgba(46, 213, 115, 0.1)",
                      border: "1px solid rgba(46, 213, 115, 0.3)",
                      color: "#2ED573",
                    }}
                  >
                    ✓ Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-2 h-2 bg-cyan-400 animate-pulse inline-block" />
      <h2
        className="text-[11px] font-bold tracking-[0.2em] uppercase font-mono"
        style={{ color: "#00d2ff" }}
      >
        {label}
      </h2>
    </div>
  );
}

function DiagTile({ label, value, unit, color, pulse = false }) {
  return (
    <div
      className={`flex flex-col items-center py-3 px-2 ${pulse ? "animate-pulse" : ""}`}
      style={{
        background: "#0A0E1A",
        border: `1px solid ${color}30`,
        borderBottom: `2px solid ${color}`,
      }}
    >
      <span
        className="text-xs font-mono font-bold tracking-[0.2em] uppercase mb-1"
        style={{ color: "#5a7a8a" }}
      >
        {label}
      </span>
      <span
        className="text-lg font-bold tabular-nums font-mono"
        style={{ color }}
      >
        {value}
        {unit}
      </span>
    </div>
  );
}

function computeDiagnostics(grid) {
  let totalDensity = 0,
    peakDensity = 0,
    count = 0;
  for (const row of grid) {
    for (const cell of row) {
      totalDensity += cell.density;
      peakDensity = Math.max(peakDensity, cell.density);
      count++;
    }
  }
  const avgDensity = totalDensity / count;
  return {
    atmosphereScore: Math.round(100 - avgDensity * 30),
    neuralLoad: Math.min(100, Math.round(peakDensity * 80 + 20)),
  };
}
