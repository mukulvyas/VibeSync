import { useState, useCallback, useEffect, useRef } from 'react';
import { useVenueData } from './hooks/useVenueData';
import VibeMap from './components/VibeMap';
import AttendeeFocus from './components/AttendeeFocus';
import AtmosphereMetrics from './components/AtmosphereMetrics';
import ZoneStatusList from './components/ZoneStatusList';
import GuardianSOS from './components/GuardianSOS';
import AgentLog from './components/AgentLog';
import IncentiveToast from './components/IncentiveToast';
import { findPath } from './utils/api';

export default function App() {
  const { venueData, incentives, agentLogs, connected, tick, dismissIncentive, atmosphere } = useVenueData();
  const [staffMode, setStaffMode] = useState(false);
  const [path, setPath] = useState(null);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('MAP'); // MAP, SERVICES, ALERTS, LOGS
  const [activeStaffTask, setActiveStaffTask] = useState('ANALYTICS'); // ANALYTICS, LOGISTICS, SECURITY, TICKETING

  // Match countdown: 14:02:04
  const [matchSeconds, setMatchSeconds] = useState(842);

  useEffect(() => {
    const timer = setInterval(() => {
      setMatchSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleAction = async (type) => {
    if (type === 'GUIDE_SEAT' || type.startsWith('POI_')) {
      const target = type === 'GUIDE_SEAT' ? 'N13' : type; // Mocking seat target
      try {
        const data = await findPath(target, 0, 0); // Mock start at 0,0
        setPath(data.path);
        setActiveTab('MAP');
      } catch (e) {
        console.error('Pathfind failed:', e);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-space font-mono selection:bg-cyan-tactical/30">
      {/* ── Left Rail Sidebar ── */}
      <aside className="w-[80px] flex-shrink-0 tactical-sidebar">
        <div className="h-[80px] flex items-center justify-center border-b border-border-dim">
           <div className="w-10 h-10 border border-cyan-tactical flex items-center justify-center text-cyan-tactical font-bold text-xl">⬡</div>
        </div>
        <div className="flex-1 py-8 flex flex-col items-center gap-1">
          <SidebarIcon icon="📁" label="COMMAND" active />
          <SidebarIcon icon="🛰️" label="ZONES" />
          <SidebarIcon icon="📦" label="ASSETS" />
          <SidebarIcon icon="💬" label="COMMS" />
          <SidebarIcon icon="🔍" label="INTEL" />
        </div>
        <div className="p-4 border-t border-border-dim flex flex-col items-center gap-4">
           <div className="p-2 border border-red-tactical/30 text-red-tactical">⚠️</div>
           <button className="w-10 h-10 rounded-full border border-border-dim overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" />
           </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ── Header ── */}
        <header className="h-[80px] flex-shrink-0 flex items-center justify-between px-8 border-b border-border-dim bg-bg-panel/50 backdrop-blur-md">
           <div className="flex items-center gap-12">
              <h1 className="text-xl font-bold tracking-[0.3em] text-white">
                 {staffMode ? 'STADIUM_CORE' : 'SENTINEL COMMAND'}
              </h1>
              
              {/* Navigation Tabs */}
              <nav className="flex gap-8 h-[80px]">
                 {staffMode ? (
                   ['ANALYTICS', 'LOGISTICS', 'SECURITY', 'TICKETING'].map(t => (
                     <button key={t} onClick={() => setActiveStaffTask(t)} 
                       className={`h-full border-b-2 transition-all px-2 text-[11px] font-bold tracking-widest ${activeStaffTask === t ? 'border-cyan-tactical text-cyan-tactical' : 'border-transparent text-text-dim hover:text-white'}`}>
                       {t}
                     </button>
                   ))
                 ) : (
                   ['MAP', 'SERVICES', 'ALERTS', 'LOGS'].map(t => (
                     <button key={t} onClick={() => setActiveTab(t)} 
                       className={`h-full border-b-2 transition-all px-2 text-[11px] font-bold tracking-widest ${activeTab === t ? 'border-cyan-tactical text-cyan-tactical' : 'border-transparent text-text-dim hover:text-white'}`}>
                       {t}
                     </button>
                   ))
                 )}
              </nav>
           </div>

           <div className="flex items-center gap-6">
              {/* Mode Switcher — Button Style */}
              <div className="flex bg-bg-space/80 border border-border-dim p-1">
                 <button 
                   onClick={() => setStaffMode(true)}
                   className={`px-3 py-1 text-[10px] font-bold tracking-widest transition-all ${staffMode ? 'bg-cyan-tactical text-bg-space' : 'text-text-dim hover:text-white'}`}
                 >
                   STAFF_OPS
                 </button>
                 <button 
                   onClick={() => setStaffMode(false)}
                   className={`px-3 py-1 text-[10px] font-bold tracking-widest transition-all ${!staffMode ? 'bg-cyan-tactical text-bg-space' : 'text-text-dim hover:text-white'}`}
                 >
                   ATTENDEE
                 </button>
              </div>

              <div className="h-4 w-[1px] bg-border-dim" />
              
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-cyan-tactical animate-pulse" />
                 <span className="text-[10px] font-bold text-cyan-tactical uppercase tracking-widest">LIVE_FEED</span>
              </div>
           </div>
        </header>

        {/* ── Dashboad Content ── */}
        <div className="flex-1 flex min-h-0">
           
           {/* LEFT SIDEBAR (Focused Data) */}
           <aside className="w-[320px] flex-shrink-0 border-r border-border-dim p-6 overflow-y-auto">
              {staffMode ? (
                <div className="space-y-8">
                   <MetricBox label="TOTAL_ATTENDANCE" value="54,821" sub="+2.4% CAPACITY" status="UP" />
                   <MetricBox label="FLOW_RATE_NORTH" value="412" sub="P/MIN" bar={75} />
                   <MetricBox label="SECURITY_ALERTS" value="02" sub="GATE_4_SENS_HIGH" status="CRITICAL" />
                   <div className="pt-8">
                      <button className="btn-tactical w-full py-4 tracking-[0.4em]">DEPLOY_RESOURCES</button>
                   </div>
                </div>
              ) : (
                <AttendeeFocus onAction={handleAction} />
              )}
           </aside>

           {/* CENTER (Interactive Map) */}
           <main className="flex-1 relative flex flex-col p-6 overflow-hidden">
              <VibeMap 
                venueData={venueData} 
                path={path} 
                sosAlerts={sosAlerts} 
                attendeeMode={!staffMode} 
              />
           </main>

           {/* RIGHT SIDEBAR (Monitoring) */}
           <aside className="w-[320px] flex-shrink-0 border-l border-border-dim p-6 overflow-y-auto">
              {staffMode ? (
                <ZoneStatusList venueData={venueData} />
              ) : (
                <div className="space-y-12">
                   <AtmosphereMetrics 
                     noise={atmosphere?.noise_level_db || 0} 
                     aqi={atmosphere?.air_quality_aqi || 0} 
                     wifi={atmosphere?.wifi_mesh_mbps || 0} 
                   />
                   
                   <div className="space-y-4">
                      <SectionHeader label="CURRENT EVENT" />
                      <div className="metric-card">
                         <h4 className="text-[10px] font-bold tracking-widest text-[#5a7a8a] uppercase mb-1">CYBER-FINALS 2024: ALPHA VS OMEGA</h4>
                         <p className="text-3xl font-bold font-rajdhani text-white tracking-widest">{formatTime(matchSeconds)}</p>
                         <div className="mt-4 h-[2px] w-full bg-bg-space">
                            <div className="h-full bg-red-tactical" style={{ width: `${(matchSeconds/842)*100}%` }} />
                         </div>
                      </div>
                   </div>

                   <div className="pt-8">
                      <button className="btn-tactical w-full py-3 flex items-center justify-center gap-3 group">
                         <span className="text-lg group-hover:scale-110 transition-transform">🎧</span>
                         REQUEST ASSISTANCE
                      </button>
                   </div>
                </div>
              )}
           </aside>

        </div>

        {/* ── Footer Status ── */}
        <footer className="h-[40px] flex-shrink-0 border-t border-border-dim bg-bg-panel/80 flex items-center justify-between px-6 text-[9px] font-mono font-bold tracking-widest text-text-dim uppercase">
           <div className="flex gap-8">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-tactical" /> SYSTEM_STABLE</span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#5a7a8a]" /> UPLINK_ENCRYPTED</span>
           </div>
           <div className="flex gap-8">
              <span>LATENCY: 14MS</span>
              <span>ENC: AES-256-GCM</span>
              <span>CORE_TEMP: 34°C</span>
           </div>
        </footer>

      </div>

      <IncentiveToast incentives={incentives} onDismiss={dismissIncentive} />
    </div>
  );
}

function SidebarIcon({ icon, label, active }) {
  return (
    <div className={`sidebar-nav-item w-full ${active ? 'active' : ''}`}>
       <div className="text-xl mb-1">{icon}</div>
       <span className="text-[9px] font-bold tracking-tight">{label}</span>
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1.5 h-1.5 bg-cyan-tactical rotate-45" />
      <span className="text-[11px] font-bold tracking-[0.2em] text-text-dim uppercase">{label}</span>
    </div>
  );
}

function MetricBox({ label, value, sub, status, bar }) {
  return (
    <div className="metric-card space-y-2">
       <p className="text-[9px] font-mono tracking-widest text-[#5a7a8a] uppercase">{label}</p>
       <div className="flex justify-between items-end">
          <span className="text-4xl font-rajdhani font-bold text-white tracking-widest">{value}</span>
          {status && (
            <span className={`text-[10px] font-bold pb-1 ${status === 'CRITICAL' ? 'text-red-tactical' : 'text-cyan-tactical'}`}>
               {status === 'UP' ? '↗' : ''} {sub}
            </span>
          )}
       </div>
       {!status && <p className="text-[10px] text-cyan-tactical/60 tracking-widest">{sub}</p>}
       {bar && (
         <div className="h-1 w-full bg-bg-space mt-4">
            <div className="h-full bg-cyan-tactical" style={{ width: `${bar}%` }} />
         </div>
       )}
    </div>
  );
}
