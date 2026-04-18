import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useVenueData } from './hooks/useVenueData';
import VibeMap from './components/VibeMap';
import AttendeeFocus from './components/AttendeeFocus';
import AtmosphereMetrics from './components/AtmosphereMetrics';
import ZoneStatusList from './components/ZoneStatusList';
import GuardianSOS from './components/GuardianSOS';
import AgentLog from './components/AgentLog';
import IncentiveToast from './components/IncentiveToast';
import { findPath } from './utils/api';

/**
 * VisionSync Superiority Overhaul
 * Role: Lead Digital Twin Architect
 * Changes: 3-Column Wide Grid, Predictive SVG Charts, Actionable Intelligence.
 */

// POI Coordinates for proximity logic
const POIS = {
  WASHROOM: { row: 0, col: 9, label: 'HUB_08_LVL2' },
  HYDRATION: { row: 9, col: 0, label: 'WATER_STAT_W' },
  FOOD: { row: 9, col: 9, label: 'SIG_GRILL_04' },
};

export default function App() {
  const { venueData, incentives, agentLogs, connected, tick, dismissIncentive, atmosphere } = useVenueData();
  const [staffMode, setStaffMode] = useState(false);
  const [path, setPath] = useState(null);
  const [sosAlerts, setSosAlerts] = useState([]);
  
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('MAP');
  const [activeSidebar, setActiveSidebar] = useState('COMMAND');
  const [activeStaffTask, setActiveStaffTask] = useState('ANALYTICS');
  const [showHeatmap, setShowHeatmap] = useState(true);

  // User position
  const [userPos, setUserPos] = useState({ row: 7, col: 5 });
  const [matchSeconds, setMatchSeconds] = useState(836);

  // Historical data for predictive charts (Mocked as trend)
  const [history, setHistory] = useState([45, 52, 48, 61, 55, 68, 72, 65, 80]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMatchSeconds(prev => (prev > 0 ? prev - 1 : 0));
      // Update trend slightly
      setHistory(h => [...h.slice(1), Math.max(30, Math.min(100, h[h.length-1] + (Math.random() * 10 - 5)))]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const proximities = useMemo(() => {
    if (!venueData) return {};
    const stats = {};
    Object.entries(POIS).forEach(([key, coords]) => {
      const dist = Math.sqrt(Math.pow(coords.row - userPos.row, 2) + Math.pow(coords.col - userPos.col, 2));
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
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleAction = async (type) => {
    if (type === 'GUIDE_SEAT' || type.startsWith('POI_')) {
      const targetStr = type === 'GUIDE_SEAT' ? 'N13' : type.split('_')[1];
      try {
        const data = await findPath(targetStr, userPos.row, userPos.col);
        setPath(data.path);
        setActiveTab('MAP');
      } catch (e) {
        console.error('Pathfind failed:', e);
      }
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden bg-[#010409] font-sans selection:bg-cyan-tactical/30 text-text-primary`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
        body { font-family: 'Inter', sans-serif; font-size: 16px; background: #010409; }
        .glass-tactical { background: rgba(13, 17, 23, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(0, 210, 255, 0.1); }
      `}</style>

      {/* ── Left Rail Sidebar ── */}
      <aside className="w-[100px] flex-shrink-0 tactical-sidebar border-r border-white/5 bg-[#0d1117]">
        <div className="h-[100px] flex items-center justify-center border-b border-white/5 bg-black/40">
           <div className="w-12 h-12 border-2 border-cyan-tactical flex items-center justify-center text-cyan-tactical font-black text-2xl shadow-[0_0_20px_rgba(0,210,255,0.4)]">⬡</div>
        </div>
        <div className="flex-1 py-12 flex flex-col items-center gap-4">
          <SidebarIcon icon="📁" label="FILES" active={activeSidebar === 'COMMAND'} onClick={() => setActiveSidebar('COMMAND')} />
          <SidebarIcon icon="🛰️" label="SENSORS" active={activeSidebar === 'ZONES'} onClick={() => setActiveSidebar('ZONES')} />
          <SidebarIcon icon="📦" label="SYSTEMS" active={activeSidebar === 'ASSETS'} onClick={() => setActiveSidebar('ASSETS')} />
          <SidebarIcon icon="💬" label="ALERT" active={activeSidebar === 'COMMS'} onClick={() => setActiveSidebar('COMMS')} />
        </div>
        <div className="p-6 border-t border-white/5 flex flex-col items-center gap-8 bg-black/40">
           <div className="w-12 h-12 rounded-full border-2 border-border-dim overflow-hidden hover:border-cyan-tactical transition-all cursor-pointer">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" />
           </div>
        </div>
      </aside>

      {/* ── Main Dashboard Layout ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ── Header ── */}
        <header className="h-[100px] flex-shrink-0 flex items-center justify-between px-10 border-b border-white/5 bg-[#0d1117]/90 backdrop-blur-3xl z-50">
           <div className="flex items-center gap-16">
              <div className="flex flex-col">
                 <h1 className="text-2xl font-black tracking-[0.2em] text-white">
                    {staffMode ? 'OPS_COMMAND' : 'SENTINEL_DRIVE'}
                 </h1>
                 <span className="text-[10px] font-bold text-cyan-tactical/60 tracking-[0.4em] uppercase">STADIUM_DIGITAL_TWIN v4.0</span>
              </div>
              
              <nav className="flex gap-2 h-[100px]">
                 {(staffMode ? ['DASHBOARD', 'PREDICTIVE', 'LOGISTICS', 'SECURITY'] : ['HOME', 'MAP', 'FIND', 'LOGS']).map(t => (
                   <button key={t} onClick={() => staffMode ? setActiveStaffTask(t) : setActiveTab(t)} 
                     className={`h-full border-b-4 transition-all px-6 text-sm font-black tracking-widest ${(staffMode ? activeStaffTask : activeTab) === t ? 'border-cyan-tactical text-cyan-tactical bg-cyan-tactical/5' : 'border-transparent text-text-dim hover:text-white'}`}>
                     {t}
                   </button>
                 ))}
              </nav>
           </div>

           <div className="flex items-center gap-10">
              <div className="flex bg-black/60 border border-white/10 p-1 rounded-sm shadow-2xl">
                 <button onClick={() => setStaffMode(true)} className={`px-8 py-2.5 text-xs font-black tracking-widest transition-all ${staffMode ? 'bg-cyan-tactical text-[#010409] shadow-[0_0_25px_rgba(0,210,255,0.5)]' : 'text-text-dim hover:text-white'}`}>OPS_MODE</button>
                 <button onClick={() => setStaffMode(false)} className={`px-8 py-2.5 text-xs font-black tracking-widest transition-all ${!staffMode ? 'bg-cyan-tactical text-[#010409] shadow-[0_0_25px_rgba(0,210,255,0.5)]' : 'text-text-dim hover:text-white'}`}>USER_MODE</button>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 border border-cyan-tactical/20 bg-cyan-tactical/5">
                 <div className="w-2.5 h-2.5 rounded-full bg-cyan-tactical animate-pulse shadow-[0_0_10px_var(--cyan-tactical)]" />
                 <span className="text-xs font-black text-cyan-tactical uppercase tracking-[0.3em]">LIVE_NODE_CONNECTED</span>
              </div>
           </div>
        </header>

        {/* ── 3-COLUMN WIDE GRID ── */}
        <div className="flex-1 flex min-h-0 bg-[#010409]">
           
           {/* COLUMN 1: GLOBAL METRICS & TRENDS (Staff Only) */}
           {staffMode && (
             <aside className="w-[420px] flex-shrink-0 border-r border-white/5 p-10 overflow-y-auto bg-[#0d1117]/30 backdrop-blur-md">
                <div className="space-y-12">
                   <div className="space-y-2">
                      <h2 className="tech-header text-cyan-tactical border-b border-cyan-tactical/20 pb-2">PREDICTIVE_ANALYTICS</h2>
                      <PredictiveChart label="LIVE_CROWD_DENSITY" data={history} />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <MetricBoxSmall label="CAPACITY" value="92%" color="var(--cyan-tactical)" />
                      <MetricBoxSmall label="LOAD_AVG" value="1.4s" color="var(--amber-tactical)" />
                   </div>

                   <div className="space-y-6">
                      <h2 className="tech-header text-cyan-tactical border-b border-cyan-tactical/20 pb-2">SYSTEM_HEALTH</h2>
                      <HealthBar label="NEURAL_ENGINE" value={88} max={100} unit="%" color="var(--cyan-tactical)" />
                      <HealthBar label="LATENCY_MS" value={14} max={100} unit="ms" color="var(--amber-tactical)" />
                      <HealthBar label="DATA_UPLINK" value={98} max={100} unit="%" color="var(--cyan-tactical)" />
                   </div>

                   <div className="pt-4">
                      <button className="btn-tactical w-full py-5 text-lg font-black tracking-[0.4em] shadow-[0_0_40px_rgba(0,210,255,0.1)] block">OVERRIDE_AI_FLOW</button>
                   </div>
                </div>
             </aside>
           )}

           {/* COLUMN 2: THE 3D MAP ENGINE */}
           <main className="flex-1 relative flex flex-col p-6 overflow-hidden bg-black/20">
              {/* Floating Layer Controls */}
              <div className="absolute top-10 left-10 z-[100] flex gap-4">
                 <button onClick={() => setShowHeatmap(!showHeatmap)} className={`px-6 py-2 text-[10px] font-black border-2 transition-all ${showHeatmap ? 'bg-cyan-tactical text-[#010409] border-cyan-tactical' : 'text-cyan-tactical border-cyan-tactical/40 bg-black/40'}`}>
                    LAYER: HEATMAP_{showHeatmap ? 'ON' : 'OFF'}
                 </button>
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
           <aside className="w-[450px] flex-shrink-0 border-l border-white/5 flex flex-col bg-[#0d1117]/30 backdrop-blur-md">
              <div className="flex-1 p-10 overflow-y-auto space-y-12">
                 {staffMode ? (
                   <>
                      <div className="space-y-4">
                         <h2 className="tech-header text-red-tactical border-b border-red-tactical/20 pb-2">CRITICAL_ACTION_LOG</h2>
                         <div className="space-y-4">
                            <ActionableAlert title="GATE_NORTH_CONGESTION" detail="89% Threshold Exceeded" time="14:52:01" status="CRITICAL" />
                            <ActionableAlert title="SENSOR_FAILURE: B2" detail="Mesh connectivity lost" time="14:51:22" status="WARNING" />
                         </div>
                      </div>
                      
                      <div className="space-y-4">
                         <h2 className="tech-header text-cyan-tactical border-b border-cyan-tactical/20 pb-2">AGENT_COMMUNICATION</h2>
                         <AgentLog logs={agentLogs} />
                      </div>
                   </>
                 ) : (
                   <AttendeeFocus onAction={handleAction} proximities={proximities} />
                 )}
              </div>

              {!staffMode && (
                <div className="p-10 border-t border-white/5 bg-black/20 space-y-8">
                   <AtmosphereMetrics 
                     noise={atmosphere.noise_level_db} 
                     aqi={atmosphere.air_quality_aqi} 
                     wifi={atmosphere.wifi_mesh_mbps} 
                   />
                   <div className="metric-card bg-black/40 border-cyan-tactical/10">
                      <div className="flex items-center gap-3 mb-2"><div className="w-2 h-2 bg-cyan-tactical rotate-45" /><span className="text-[10px] font-black tracking-widest text-[#5a7a8a] uppercase">MATCH_CLOCK</span></div>
                      <p className="text-6xl font-black font-mono text-white tracking-widest">{formatTime(matchSeconds)}</p>
                   </div>
                </div>
              )}
           </aside>
        </div>

        {/* ── Tactical Footer ── */}
        <footer className="h-[60px] border-t border-white/5 bg-[#0d1117] flex items-center justify-between px-10 text-xs font-black tracking-[0.3em] text-text-dim uppercase z-50">
           <div className="flex gap-16">
              <span className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-cyan-tactical shadow-[0_0_8px_var(--cyan-tactical)]" /> CORE_NOMINAL</span>
              <span className="flex items-center gap-3 text-cyan-tactical/40 hover:text-cyan-tactical transition-colors cursor-pointer"><div className="w-2.5 h-2.5 rounded-full border border-cyan-tactical/40" /> UPLINK: ENCRYPTED_TUNNEL</span>
           </div>
           <div className="flex gap-16">
              <span>LATENCY: 14MS</span>
              <span className="text-amber-tactical">CPU_LOAD: 34%</span>
              <span>v4.0.21_STABLE</span>
           </div>
        </footer>
      </div>
    </div>
  );
}

function SidebarIcon({ icon, label, active, onClick }) {
  return (
    <div className={`sidebar-nav-item w-full transition-all cursor-pointer group flex flex-col items-center justify-center p-4 border-l-4 ${active ? 'border-cyan-tactical bg-cyan-tactical/5 text-cyan-tactical' : 'border-transparent text-text-dim hover:text-white hover:bg-white/5'}`} onClick={onClick}>
       <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
       <span className="text-[10px] font-black tracking-widest uppercase">{label}</span>
    </div>
  );
}

function PredictiveChart({ label, data }) {
  const max = Math.max(...data, 100);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 340},${100 - (v / max) * 80}`).join(' ');
  
  return (
    <div className="p-6 bg-black/40 border border-white/5 rounded-sm relative group overflow-hidden">
       <div className="absolute top-0 right-0 p-2 text-[10px] font-black text-cyan-tactical animate-pulse">LIVE_PREDICTION</div>
       <p className="text-[10px] font-black tracking-widest text-[#5a7a8a] uppercase mb-4">{label}</p>
       <svg viewBox="0 0 340 100" className="w-full h-24 stroke-cyan-tactical fill-none overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1="20" x2="340" y2="20" stroke="rgba(255,255,255,0.05)" />
          <line x1="0" y1="40" x2="340" y2="40" stroke="rgba(255,255,255,0.05)" />
          <line x1="0" y1="60" x2="340" y2="60" stroke="rgba(255,255,255,0.05)" />
          <line x1="0" y1="80" x2="340" y2="80" stroke="rgba(255,255,255,0.05)" />
          
          <polyline points={points} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(0,210,255,0.5)]" />
          {/* Prediction Shadow Path */}
          <path d={`M ${points} L 340,100 L 0,100 Z`} fill="url(#chartGradient)" opacity="0.1" />
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
    <div className="p-4 bg-black/20 border border-white/5 rounded-sm flex flex-col justify-center">
       <p className="text-[9px] font-black tracking-widest text-[#5a7a8a] uppercase mb-1">{label}</p>
       <span className="text-2xl font-black font-mono tracking-widest" style={{ color }}>{value}</span>
    </div>
  );
}

function ActionableAlert({ title, detail, time, status }) {
  return (
    <div className={`p-5 border-l-4 rounded-sm flex flex-col gap-3 ${status === 'CRITICAL' ? 'bg-red-tactical/5 border-red-tactical' : 'bg-amber-tactical/5 border-amber-tactical'}`}>
       <div className="flex justify-between items-start">
          <div className="space-y-1">
             <h4 className="text-xs font-black tracking-widest text-white uppercase">{title}</h4>
             <p className="text-[10px] font-bold text-text-dim uppercase">{detail}</p>
          </div>
          <span className="text-[9px] font-black font-mono text-text-dim">{time}</span>
       </div>
       <div className="flex gap-2">
          <button className={`flex-1 py-1.5 text-[9px] font-black border transition-all ${status === 'CRITICAL' ? 'bg-red-tactical text-[#010409] border-red-tactical' : 'bg-amber-tactical text-[#010409] border-amber-tactical'}`}>RESOLVE_NOW</button>
          <button className="flex-1 py-1.5 text-[9px] font-black border border-white/20 text-white hover:bg-white/5">DEFER</button>
       </div>
    </div>
  );
}

function HealthBar({ label, value, max, unit, color }) {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-2">
       <div className="flex justify-between text-[10px] font-black tracking-widest text-text-dim">
          <span>{label}</span>
          <span style={{ color }}>{value}{unit}</span>
       </div>
       <div className="h-2 w-full bg-black/40 relative border border-white/10 rounded-full overflow-hidden">
          <div className="h-full transition-all duration-1000 shadow-[0_0_15px_rgba(0,210,255,0.3)]" style={{ width: `${percent}%`, backgroundColor: color }} />
       </div>
    </div>
  );
}
