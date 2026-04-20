import { useState, useEffect } from "react";
import VibeMap from "./VibeMap";
import AgentLog from "./AgentLog";

export default function OpsDashboard({
  history,
  standCapacities,
  path,
  sosAlerts,
  userPos,
  showHeatmap,
  setShowHeatmap,
  lastEvent,
  liveAgentLogs,
  activeAlerts,
  scenarioMenuOpen,
  setScenarioMenuOpen,
  opsToasts,
  isInsightOpen,
  setIsInsightOpen,
  overrideToast,
  isOverrideActive,
  onOverrideFlow,
  onRunScenario,
  onResolveAlert,
  renderAdminToggle,
  matchState,
}) {
  const isScenarioOpen = scenarioMenuOpen;

  // Scroll locking is now handled centrally in index.css via media queries.
  // This prevents race conditions between JS and CSS on responsive resize.

  return (
    <div className="ops-command-root font-sans selection:bg-cyan-tactical/30 text-text-primary theme-ops">
      <a href="#main-ops-content" className="skip-link">Skip to main content</a>
      <header className="ops-command-header grid-texture">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 border-2 border-cyan-tactical flex items-center justify-center text-cyan-tactical font-black text-base shadow-[0_0_20px_rgba(0,212,255,0.4)]">
            VS
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-black tracking-[0.08em] text-white font-heading truncate">Ops Command</h1>
            <span className="text-[9px] font-bold text-cyan-tactical/60 tracking-[0.18em] font-heading truncate">Mission Control v4</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {renderAdminToggle()}
          <div className={`status-pill-badge ${isOverrideActive ? 'border-red-500/50 text-red-500' : ''}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isOverrideActive ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-green-500 shadow-[0_0_10px_#10b981]'} animate-pulse`} />
            {isOverrideActive ? 'MANUAL CONTROL' : 'SYSTEM ONLINE'}
          </div>
        </div>
      </header>

      <div className="ops-command-content-row">
        <aside 
          className="ops-panel-left" 
          style={scenarioMenuOpen ? { overflow: 'visible !important' } : {}}
        >
          <div className="ops-panel-left-inner">
            <div className="space-y-4">
              <h2 className="tech-header text-cyan-tactical border-b border-white/5 pb-2 font-heading">Predictive Analytics</h2>
              <PredictiveChart label="Crowd Density Analysis" data={history} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MetricBoxSmall label="Current Capacity" value="92%" color="#00D4FF" />
              <MetricBoxSmall label="System Load Avg" value="1.4s" color="#FFA502" />
            </div>
            <div className="space-y-8">
              <h2 className="tech-header text-cyan-tactical border-b border-white/5 pb-2 font-heading">System Vitality</h2>
              <HealthBar label="Neural Engine" value={isOverrideActive ? 0 : 88} max={100} unit={isOverrideActive ? "MANUAL" : "%"} color={isOverrideActive ? "#EF4444" : "#00D4FF"} />
              <HealthBar label="Data Latency" value={14} max={100} unit="ms" color="#FFA502" />
              <HealthBar label="Network Uplink" value={98} max={100} unit="%" color="#00D4FF" />
            </div>
            <button
              type="button"
              onClick={onOverrideFlow}
              className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)] transition-all active:scale-95"
              style={{ background: isOverrideActive ? "linear-gradient(135deg, #4B5563, #374151)" : "linear-gradient(135deg, #EF4444, #DC2626)" }}
            >
              {isOverrideActive ? "▶ Resume AI Flow" : "⚠ Override AI Flow"}
            </button>
            <div className="ops-scenario-trigger-wrap">
              <button
                type="button"
                onClick={() => setScenarioMenuOpen((prev) => !prev)}
                className="w-full py-4 rounded-xl text-xs font-black tracking-[0.16em] uppercase"
                style={{
                  border: "1px solid rgba(99,179,237,0.3)",
                  background: "transparent",
                  color: "#60A5FA",
                }}
                aria-expanded={scenarioMenuOpen}
                aria-haspopup="menu"
              >
                ⚡ RUN SCENARIO
              </button>
              {scenarioMenuOpen && (
                <div className="ops-scenario-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="ops-scenario-option"
                    onClick={() => onRunScenario("FULL_HOUSE", "Full House")}
                  >
                    🏟️ Full House
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="ops-scenario-option"
                    onClick={() => onRunScenario("WICKET_STORM", "Wicket Storm")}
                  >
                    ⚡ Wicket Storm
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="ops-scenario-option"
                    onClick={() => onRunScenario("RAIN_DELAY", "Rain Delay")}
                  >
                    🌧️ Rain Delay
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="ops-scenario-option"
                    onClick={() => onRunScenario("MATCH_OVER", "Match Over")}
                  >
                    🏆 Match Over
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="ops-panel-center" id="main-ops-content">
          <div className="ops-map-wrap">
            <div className="absolute top-2 left-2 z-[100] pointer-events-auto">
              <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl p-2 rounded-full border border-white/5 shadow-2xl">
                <span className="text-[10px] font-black tracking-widest text-text-dim uppercase ml-3">Heat Map</span>
                <button
                  type="button"
                  className="w-14 h-7 bg-white/5 rounded-full relative p-1 cursor-pointer border-0"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  aria-pressed={showHeatmap}
                  aria-label={showHeatmap ? "Heat map on" : "Heat map off"}
                >
                  <span
                    className={`block w-5 h-5 rounded-full transition-all duration-300 shadow-lg ${
                      showHeatmap ? "translate-x-7 bg-cyan-tactical" : "translate-x-0 bg-text-dim"
                    }`}
                  />
                </button>
              </div>
            </div>
            <VibeMap
              venueData={null}
              standCapacities={standCapacities}
              path={path}
              sosAlerts={sosAlerts}
              attendeeMode={false}
              userPos={userPos}
              incentives={[]}
              showHeatmap={showHeatmap}
              lastEvent={lastEvent}
              containerHeight="fill"
            />
          </div>
        </main>

        <aside className="ops-panel-right">
          <div className="ops-right-alerts-block flex flex-col min-h-0">
            <h2 className="tech-header text-red-tactical border-b border-white/5 pb-2 mb-3 font-heading shrink-0">Critical Alerts</h2>
            <div className="ops-right-alerts-scroll space-y-4 pr-1 overflow-y-auto" style={{ maxHeight: '280px' }}>
              {activeAlerts.length === 0 ? (
                <div className="text-[11px] text-text-dim px-1">No active critical alerts.</div>
              ) : (
                activeAlerts.map((alert) => (
                  <ActionableAlert
                    key={alert.id}
                    title={alert.title}
                    detail={alert.detail}
                    time={alert.time}
                    status={alert.status}
                    onResolve={() => onResolveAlert(alert)}
                  />
                ))
              )}
            </div>
          </div>
          <div className="ops-right-intel-block flex-1 flex flex-col min-h-0 mt-6">
            <h2 className="tech-header text-cyan-tactical border-b border-white/5 pb-2 mb-3 font-heading shrink-0">Agent Intel</h2>
            <div className="ops-right-intel-scroll pr-1 flex-1 overflow-y-auto">
              <AgentLog logs={liveAgentLogs} fillContainer />
            </div>
          </div>
        </aside>
      </div>

      <OverrideToast visible={overrideToast} />
      <OpsToastStack toasts={opsToasts} />
    </div>
  );
}

