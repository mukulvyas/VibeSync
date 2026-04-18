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
  const [mobileTab, setMobileTab] = useState("HOME");
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

  const renderAdminToggle = () => (
    <div className="segmented-control">
      <button 
        className={`segment-btn ${staffMode ? 'active' : ''}`}
        onClick={() => setStaffMode(true)}
      >
        Ops
      </button>
      <button 
        className={`segment-btn ${!staffMode ? 'active' : ''}`}
        onClick={() => setStaffMode(false)}
      >
        User
      </button>
    </div>
  );

  if (staffMode) {
    return (
      <div className="flex h-screen overflow-hidden font-sans selection:bg-cyan-tactical/30 text-text-primary theme-ops">
        {/* ── Mission Control Sidebar ── */}
        <aside className="ops-sidebar-rail">
          <div className="h-[100px] flex items-center justify-center border-b border-white/5 bg-black/40 flex-shrink-0">
            <div className="w-8 h-8 border-2 border-cyan-tactical flex items-center justify-center text-cyan-tactical font-black text-lg shadow-[0_0_20px_rgba(0,212,255,0.4)]">
              VS
            </div>
          </div>
          <div className="flex-1 py-8 flex flex-col gap-2">
            <SidebarIcon icon="📁" label="Command" active={activeSidebar === "COMMAND"} onClick={() => setActiveSidebar("COMMAND")} />
            <SidebarIcon icon="🛰️" label="Sensors" active={activeSidebar === "ZONES"} onClick={() => setActiveSidebar("ZONES")} />
            <SidebarIcon icon="📦" label="Systems" active={activeSidebar === "ASSETS"} onClick={() => setActiveSidebar("ASSETS")} />
            <SidebarIcon icon="💬" label="Alerts" active={activeSidebar === "COMMS"} onClick={() => setActiveSidebar("COMMS")} />
          </div>
          
          <div className="sidebar-logo-mark">
             <div className="text-[10px] font-black text-cyan-tactical tracking-[0.3em] opacity-40">VS</div>
          </div>

          <div className="p-4 border-t border-white/5 flex flex-col items-center gap-4 bg-black/40 flex-shrink-0">
            <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden hover:border-cyan-tactical transition-all cursor-pointer shadow-lg">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" />
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[100px] flex-shrink-0 flex items-center justify-between px-10 border-b border-white/5 bg-[#0A0E1A]/95 backdrop-blur-3xl z-50 grid-texture">
            <div className="flex items-center gap-16">
              <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-[0.1em] text-white font-heading">Ops Command</h1>
                <span className="text-[10px] font-bold text-cyan-tactical/60 tracking-[0.2em] font-heading">Mission Control v4.0.2</span>
              </div>
              <nav className="flex gap-2 h-full relative">
                {["Dashboard", "Analytics", "Logistics", "Security"].map((t) => (
                  <button key={t} onClick={() => setActiveStaffTask(t)} className={`h-full px-8 text-sm font-bold tracking-widest font-heading transition-colors ${activeStaffTask === t ? "text-cyan-tactical" : "text-text-dim hover:text-white"}`}>
                    {t}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-10">
              {renderAdminToggle()}
            <div className="status-pill-badge">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#10b981] animate-pulse" />
              SYSTEM ONLINE
            </div>
            </div>
          </header>

          <div className="flex-1 flex min-h-0 bg-[#010409]">
            <aside className="w-[420px] flex-shrink-0 border-r border-white/5 p-10 overflow-y-auto bg-[#0d1117]/30 backdrop-blur-md">
              <div className="space-y-12">
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
                  <HealthBar label="Neural Engine" value={88} max={100} unit="%" color="#00D4FF" />
                  <HealthBar label="Data Latency" value={14} max={100} unit="ms" color="#FFA502" />
                  <HealthBar label="Network Uplink" value={98} max={100} unit="%" color="#00D4FF" />
                </div>
              </div>
            </aside>

            <main className="flex-1 relative flex flex-col p-6 overflow-hidden bg-black/20">
              <div className="absolute top-10 left-10 z-[100]">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl p-2 rounded-full border border-white/5 shadow-2xl">
                  <span className="text-[10px] font-black tracking-widest text-text-dim uppercase ml-4">Heat Map</span>
                  <div className="w-14 h-7 bg-white/5 rounded-full relative p-1 cursor-pointer" onClick={() => setShowHeatmap(!showHeatmap)}>
                    <div className={`w-5 h-5 rounded-full transition-all duration-300 shadow-lg ${showHeatmap ? 'translate-x-7 bg-cyan-tactical' : 'translate-x-0 bg-text-dim'}`} />
                  </div>
                </div>
              </div>
              <VibeMap venueData={venueData} path={path} sosAlerts={sosAlerts} attendeeMode={false} userPos={userPos} incentives={incentives} showHeatmap={showHeatmap} />
            </main>

            <aside className="w-[450px] flex-shrink-0 border-l border-white/5 flex flex-col bg-[#0A0E1A]/40 backdrop-blur-md">
              <div className="flex-1 p-10 overflow-y-auto space-y-12">
                <div className="space-y-6">
                  <h2 className="tech-header text-red-tactical border-b border-white/5 pb-2 font-heading">Critical Alerts</h2>
                  <div className="space-y-4">
                    <ActionableAlert title="Gate North · Congestion Alert" detail="89% capacity threshold exceeded" time="14:52:01" status="critical" />
                  </div>
                </div>
                <div className="space-y-6">
                  <h2 className="tech-header text-cyan-tactical border-b border-white/5 pb-2 font-heading">Agent Intel</h2>
                  <AgentLog logs={agentLogs} />
                </div>
              </div>
            </aside>
          </div>

          <footer className="h-[60px] border-t border-white/5 bg-[#010409] flex items-center justify-between px-10 text-[9px] font-black tracking-[0.2em] text-text-dim uppercase z-50">
            <div className="flex gap-16 font-data text-[8px]">
              <span className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-tactical shadow-[0_0_8px_var(--green-tactical)]" />
                Core System Nominal
              </span>
            </div>
            <div className="flex gap-16 font-data">
              <span>Latency: 14ms</span>
              <span className="text-amber-tactical">CPU Load: 34%</span>
            </div>
          </footer>

          <button onClick={() => setIsInsightOpen(true)} className="fixed bottom-24 right-10 z-[60] w-16 h-16 rounded-full bg-cyan-tactical flex items-center justify-center text-black text-2xl shadow-[0_0_30px_rgba(0,212,255,0.5)] animate-fab-pulse">
            <span>✦</span>
          </button>
          <AIInsightDrawer isOpen={isInsightOpen} onClose={() => setIsInsightOpen(false)} />
        </div>
      </div>
    );
  }

  // --- ATTENDEE MOBILE SIMULATION ---
  return (
    <div className="mobile-mockup-bg">
      {/* Floating Demo Admin Toggle */}
      <div className="fixed top-10 right-10 z-[200]">
        {renderAdminToggle()}
      </div>

      <div className="phone-frame theme-attendee">
        {/* Mobile Status Bar */}
        <header className="mobile-status-bar font-data">
          <div className="flex flex-col">
            <span className="text-[8px] text-text-dim uppercase tracking-widest font-black">Your Location</span>
            <span className="text-[10px] text-white font-bold tracking-tight">SEC-SOUTH · Row 12 · Seat 43</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#10b981]" />
             <span className="text-[9px] font-black text-white tracking-[0.2em]">LIVE</span>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="app-content app-screen-scroll">
          {mobileTab === "HOME" && (
            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AttendeeFocus attendeeOnly proximities={proximities} onAction={handleAction} />
              
              <AtmosphereMetrics 
                noise={atmosphere.noise_level_db} 
                aqi={atmosphere.air_quality_aqi} 
                wifi={atmosphere.wifi_mesh_mbps} 
              />
              
              {/* Match Clock Section */}
              <div className="relative p-7 rounded-[16px] overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0E1623] to-[#162030] border border-white/5 opacity-80" />
                <div className="absolute inset-0 border border-ios-blue/20 rounded-[16px] pointer-events-none" />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <div className="pill-live flex items-center gap-2 text-[9px] font-bold text-white/60 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE HUD
                    </div>
                    <span className="text-[10px] font-black text-white/40 tracking-[0.3em] font-heading">MATCH CLOCK</span>
                  </div>
                  
                  <div className="flex justify-center items-center py-4 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                    <div className="text-7xl font-black font-data text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                      {String(Math.floor(matchSeconds / 60)).padStart(2, "0")}
                      <span className="animate-blink text-ios-blue mx-1">:</span>
                      {String(matchSeconds % 60).padStart(2, "0")}
                    </div>
                  </div>

                  <div className="flex justify-between px-2 pt-2">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">Current Quarter</span>
                        <div className="text-lg font-black text-white font-data">Q2 · 14'</div>
                     </div>
                     <div className="flex flex-col text-right">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">Scoreboard</span>
                        <div className="text-lg font-black text-[#F59E0B] font-data">84 - 72</div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mobileTab === "MAP" && (
            <div className="h-full relative animate-in fade-in duration-500">
               <VibeMap venueData={venueData} path={path} sosAlerts={sosAlerts} attendeeMode={true} userPos={userPos} incentives={incentives} showHeatmap={showHeatmap} />
               {/* Floating Heatmap Toggle for Mobile */}
               <div className="absolute top-6 left-6">
                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-xl">
                  <div className="w-10 h-5 bg-white/10 rounded-full relative p-0.5 cursor-pointer" onClick={() => setShowHeatmap(!showHeatmap)}>
                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${showHeatmap ? 'translate-x-5 bg-cyan-tactical' : 'translate-x-0 bg-text-dim'}`} />
                  </div>
                  <span className="text-[8px] font-black tracking-widest text-white/60 mr-2 uppercase">Heatmap</span>
                </div>
               </div>
            </div>
          )}

          {mobileTab === "FIND" && (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-white px-2">Find Amenities</h2>
              <AttendeeFocus onAction={handleAction} proximities={proximities} focused={true} />
            </div>
          )}

          {mobileTab === "ALERTS" && (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-white px-2">Safety & Alerts</h2>
              <AgentLog logs={agentLogs.slice(0, 5)} />
              <div className="p-6 glass-tactical rounded-3xl border-l-4 border-accent-gold">
                <p className="text-xs font-bold text-accent-gold mb-1">Fan Notice</p>
                <p className="text-[11px] text-white/70 leading-relaxed">Concourse B is seeing high traffic. AI Suggests using North Exit for faster departure.</p>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Tab Bar */}
        <nav className="bottom-tabs">
          <MobileTabItem icon="🏠" label="Home" active={mobileTab === "HOME"} onClick={() => setMobileTab("HOME")} />
          <MobileTabItem icon="🗺️" label="Map" active={mobileTab === "MAP"} onClick={() => setMobileTab("MAP")} />
          <MobileTabItem icon="🔍" label="Find" active={mobileTab === "FIND"} onClick={() => setMobileTab("FIND")} />
          <MobileTabItem icon="🔔" label="Alerts" active={mobileTab === "ALERTS"} onClick={() => setMobileTab("ALERTS")} />
        </nav>
      </div>

      <AIInsightDrawer isOpen={isInsightOpen} onClose={() => setIsInsightOpen(false)} />
      
      {/* Global AI FAB Trigger */}
      <button 
        onClick={() => setIsInsightOpen(true)}
        className="fixed bottom-[80px] right-4 z-[500] fab-ai"
        title="AI Insights available"
      >
        <span className="text-2xl">✦</span>
      </button>
    </div>
  );
}

function MobileTabItem({ icon, label, active, onClick }) {
  return (
    <div className={`tab-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="tab-icon text-2xl">{icon}</span>
      <span className="tab-label">{label}</span>
      {active && <div className="tab-indicator" />}
    </div>
  );
}


function SidebarIcon({ icon, label, active, onClick }) {
  return (
    <div 
      className={`sidebar-icon-wrap ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {active && <div className="sidebar-icon-active-bar" />}
      <div className="text-xl flex-shrink-0 w-6 flex justify-center">
        {icon}
      </div>
      <span className="sidebar-label">{label}</span>
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
