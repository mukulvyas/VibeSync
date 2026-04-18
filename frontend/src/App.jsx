import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useVenueData } from "./hooks/useVenueData";
import VibeMap from "./components/VibeMap";
import AttendeeFocus from "./components/AttendeeFocus";
import AtmosphereMetrics from "./components/AtmosphereMetrics";
import ZoneStatusList from "./components/ZoneStatusList";
import GuardianSOS from "./components/GuardianSOS";
import AgentLog from "./components/AgentLog";
import IncentiveToast from "./components/IncentiveToast";
import AIInsightDrawer from "./components/AIInsightDrawer";
import { findPath } from "./utils/api";

/**
 * VisionSync Superiority Overhaul
 * Role: Lead Digital Twin Architect
 * Changes: 3-Column Wide Grid, Predictive SVG Charts, Actionable Intelligence.
 */

// POI Coordinates for proximity logic
const POIS = {
  WASHROOM: { row: 0, col: 9, label: "HUB_08_LVL2" },
  HYDRATION: { row: 9, col: 0, label: "WATER_STAT_W" },
  FOOD: { row: 9, col: 9, label: "SIG_GRILL_04" },
};

export default function App() {
  const {
    venueData,
    incentives,
    agentLogs,
    connected,
    tick,
    dismissIncentive,
    atmosphere,
  } = useVenueData();
  const [staffMode, setStaffMode] = useState(false);
  const [path, setPath] = useState(null);
  const [sosAlerts, setSosAlerts] = useState([]);

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState("MAP");
  const [activeSidebar, setActiveSidebar] = useState("COMMAND");
  const [activeStaffTask, setActiveStaffTask] = useState("ANALYTICS");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isInsightOpen, setIsInsightOpen] = useState(false);

  // User position
  const [userPos, setUserPos] = useState({ row: 7, col: 5 });
  const [matchSeconds, setMatchSeconds] = useState(836);

  // Historical data for predictive charts (Mocked as trend)
  const [history, setHistory] = useState([45, 52, 48, 61, 55, 68, 72, 65, 80]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMatchSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      // Update trend slightly
      setHistory((h) => [
        ...h.slice(1),
        Math.max(30, Math.min(100, h[h.length - 1] + (Math.random() * 10 - 5))),
      ]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const proximities = useMemo(() => {
    if (!venueData) return {};
    const stats = {};
    Object.entries(POIS).forEach(([key, coords]) => {
      const dist = Math.sqrt(
        Math.pow(coords.row - userPos.row, 2) +
          Math.pow(coords.col - userPos.col, 2),
      );
      const congestion = venueData[coords.row][coords.col].density;
      const meters = Math.round(dist * 12);
      const minutes = Math.round((meters / 1.4 / 60) * (1 + congestion));
      stats[key] = { meters, minutes, label: coords.label };
    });
    return stats;
  }, [venueData, userPos]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleAction = async (type) => {
    if (type === "GUIDE_SEAT" || type.startsWith("POI_")) {
      const targetStr = type === "GUIDE_SEAT" ? "N13" : type.split("_")[1];
      try {
        const data = await findPath(targetStr, userPos.row, userPos.col);
        setPath(data.path);
        setActiveTab("MAP");
      } catch (e) {
        console.error("Pathfind failed:", e);
      }
    }
  };

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans selection:bg-cyan-tactical/30 text-text-primary ${staffMode ? 'theme-ops' : 'theme-attendee'}`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
        body { font-family: 'Inter', sans-serif; font-size: 16px; background: #010409; }
        .glass-tactical { background: rgba(13, 17, 23, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(0, 210, 255, 0.1); }
        h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; }
        .data-number { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* ── Mission Control Sidebar ── */}
      <aside className="w-[100px] flex-shrink-0 tactical-sidebar border-r border-white/5 bg-[#0d1117] scanline-overlay">
        <div className="h-[100px] flex items-center justify-center border-b border-white/5 bg-black/40">
          <div className="w-12 h-12 border-2 border-cyan-tactical flex items-center justify-center text-cyan-tactical font-black text-2xl shadow-[0_0_20px_rgba(0,212,255,0.4)]">
            VS
          </div>
        </div>
        <div className="flex-1 py-12 flex flex-col items-center gap-4">
          <SidebarIcon
            icon="📁"
            label="Command"
            active={activeSidebar === "COMMAND"}
            onClick={() => setActiveSidebar("COMMAND")}
          />
          <SidebarIcon
            icon="🛰️"
            label="Sensors"
            active={activeSidebar === "ZONES"}
            onClick={() => setActiveSidebar("ZONES")}
          />
          <SidebarIcon
            icon="📦"
            label="Systems"
            active={activeSidebar === "ASSETS"}
            onClick={() => setActiveSidebar("ASSETS")}
          />
          <SidebarIcon
            icon="💬"
            label="Alerts"
            active={activeSidebar === "COMMS"}
            onClick={() => setActiveSidebar("COMMS")}
          />
        </div>
        <div className="p-6 border-t border-white/5 flex flex-col items-center gap-8 bg-black/40">
          <div className="w-12 h-12 rounded-full border-2 border-border-dim overflow-hidden hover:border-cyan-tactical transition-all cursor-pointer shadow-lg">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="user"
            />
          </div>
        </div>
      </aside>

      {/* ── Main Dashboard Layout ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Header ── */}
        <header className={`h-[100px] flex-shrink-0 flex items-center justify-between px-10 border-b border-white/5 backdrop-blur-3xl z-50 ${staffMode ? 'bg-[#0A0E1A]/95 grid-texture' : 'bg-[#111827]/98'}`}>
          <div className="flex items-center gap-16">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-[0.1em] text-white font-heading">
                {staffMode ? "Ops Command" : "Stadium Twin"}
              </h1>
              <span className="text-[10px] font-bold text-cyan-tactical/60 tracking-[0.2em] font-heading">
                Mission Control v4.0.2
              </span>
            </div>

            {!staffMode && (
              <div className="px-6 py-3 bg-[#1F2937] rounded-2xl border border-white/5 flex items-center gap-6 shadow-xl animate-in slide-in-from-top duration-500">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest">Your Section</span>
                   <span className="text-sm font-black text-white">SEC-SOUTH</span>
                 </div>
                 <div className="w-px h-8 bg-white/10" />
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Seat Info</span>
                   <span className="text-sm font-black text-white">Row 12, Seat 42</span>
                 </div>
              </div>
            )}

            <nav className="flex gap-2 h-full relative">
              {(staffMode
                ? ["Dashboard", "Analytics", "Logistics", "Security"]
                : ["Overview", "Map", "Directions", "Logs"]
              ).map((t, i) => {
                const isActive = (staffMode ? activeStaffTask : activeTab) === t;
                return (
                  <button
                    key={t}
                    onClick={() => staffMode ? setActiveStaffTask(t) : setActiveTab(t)}
                    className={`h-full px-8 text-sm font-bold tracking-widest font-heading transition-colors ${
                      isActive ? "text-cyan-tactical" : "text-text-dim hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
              <div
                className="absolute bottom-0 h-1 bg-cyan-tactical transition-all duration-300 rounded-t-full shadow-[0_0_15px_#00d2ff]"
                style={{
                  width: "80px",
                  left: `${(staffMode ? ["Dashboard", "Analytics", "Logistics", "Security"].indexOf(activeStaffTask) : ["Overview", "Map", "Directions", "Logs"].indexOf(activeTab)) * 115 + 15}px`,
                }}
              />
            </nav>
          </div>

          <div className="flex items-center gap-10">
            {/* Pill Toggle Switch */}
            <div className="pill-toggle w-[140px] h-[40px] cursor-pointer" onClick={() => setStaffMode(!staffMode)}>
              <div 
                className="pill-toggle-active w-[68px]" 
                style={{ transform: `translateX(${staffMode ? '0' : '68px'})` }} 
              />
              <div className="flex w-full h-full relative z-10 font-heading text-[9px] font-black items-center text-center">
                <div className={`flex-1 transition-colors duration-300 ${staffMode ? 'text-black' : 'text-text-dim'}`}>Ops</div>
                <div className={`flex-1 transition-colors duration-300 ${!staffMode ? 'text-black' : 'text-text-dim'}`}>User</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 border border-cyan-tactical/20 bg-white/5 rounded-sm font-heading">
              <div
                className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#10b981] animate-pulse"
              />
              <span className="text-[9px] font-black text-cyan-tactical uppercase tracking-[0.2em]">
                System Online
              </span>
            </div>
          </div>
        </header>

        {/* ── 3-COLUMN WIDE GRID ── */}
        <div className="flex-1 flex min-h-0 bg-[#010409]">
          {/* COLUMN 1: GLOBAL METRICS & TRENDS (Staff Only) */}
          {staffMode && (
            <aside className="w-[420px] flex-shrink-0 border-r border-white/5 p-10 overflow-y-auto bg-[#0d1117]/30 backdrop-blur-md">
              <div className="space-y-12">
                <div className="space-y-4">
                  <h2 className="tech-header text-cyan-tactical border-b border-white/5 pb-2 font-heading">
                    Predictive Analytics
                  </h2>
                  <PredictiveChart label="Crowd Density Analysis" data={history} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <MetricBoxSmall
                    label="Current Capacity"
                    value="92%"
                    color="#00D4FF"
                  />
                  <MetricBoxSmall
                    label="System Load Avg"
                    value="1.4s"
                    color="#FFA502"
                  />
                </div>

                <div className="space-y-8">
                  <h2 className="tech-header text-cyan-tactical border-b border-white/5 pb-2 font-heading">
                    System Vitality
                  </h2>
                  <HealthBar
                    label="Neural Engine"
                    value={88}
                    max={100}
                    unit="%"
                    color="#00D4FF"
                  />
                  <HealthBar
                    label="Data Latency"
                    value={14}
                    max={100}
                    unit="ms"
                    color="#FFA502"
                  />
                  <HealthBar
                    label="Network Uplink"
                    value={98}
                    max={100}
                    unit="%"
                    color="#00D4FF"
                  />
                </div>

                <div className="pt-6">
                  <button className="w-full py-5 text-xs font-black tracking-[0.4em] uppercase font-heading bg-transparent border-2 border-red-tactical text-red-tactical rounded-md animate-danger-glow transition-all hover:bg-red-tactical/10">
                    Override AI Flow
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* COLUMN 2: THE 3D MAP ENGINE */}
          <main className="flex-1 relative flex flex-col p-6 overflow-hidden bg-black/20">
            {/* Floating Layer Controls */}
            <div className="absolute top-10 left-10 z-[100] flex gap-4">
            <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl p-2 rounded-full border border-white/5 shadow-2xl">
              <span className="text-[10px] font-black tracking-widest text-text-dim uppercase ml-4">Heat Map</span>
              <div 
                className="w-14 h-7 bg-white/5 rounded-full relative p-1 cursor-pointer transition-colors hover:bg-white/10"
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <div 
                  className={`w-5 h-5 rounded-full transition-all duration-300 shadow-lg ${showHeatmap ? 'translate-x-7 bg-cyan-tactical' : 'translate-x-0 bg-text-dim'}`}
                />
              </div>
            </div>
            </div>

            <VibeMap
              venueData={venueData}
              path={path}
              sosAlerts={sosAlerts}
              attendeeMode={!staffMode}
              userPos={userPos}
              incentives={incentives}
              showHeatmap={showHeatmap}
            />
          </main>

          {/* COLUMN 3: ACTIONABLE INTELLIGENCE & LOGS */}
          <aside className="w-[450px] flex-shrink-0 border-l border-white/5 flex flex-col bg-[#0A0E1A]/40 backdrop-blur-md">
            <div className="flex-1 p-10 overflow-y-auto space-y-12">
              {staffMode ? (
                <>
                  <div className="space-y-6">
                    <h2 className="tech-header text-red-tactical border-b border-white/5 pb-2 font-heading">
                      Critical Alerts
                    </h2>
                    <div className="space-y-4">
                      <ActionableAlert
                        title="Gate North · Congestion Alert"
                        detail="89% capacity threshold exceeded"
                        time="14:52:01"
                        status="critical"
                      />
                      <ActionableAlert
                        title="Sensor Failure · Sector B2"
                        detail="Mesh connectivity lost in secondary array"
                        time="14:51:22"
                        status="warning"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="tech-header text-cyan-tactical border-b border-white/5 pb-2 font-heading">
                      Agent Intel
                    </h2>
                    <AgentLog logs={agentLogs} />
                  </div>
                </>
              ) : (
                <AttendeeFocus
                  onAction={handleAction}
                  proximities={proximities}
                />
              )}
            </div>

            {!staffMode && (
              <div className="p-10 border-t border-white/5 bg-black/20 space-y-8">
                <AtmosphereMetrics
                  noise={atmosphere.noise_level_db}
                  aqi={atmosphere.air_quality_aqi}
                  wifi={atmosphere.wifi_mesh_mbps}
                />
                <div className="p-8 bg-[#111827] rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden scoreboard-lcd">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                     <span className="text-4xl font-black">88</span>
                  </div>
                  <div className="flex items-center gap-3 mb-4 font-heading">
                    <div className="w-1.5 h-4 bg-[#F59E0B] rounded-full" />
                    <span className="text-[11px] font-black tracking-widest text-text-dim">
                      Live Match Clock
                    </span>
                  </div>
                  <p className="text-7xl font-black font-data text-white tracking-widest mb-1 tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    {formatTime(matchSeconds)}
                  </p>
                  <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest ml-1">
                    Second Half · Final Quarter
                  </p>
                </div>
              </div>
            )}
            
            {!staffMode && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[400px]">
                <div className="bg-[#1F2937]/90 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-5 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <NavItem icon="🏠" label="Home" active />
                  <NavItem icon="🗺️" label="Map" />
                  <NavItem icon="🔍" label="Find" />
                  <NavItem icon="🔔" label="Alerts" count={2} />
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ── Mission Control Footer ── */}
        <footer className="h-[60px] border-t border-white/5 bg-[#010409] flex items-center justify-between px-10 text-[9px] font-black tracking-[0.2em] text-text-dim uppercase z-50 relative overflow-hidden scanline-overlay grid-texture">
          <div className="flex gap-16 relative z-10 font-heading">
            <span className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-tactical shadow-[0_0_8px_var(--green-tactical)]" />
              Core System Nominal
            </span>
            <span className="flex items-center gap-3 text-cyan-tactical/60 hover:text-cyan-tactical transition-colors cursor-pointer">
              Secure Uplink Active
            </span>
          </div>
          <div className="flex gap-16 relative z-10 font-data">
            <span>Latency: 14ms</span>
            <span className="text-amber-tactical">CPU Load: 34%</span>
            <span className="text-white/20">v4.0.21 build.774</span>
          </div>
        </footer>

        {/* AI Insight Trigger FAB */}
        <button
          onClick={() => setIsInsightOpen(true)}
          className="fixed bottom-24 right-10 z-[60] w-16 h-16 rounded-full bg-cyan-tactical flex items-center justify-center text-black text-2xl shadow-[0_0_30px_rgba(0,212,255,0.5)] animate-fab-pulse group transition-transform active:scale-90 hover:scale-110"
        >
          <span className="transition-transform group-hover:rotate-12">✦</span>
        </button>

        {/* AI Insight Drawer */}
        <AIInsightDrawer isOpen={isInsightOpen} onClose={() => setIsInsightOpen(false)} />
      </div>
    </div>
  );
}

function SidebarIcon({ icon, label, active, onClick }) {
  return (
    <div
      className={`sidebar-nav-item sidebar-glow w-full flex flex-col items-center justify-center p-4 border-l-4 relative transition-all duration-300 ${
        active ? "border-cyan-tactical bg-cyan-tactical/5 text-cyan-tactical" : "border-transparent text-text-dim hover:text-white"
      }`}
      onClick={onClick}
      title={label}
    >
      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform relative">
        {icon}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
          style={{
            background:
              "radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)",
          }}
        />
      </div>
      <span className="text-[9px] font-black tracking-[0.3em] uppercase font-heading">
        {label}
      </span>
    </div>
  );
}

function PredictiveChart({ label, data }) {
  const max = Math.max(...data, 100);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 340},${100 - (v / max) * 80}`)
    .join(" ");

  return (
    <div className="p-6 glass-tactical rounded-2xl relative group overflow-hidden">
      <div className="absolute top-0 right-0 p-2 text-[8px] font-black text-cyan-tactical animate-pulse font-heading tracking-[0.2em]">
        Live AI Prediction
      </div>
      <p className="text-[10px] font-black tracking-widest text-text-dim mb-4 font-heading">
        {label}
      </p>
      <svg
        viewBox="0 0 340 100"
        className="w-full h-24 stroke-cyan-tactical fill-none overflow-visible"
      >
        <polyline
          points={points}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]"
        />
        <path
          d={`M ${points} L 340,100 L 0,100 Z`}
          fill="url(#chartGradient)"
          opacity="0.05"
        />
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
      <p className="text-[9px] font-black tracking-widest text-text-dim mb-1 relative z-10 font-heading">
        {label}
      </p>
      <span
        className="text-2xl font-black font-data tracking-widest relative z-10"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function ActionableAlert({ title, detail, time, status }) {
  const stripeColor = status === "critical" ? "var(--red-tactical)" : "var(--amber-tactical)";
  return (
    <div className="alert-stripe" style={{ borderLeftColor: stripeColor }}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white font-heading tracking-widest">{title}</h4>
            <p className="text-[10px] text-text-dim leading-relaxed">{detail}</p>
          </div>
          <span className="text-[8px] font-data text-text-dim/60">{time}</span>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-1.5 text-[10px] font-bold bg-white/5 border border-white/5 text-white hover:bg-white/10 rounded transition-all font-heading">
            Resolve
          </button>
          <button className="flex-1 py-1.5 text-[10px] font-bold border border-white/5 text-text-dim hover:text-white rounded transition-all font-heading">
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
            style={{ color: color, backgroundColor: i < activeSegments ? color : undefined }}
          />
        ))}
      </div>
    </div>
  );
}
function NavItem({ icon, label, active, count }) {
  return (
    <div className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${active ? 'nav-active-gold' : 'text-text-dim hover:text-white'}`}>
      <div className="relative text-2xl">
        {icon}
        {count && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border border-[#1F2937]">
            {count}
          </span>
        )}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}