function PredictiveChart({ label, data }) {
  const max = Math.max(...data, 100);
  const denom = Math.max(1, data.length - 1);
  const points = data.map((v, i) => `${(i / denom) * 340},${100 - (v / max) * 80}`).join(" ");

  return (
    <div className="p-6 glass-tactical rounded-2xl relative group overflow-hidden">
      <div className="absolute top-0 right-0 p-2 text-[8px] font-black text-cyan-tactical animate-pulse font-heading tracking-[0.2em]">
        Live AI Prediction
      </div>
      <p className="text-[10px] font-black tracking-widest text-text-dim mb-4 font-heading">{label}</p>
      <svg viewBox="0 0 340 100" className="w-full h-24 stroke-cyan-tactical fill-none overflow-visible">
        <polyline
          points={points}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]"
        />
        <path d={`M ${points} L 340,100 L 0,100 Z`} fill="url(#chartGradient)" opacity="0.05" />
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cyan-tactical)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function MetricBoxSmall({ label, value, color }) {
  return (
    <div className="p-4 glass-tactical rounded-xl flex flex-col justify-center relative overflow-hidden metric-pulse-bg">
      <p className="text-[9px] font-black tracking-widest text-text-dim mb-1 relative z-10 font-heading">{label}</p>
      <span className="text-2xl font-black font-data tracking-widest relative z-10" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function ActionableAlert({ title, detail, time, status, onResolve }) {
  const isCritical = status === "critical";
  const stripeColor = isCritical ? "#EF4444" : "var(--amber-tactical)";
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = () => {
    setIsResolving(true);
    setTimeout(() => onResolve?.(), 300);
  };

  return (
    <div
      className={`alert-stripe ${isResolving ? "alert-fade-out" : ""}`}
      style={{ borderLeftColor: stripeColor, borderLeftWidth: "3px" }}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white font-heading tracking-widest">{title}</h4>
            <p className="text-[10px] text-text-dim leading-relaxed">{detail}</p>
          </div>
          <span className="text-[8px] font-data text-text-dim/60">{time}</span>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={handleResolve}
            className="flex-1 py-1.5 text-[10px] font-bold rounded transition-all font-heading"
            style={{ background: "#EF4444", color: "#fff" }}
          >
            Resolve
          </button>
          <button
            type="button"
            className="flex-1 py-1.5 text-[10px] font-bold border border-white/30 bg-transparent text-text-dim hover:text-white rounded transition-all font-heading"
          >
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
}

function HealthBar({ label, value, max, unit, color }) {
  const percent = Math.min(100, (value / max) * 100);
  const segments = 10;
  const activeSegments = Math.floor((percent / 100) * segments);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black tracking-widest text-text-dim font-heading">
        <span>{label}</span>
        <span style={{ color }} className="font-data">
          {value}
          {unit}
        </span>
      </div>
      <div className="segmented-bar">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={`segment ${i < activeSegments ? "active shadow-[0_0_8px_currentColor]" : ""}`}
            style={{ color, backgroundColor: i < activeSegments ? color : undefined }}
          />
        ))}
      </div>
    </div>
  );
}

function OverrideToast({ visible }) {
  if (!visible) return null;
  return (
    <div className="fixed top-6 right-6 z-[10001] px-4 py-3 rounded-xl bg-[#111827] border border-red-500/40 text-white shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
      <p className="text-[11px] font-bold tracking-wide">Override initiated — manual control active</p>
    </div>
  );
}

function OpsToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-6 right-6 z-[10001] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl border text-[11px] font-bold tracking-wide shadow-[0_12px_30px_rgba(0,0,0,0.45)] ${
            toast.variant === "success"
              ? "bg-[#052E16] border-green-500/40 text-green-200"
              : "bg-[#111827] border-cyan-500/30 text-white"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
