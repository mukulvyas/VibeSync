import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMatchSimulation } from "./hooks/useMatchSimulation.jsx";
import VibeMap from "./components/VibeMap";
import AttendeeFocus from "./components/AttendeeFocus";
import AtmosphereMetrics from "./components/AtmosphereMetrics";
import AgentLog from "./components/AgentLog";
import AIInsightDrawer from "./components/AIInsightDrawer";
import { findPath } from "./utils/api";

/**
 * VisionSync Superiority Overhaul
 * Role: Lead Digital Twin Architect
 * Changes: 3-Column Wide Grid, Predictive SVG Charts, Actionable Intelligence.
 */

export default function App() {
  const { matchState, lastEvent } = useMatchSimulation();
  const navigate = useNavigate();
  const location = useLocation();
  const staffMode = location.pathname === "/ops";
  const [path, setPath] = useState(null);
  const [sosAlerts, setSosAlerts] = useState([]);

  // Navigation & UI State
  const [mobileTab, setMobileTab] = useState("HOME");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [overrideToast, setOverrideToast] = useState(false);

  // User position
  const [userPos, setUserPos] = useState({ row: 8, col: 4 });
  const [time, setTime] = useState(0);

  // Historical data for predictive charts (Mocked as trend)
  const [history, setHistory] = useState([45, 52, 48, 61, 55, 68, 72, 65, 80]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHistory((h) => [
        ...h.slice(1),
        Math.max(30, Math.min(100, h[h.length - 1] + (Math.random() * 10 - 5))),
      ]);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const proximities = useMemo(() => {
    return {
      WASHROOM: {
        meters: 87,
        wait: "2 min",
        label: "HUB08",
      },
      HYDRATION: {
        meters: 65,
        wait: "No wait",
        label: "Water Station",
      },
      FOOD: {
        meters: 120,
        wait: "5 min",
        label: "Food Court",
      },
    };
  }, []);

  const standCapacities = useMemo(
    () => ({
      NORTH: matchState.capacity.north,
      SOUTH: matchState.capacity.south,
      EAST: matchState.capacity.east,
      WEST: matchState.capacity.west,
    }),
    [matchState.capacity],
  );

  const liveAgentLogs = useMemo(() => {
    const stamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    return [
      {
        id: "sim-1",
        agent: "Guardian",
        initials: "GB",
        avatar: "#10B981",
        timestamp: stamp,
        text: `SECTORS STABLE. Noise ${matchState.noise_db}dB. Phase: ${matchState.phase}.`,
      },
      {
        id: "sim-2",
        agent: "Sync Agent",
        initials: "SA",
        avatar: "#3B82F6",
        timestamp: stamp,
        text: `Stand loads N:${matchState.capacity.north}% E:${matchState.capacity.east}% W:${matchState.capacity.west}% S:${matchState.capacity.south}%.`,
      },
      {
        id: "sim-3",
        agent: "Flow Agent",
        initials: "FA",
        avatar: "#F59E0B",
        timestamp: stamp,
        text: lastEvent
          ? `Latest ball event: ${lastEvent}. Dynamic routing refreshed.`
          : "Awaiting first delivery event...",
      },
    ];
  }, [lastEvent, matchState]);

  useEffect(() => {
    const t = setInterval(() => setTime((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleOverrideFlow = () => {
    setOverrideToast(true);
    setTimeout(() => setOverrideToast(false), 2600);
  };

  const handleAction = async (type) => {
    if (type === "GUIDE_SEAT" || type.startsWith("POI_")) {
      const targetStr = type === "GUIDE_SEAT" ? "N13" : type.split("_")[1];
      try {
        const data = await findPath(targetStr, userPos.row, userPos.col);
        setPath(data.path);
        setMobileTab("MAP"); // Stay on Map in mobile
      } catch (e) {
        console.error("Pathfind failed:", e);
      }
    }
  };

  const renderAdminToggle = (mini = false) => (
    <div className={`segmented-control ${mini ? 'segmented-control-mini' : ''}`}>
      <button 
        className={`segment-btn ${staffMode ? 'active' : ''}`}
        onClick={() => navigate("/ops")}
      >
        Ops
      </button>
      <button 
        className={`segment-btn ${!staffMode ? 'active' : ''}`}
        onClick={() => navigate("/")}
      >
        User
      </button>
    </div>
  );

  if (staffMode) {
    return (
      <div className="flex h-screen overflow-hidden font-sans selection:bg-cyan-tactical/30 text-text-primary theme-ops">
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[100px] flex-shrink-0 flex items-center justify-between px-10 border-b border-white/5 bg-[#0A0E1A]/95 backdrop-blur-3xl z-50 grid-texture">
            <div className="flex items-center gap-5">
              <div className="w-8 h-8 border-2 border-cyan-tactical flex items-center justify-center text-cyan-tactical font-black text-lg shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                VS
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-[0.1em] text-white font-heading">Ops Command</h1>
                <span className="text-[10px] font-bold text-cyan-tactical/60 tracking-[0.2em] font-heading">Mission Control v4</span>
              </div>
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
                <button
                  onClick={handleOverrideFlow}
                  className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)]"
                  style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}
                >
                  ⚠ Override AI Flow
                </button>
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
              <VibeMap venueData={null} standCapacities={standCapacities} path={path} sosAlerts={sosAlerts} attendeeMode={false} userPos={userPos} incentives={[]} showHeatmap={showHeatmap} />
            </main>

            <aside className="w-[450px] flex-shrink-0 border-l border-white/5 flex flex-col bg-[#0A0E1A]/40 backdrop-blur-md">
              <div className="flex-1 p-10 overflow-y-auto space-y-12">
                <div className="space-y-6">
                  <h2 className="tech-header text-red-tactical border-b border-white/5 pb-2 font-heading">Critical Alerts</h2>
                  <div className="space-y-4">
                    <ActionableAlert title="Gate North · Congestion Alert" detail={`${matchState.capacity.north}% capacity threshold reached`} time="17:26:11" status="critical" />
                  </div>
                </div>
                <div className="space-y-6">
                  <h2 className="tech-header text-cyan-tactical border-b border-white/5 pb-2 font-heading">Agent Intel</h2>
                  <AgentLog logs={liveAgentLogs} />
                </div>
              </div>
            </aside>
          </div>

          <button onClick={() => setIsInsightOpen(true)} className="fixed bottom-24 right-10 z-[60] w-16 h-16 rounded-full bg-cyan-tactical flex items-center justify-center text-black text-2xl shadow-[0_0_30px_rgba(0,212,255,0.5)] animate-fab-pulse">
            <span>✦</span>
          </button>
          <AIInsightDrawer isOpen={isInsightOpen} onClose={() => setIsInsightOpen(false)} />
          <OverrideToast visible={overrideToast} />
        </div>
      </div>
    );
  }

  // --- ATTENDEE RESPONSIVE LAYOUT ---
  return (
    <div className="app-shell-centered theme-attendee">
      {/* Top Status Bar */}
      <header className="mobile-status-bar font-data">
        <div className="attendee-shell-inner mobile-status-bar-inner">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[8px] text-text-secondary uppercase tracking-[0.2em] font-black opacity-60">Your Location</span>
            <span className="block text-[10px] text-white font-bold tracking-tight truncate">SEC-SOUTH · Row 12 · Seat 43</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {renderAdminToggle(true)}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[9px] font-black text-white tracking-[0.2em]">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mobile-content-scroller no-scrollbar">
        <div className="attendee-shell-inner">
        {mobileTab === "HOME" && (
          <div className="py-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full overflow-hidden">
            <div className="relative p-6 rounded-[24px] overflow-hidden border border-white/5 bg-gradient-to-br from-[#0E1623] to-[#162030] space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black tracking-[0.18em] text-[#F59E0B] uppercase">
                    IND vs AUS · T20 · Live
                  </p>
                  <p className="mt-3 text-3xl font-black text-white font-data tracking-tight">
                    {matchState.batting_team} {matchState.score}/{matchState.wickets} ({matchState.overs.toFixed(1)} ov)
                  </p>
                </div>
                <span className="text-[11px] text-text-secondary font-bold">
                  29degC · Clear sky
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary font-black">
                  Match Clock
                </span>
                <span className="font-data text-3xl font-black text-white tracking-widest">
                  {String(Math.floor(time / 60)).padStart(2, "0")}:
                  {String(time % 60).padStart(2, "0")}
                </span>
              </div>
            </div>

            <AtmosphereMetrics 
              noise={matchState.noise_db}
              aqi="Moderate"
              wifi="Optimal"
            />

            <AttendeeFocus attendeeOnly proximities={proximities} onAction={handleAction} />
          </div>
        )}

        {mobileTab === "MAP" && (
          <div className="h-[calc(100vh-112px)] relative animate-in fade-in duration-500 overflow-hidden">
             <VibeMap venueData={null} standCapacities={standCapacities} path={path} sosAlerts={sosAlerts} attendeeMode={true} userPos={userPos} incentives={[]} showHeatmap={showHeatmap} />
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
          <div className="py-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-white px-2">Find Amenities</h2>
            <AttendeeFocus onAction={handleAction} proximities={proximities} focused={true} />
          </div>
        )}

        {mobileTab === "ALERTS" && (
          <div className="py-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-white px-2">Safety & Alerts</h2>
            <AgentLog logs={liveAgentLogs} />
            <div className="p-6 glass-tactical rounded-3xl border-l-4 border-accent-gold">
              <p className="text-xs font-bold text-accent-gold mb-1">Fan Notice</p>
              <p className="text-[11px] text-white/70 leading-relaxed">Concourse B is seeing high traffic. AI Suggests using North Exit for faster departure.</p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="bottom-tabs">
        <div className="attendee-shell-inner bottom-tabs-inner">
          <MobileTabItem icon="🏠" label="Home" active={mobileTab === "HOME"} onClick={() => setMobileTab("HOME")} />
          <MobileTabItem icon="🗺️" label="Map" active={mobileTab === "MAP"} onClick={() => setMobileTab("MAP")} />
          <MobileTabItem icon="🔍" label="Find" active={mobileTab === "FIND"} onClick={() => setMobileTab("FIND")} />
          <MobileTabItem icon="🔔" label="Alerts" active={mobileTab === "ALERTS"} onClick={() => setMobileTab("ALERTS")} />
        </div>
      </nav>

      {/* AI Insight Overlay */}
      <AIInsightDrawer isOpen={isInsightOpen} onClose={() => setIsInsightOpen(false)} />
      
      {/* AI FAB Trigger */}
      <button 
        onClick={() => setIsInsightOpen(true)}
        className="fixed bottom-[80px] right-4 z-[500] fab-ai"
        style={{ left: 'auto' }}
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
  const isCritical = status === "critical";
  const stripeColor = isCritical ? "#EF4444" : "var(--amber-tactical)";
  return (
    <div className="alert-stripe" style={{ borderLeftColor: stripeColor, borderLeftWidth: "3px" }}>
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
            className="flex-1 py-1.5 text-[10px] font-bold rounded transition-all font-heading"
            style={{ background: "#EF4444", color: "#fff" }}
          >
            Resolve
          </button>
          <button className="flex-1 py-1.5 text-[10px] font-bold border border-white/30 bg-transparent text-text-dim hover:text-white rounded transition-all font-heading">
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

function OverrideToast({ visible }) {
  if (!visible) return null;
  return (
    <div className="fixed top-6 right-6 z-[800] px-4 py-3 rounded-xl bg-[#111827] border border-red-500/40 text-white shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
      <p className="text-[11px] font-bold tracking-wide">
        Override initiated — manual control active
      </p>
    </div>
  );
}
