import { useState, useCallback } from 'react';
import { useVenueData } from './hooks/useVenueData';
import VibeMap from './components/VibeMap';
import FindMySeat from './components/FindMySeat';
import LineBuddy from './components/LineBuddy';
import GuardianSOS from './components/GuardianSOS';
import StaffDashboard from './components/StaffDashboard';
import IncentiveToast from './components/IncentiveToast';
import AgentLog from './components/AgentLog';
import ScenarioPanel from './components/ScenarioPanel';

export default function App() {
  const { venueData, incentives, agentLogs, connected, tick, dismissIncentive } = useVenueData();
  const [path, setPath] = useState(null);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [staffMode, setStaffMode] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null);

  // Triple-tap on logo to toggle staff mode
  function handleLogoClick() {
    const next = tapCount + 1;
    if (next >= 3) {
      setStaffMode((prev) => !prev);
      setTapCount(0);
    } else {
      setTapCount(next);
      setTimeout(() => setTapCount(0), 2000);
    }
  }

  const handleAlertsUpdate = useCallback((alerts) => {
    setSosAlerts(alerts);
  }, []);

  // Compute live stats
  const liveStats = venueData ? computeStats(venueData) : null;

  return (
    <div className="min-h-screen ambient-bg">
      {/* ── Header ──────────────────────────── */}
      <header className="sticky top-0 z-30" style={{
        background: 'rgba(11,14,20,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #d946ef)',
                boxShadow: '0 0 20px rgba(6,182,212,0.3)',
              }}>
              <span className="text-xl">🎶</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-wide text-glow-cyan"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #fff, #d946ef)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                VibeSync
              </h1>
              <p className="text-[9px] text-gray-600 -mt-0.5 tracking-[0.3em] uppercase">
                Stadium Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live stats pills */}
            {liveStats && (
              <div className="hidden md:flex items-center gap-3">
                <StatPill label="AVG" value={`${liveStats.avgDensity}%`} color="#06b6d4" />
                <StatPill label="PEAK" value={`${liveStats.peakDensity}%`} color={liveStats.peakDensity > 80 ? '#ef4444' : '#f59e0b'} />
                <StatPill label="TEMP" value={`${liveStats.avgTemp}°`} color="#84cc16" />
              </div>
            )}

            {/* Connection status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}
                style={{ boxShadow: connected ? '0 0 8px rgba(74,222,128,0.5)' : undefined }} />
              <span className="text-gray-500 hidden sm:inline">{connected ? 'LIVE' : 'OFFLINE'}</span>
              {connected && <span className="text-gray-700 tabular-nums font-mono text-[10px]">T:{tick}</span>}
            </div>

            {/* Staff mode badge */}
            {staffMode && (
              <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider animate-pulse"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444',
                }}>
                🔒 STAFF MODE
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        {staffMode ? (
          /* ── Staff Operations View ─────── */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-8 min-w-0">
              <VibeMap venueData={venueData} path={path} sosAlerts={sosAlerts} onCellClick={setSelectedCell} />
            </div>
            <div className="xl:col-span-4 space-y-5 min-w-0">
              <StaffDashboard onAlertsUpdate={handleAlertsUpdate} />
              <AgentLog logs={agentLogs} />
            </div>
          </div>
        ) : (
          /* ── Main Operations Dashboard ── */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Left: Arena Map */}
            <div className="xl:col-span-8 space-y-5 min-w-0">
              <VibeMap
                venueData={venueData}
                path={path}
                sosAlerts={sosAlerts}
                onCellClick={setSelectedCell}
              />

              {/* Selected cell detail bar */}
              {selectedCell && (
                <div className="glass-card p-4 flex items-center justify-between" style={{ animation: 'logSlideIn 0.3s ease-out' }}>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Selected Sector</p>
                    <p className="text-sm text-white font-semibold mt-0.5">
                      {selectedCell.seat_id || `${selectedCell.cell_type.toUpperCase()} (${selectedCell.row}, ${selectedCell.col})`}
                    </p>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">Density</p>
                      <p className={`text-sm font-bold tabular-nums ${
                        selectedCell.density > 0.7 ? 'text-red-400' :
                        selectedCell.density > 0.4 ? 'text-amber-400' : 'text-green-400'
                      }`}>
                        {(selectedCell.density * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">Temp</p>
                      <p className="text-sm font-bold text-cyan-400 tabular-nums">{selectedCell.temperature}°C</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">Type</p>
                      <p className="text-sm font-bold text-gray-300">{selectedCell.cell_type}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scenario Injection */}
              <ScenarioPanel />
            </div>

            {/* Right: Sidebar */}
            <div className="xl:col-span-4 space-y-5 min-w-0">
              {/* Agent Neural Link */}
              <AgentLog logs={agentLogs} />

              {/* Controls */}
              <FindMySeat onPathFound={setPath} onClear={() => setPath(null)} />
              <LineBuddy />
              <GuardianSOS />
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }} className="mt-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-[10px] text-gray-700 tracking-wider uppercase">
          <p>VibeSync v2.0 — Stadium Operations AI</p>
          <p className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-800" /> FlowAgent</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-800" /> SyncAgent</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-800" /> Guardian</span>
          </p>
        </div>
      </footer>

      {/* ── Incentive Toast (floating) ──────── */}
      <IncentiveToast incentives={incentives} onDismiss={dismissIncentive} />
    </div>
  );
}


/* ── Stat Pill Sub-component ─────────────────── */
function StatPill({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: `${color}80` }}>{label}</span>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}


/* ── Stats Calculator ────────────────────────── */
function computeStats(grid) {
  let totalDensity = 0;
  let totalTemp = 0;
  let peakDensity = 0;
  let count = 0;

  for (const row of grid) {
    for (const cell of row) {
      totalDensity += cell.density;
      totalTemp += cell.temperature;
      peakDensity = Math.max(peakDensity, cell.density);
      count++;
    }
  }

  return {
    avgDensity: Math.round((totalDensity / count) * 100),
    peakDensity: Math.round(peakDensity * 100),
    avgTemp: (totalTemp / count).toFixed(1),
  };
}
