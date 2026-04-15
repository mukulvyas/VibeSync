import { useState, useCallback } from 'react';
import { useVenueData } from './hooks/useVenueData';
import VibeMap from './components/VibeMap';
import FindMySeat from './components/FindMySeat';
import LineBuddy from './components/LineBuddy';
import GuardianSOS from './components/GuardianSOS';
import StaffDashboard from './components/StaffDashboard';
import IncentiveToast from './components/IncentiveToast';

export default function App() {
  const { venueData, incentives, connected, tick, dismissIncentive } = useVenueData();
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

  return (
    <div className="min-h-screen bg-vibe-dark">
      {/* ── Header ──────────────────────────── */}
      <header className="sticky top-0 z-30 glass-panel rounded-none border-x-0 border-t-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vibe-cyan to-vibe-magenta flex items-center justify-center shadow-glow-cyan">
              <span className="text-xl">🎶</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-vibe-cyan via-white to-vibe-magenta bg-clip-text text-transparent">
                VibeSync
              </h1>
              <p className="text-[10px] text-gray-500 -mt-0.5 tracking-wider">AI STADIUM COMPANION</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className="flex items-center gap-2 px-3 py-1.5 glass-card text-xs">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-vibe-lime animate-pulse' : 'bg-vibe-red'}`} />
              <span className="text-gray-400 hidden sm:inline">
                {connected ? 'Live' : 'Offline'}
              </span>
              {connected && (
                <span className="text-gray-600">T:{tick}</span>
              )}
            </div>

            {/* Staff mode badge */}
            {staffMode && (
              <div className="px-3 py-1.5 bg-vibe-red/20 border border-vibe-red/40 rounded-xl text-xs text-vibe-red font-bold animate-pulse">
                🔒 STAFF
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {staffMode ? (
          /* ── Staff View ─────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VibeMap
                venueData={venueData}
                path={path}
                sosAlerts={sosAlerts}
                onCellClick={setSelectedCell}
              />
            </div>
            <div>
              <StaffDashboard onAlertsUpdate={handleAlertsUpdate} />
            </div>
          </div>
        ) : (
          /* ── User View ──────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map — takes 2 cols on large screens */}
            <div className="lg:col-span-2 space-y-6">
              <VibeMap
                venueData={venueData}
                path={path}
                sosAlerts={sosAlerts}
                onCellClick={setSelectedCell}
              />

              {/* Selected cell info */}
              {selectedCell && (
                <div className="glass-card p-4 animate-slide-up flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Selected Cell</p>
                    <p className="text-sm text-white font-semibold">
                      {selectedCell.seat_id || `${selectedCell.cell_type} (${selectedCell.row}, ${selectedCell.col})`}
                    </p>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Density</p>
                      <p className={`text-sm font-bold ${
                        selectedCell.density > 0.7 ? 'text-vibe-red' :
                        selectedCell.density > 0.4 ? 'text-vibe-amber' : 'text-vibe-lime'
                      }`}>
                        {(selectedCell.density * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Temp</p>
                      <p className="text-sm font-bold text-vibe-cyan">{selectedCell.temperature}°C</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Control Panel — right sidebar on large, stacked on mobile */}
            <div className="space-y-4">
              <FindMySeat
                onPathFound={setPath}
                onClear={() => setPath(null)}
              />
              <LineBuddy />
              <GuardianSOS />
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-vibe-border/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-gray-600">
          <p>VibeSync v1.0 — Agentic AI Stadium Companion</p>
          <p className="hidden sm:block">FlowAgent · SyncAgent · GuardianAgent</p>
        </div>
      </footer>

      {/* ── Incentive Toast (floating) ──────── */}
      <IncentiveToast incentives={incentives} onDismiss={dismissIncentive} />
    </div>
  );
}
