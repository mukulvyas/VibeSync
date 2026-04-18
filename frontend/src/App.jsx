import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMatchSimulation } from "./hooks/useMatchSimulation.jsx";
import VibeMap from "./components/VibeMap";
import AttendeeFocus from "./components/AttendeeFocus";
import AtmosphereMetrics from "./components/AtmosphereMetrics";
import AgentLog from "./components/AgentLog";
import AIInsightDrawer from "./components/AIInsightDrawer";
import { findPath } from "./utils/api";

const AGENT_META = {
  Guardian: { initials: "GD", avatar: "#10B981" },
  "Sync Agent": { initials: "SA", avatar: "#3B82F6" },
  "Flow Agent": { initials: "FA", avatar: "#F97316" },
};

const BACKGROUND_MONITOR_MESSAGES = [
  {
    agent: "Guardian",
    color: "#10B981",
    msg: "Perimeter scan complete. All gates nominal.",
  },
  {
    agent: "Sync Agent",
    color: "#3B82F6",
    msg: "Hydration station W2 queue: 3 people. Clear.",
  },
  {
    agent: "Flow Agent",
    color: "#F97316",
    msg: "Concourse temperature: 31degC. Ventilation adjusted.",
  },
];

const aiNavigationSuggestion = (type, matchState, lastEvent) => {
  const gateByStand = {
    north: "N1",
    south: "S2",
    east: "E2",
    west: "W1",
  };
  const standCrowd = Object.entries(matchState.capacity).map(([stand, value]) => ({
    stand,
    value,
    gate: gateByStand[stand],
  }));
  const bestGate = [...standCrowd].sort((a, b) => a.value - b.value)[0];
  const busiestGate = [...standCrowd].sort((a, b) => b.value - a.value)[0];
  const highEnergy = lastEvent === "SIX" || lastEvent === "WICKET" || matchState.noise_db >= 95;

  if (type === "GUIDE_SEAT") {
    return {
      destination: `Exit via Gate ${bestGate.gate}`,
      eta: highEnergy ? "4-6 min" : "3-4 min",
      reason: `AI selected Gate ${bestGate.gate} because it is currently the lowest load (${bestGate.value}%), avoiding ${busiestGate.gate} at ${busiestGate.value}%.`,
      steps: [
        "From Seat 43, move straight to the main aisle at Row 12.",
        `Follow EXIT signage toward ${bestGate.stand.toUpperCase()} concourse.`,
        "Stay on the outer lane and avoid the center crowd cluster.",
        `At the split checkpoint, keep ${bestGate.stand === "east" || bestGate.stand === "south" ? "right" : "left"} for Gate ${bestGate.gate}.`,
        `You will see overhead EXIT signage for Gate ${bestGate.gate}.`,
      ],
    };
  }

  if (type === "POI_FOOD") {
    return {
      destination: "Food Court",
      eta: matchState.capacity.east > 82 ? "6-8 min" : "4-6 min",
      reason: `AI detected ${matchState.capacity.east}% crowd at East stand and suggests the clearer inner concourse corridor for faster service access.`,
      steps: [
        "Walk straight to the central stairs from your row.",
        "Take stairs down to Concourse Level 1.",
        "Turn right at FOOD & BEVERAGES wayfinding.",
        "Use the inner concourse lane to bypass queue pockets.",
        "Food Court appears on the left after beverage counters.",
      ],
    };
  }

  if (type === "POI_WASHROOM") {
    return {
      destination: "Washroom HUB08",
      eta: matchState.capacity.south > 80 ? "3-5 min" : "2-3 min",
      reason: `AI is rerouting around South stand pressure (${matchState.capacity.south}%) to keep washroom access smoother.`,
      steps: [
        "Move to the nearest aisle opening from your seat.",
        "Turn right and follow blue RESTROOM signage.",
        "Keep to the wall-side path past security post A.",
        "Continue 25 meters; HUB08 entrance is on the right.",
      ],
    };
  }

  return {
    destination: "Hydration Station W2",
    eta: highEnergy ? "3-5 min" : "2-4 min",
    reason: `AI recommended W2 due to current demand balancing and event intensity (${lastEvent || "LIVE_PLAY"}).`,
    steps: [
      "Walk straight to the concourse connector from Row 12.",
      "Turn left at the WATER / REFILL signboard.",
      "Pass the merch cart and stay in the express lane.",
      "Hydration Station W2 is next to pillar W2.",
    ],
  };
};

const generateAgentMessage = (event, matchState) => {
  const messages = {
    WICKET: [
      {
        agent: "Flow Agent",
        color: "#F97316",
        msg: `WICKET EVENT: Crowd surge detected at South Stand. Capacity spike to ${Math.min(
          100,
          matchState.capacity.south + 4,
        )}%. Activating overflow gates S3.`,
      },
      {
        agent: "Sync Agent",
        color: "#3B82F6",
        msg: "Gate S2 queue spiking post-wicket. Deploying staff to manage flow.",
      },
    ],
    SIX: [
      {
        agent: "Guardian",
        color: "#10B981",
        msg: `SIX! Noise level at ${matchState.noise_db}dB. All sections nominal. High energy detected.`,
      },
    ],
    FOUR: [
      {
        agent: "Flow Agent",
        color: "#F97316",
        msg: "Concourse B movement spike. Fans moving to viewing areas. Monitoring.",
      },
    ],
    DRINKS_BREAK: [
      {
        agent: "Sync Agent",
        color: "#3B82F6",
        msg: "DRINKS BREAK: Hydration demand rising on West concourse. Queue balancing active.",
      },
    ],
    INNINGS_END: [
      {
        agent: "Guardian",
        color: "#10B981",
        msg: "INNINGS END: Security posture shifted for innings transition. Crowd routing stabilized.",
      },
    ],
    RUN: [
      {
        agent: "Sync Agent",
        color: "#3B82F6",
        msg: "Routine play update processed. Transit lanes remain clear.",
      },
    ],
    DOT: [
      {
        agent: "Guardian",
        color: "#10B981",
        msg: "Dot ball. Crowd pulse steady and control systems nominal.",
      },
    ],
  };

  const eventMessages = messages[event.type];
  if (!eventMessages?.length) return null;
  return eventMessages[Math.floor(Math.random() * eventMessages.length)];
};

const createLogEntry = (agent, color, text) => {
  const meta = AGENT_META[agent] ?? { initials: "AI", avatar: color };
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agent,
    initials: meta.initials,
    avatar: color || meta.avatar,
    timestamp: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    text,
  };
};

const createResetMessages = () => [
  createLogEntry(
    "Guardian",
    "#10B981",
    "New match cycle initialized. Security zones reset and active.",
  ),
  createLogEntry(
    "Sync Agent",
    "#3B82F6",
    "Ingress and hydration counters reset. Monitoring baseline crowd flow.",
  ),
  createLogEntry(
    "Flow Agent",
    "#F97316",
    "Routing model recalibrated for opening overs. Intel stream resumed.",
  ),
];

/**
 * VisionSync Superiority Overhaul
 * Role: Lead Digital Twin Architect
 * Changes: 3-Column Wide Grid, Predictive SVG Charts, Actionable Intelligence.
 */

export default function App() {
  const { matchState, lastEvent, triggerScenario } = useMatchSimulation();
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
  const [navGuide, setNavGuide] = useState(null);
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);
  const [opsToasts, setOpsToasts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState(() => [
    {
      id: "alert-gate-north",
      title: "Gate North · Congestion Alert",
      detail: "North stand capacity threshold reached",
      time: "17:26:11",
      status: "critical",
    },
  ]);

  // User position
  const [userPos, setUserPos] = useState({ row: 8, col: 4 });
  const [time, setTime] = useState(0);

  // Historical crowd density values from simulation state
  const [history, setHistory] = useState(() =>
    Array.from({ length: 20 }, () =>
      Math.round(
        (matchState.capacity.north +
          matchState.capacity.south +
          matchState.capacity.east +
          matchState.capacity.west) /
          4,
      ),
    ),
  );
  const [liveAgentLogs, setLiveAgentLogs] = useState(() => createResetMessages());
  const previousEventRef = useRef(null);
  const previousPhaseRef = useRef(matchState.phase);
  const resetTimerRef = useRef(null);
  const capacityRef = useRef(matchState.capacity);

  const showOpsToast = (message, variant = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setOpsToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setOpsToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2200);
  };

  useEffect(() => {
    capacityRef.current = matchState.capacity;
  }, [matchState.capacity]);

  useEffect(() => {
    const timer = setInterval(() => {
      const avgCapacity = Math.round(
        (capacityRef.current.north +
          capacityRef.current.south +
          capacityRef.current.east +
          capacityRef.current.west) /
          4,
      );
      setHistory((h) => [...h.slice(-19), avgCapacity]);
    }, 4000);

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

  const prependAgentLog = (entry) => {
    setLiveAgentLogs((prev) => [entry, ...prev].slice(0, 6));
  };

  useEffect(() => {
    if (!lastEvent) {
      if (matchState.phase === "in_play") {
        previousEventRef.current = null;
      }
      return;
    }

    if (previousEventRef.current === lastEvent) return;
    previousEventRef.current = lastEvent;

    const generated = generateAgentMessage({ type: lastEvent }, matchState);
    if (!generated) return;
    prependAgentLog(createLogEntry(generated.agent, generated.color, generated.msg));
  }, [lastEvent, matchState]);

  useEffect(() => {
    const monitorInterval = setInterval(() => {
      const randomMessage =
        BACKGROUND_MONITOR_MESSAGES[
          Math.floor(Math.random() * BACKGROUND_MONITOR_MESSAGES.length)
        ];
      prependAgentLog(
        createLogEntry(randomMessage.agent, randomMessage.color, randomMessage.msg),
      );
    }, 8000);

    return () => clearInterval(monitorInterval);
  }, []);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    if (previousPhase === matchState.phase) return;
    previousPhaseRef.current = matchState.phase;

    if (matchState.phase === "innings_end" || matchState.phase === "match_over") {
      prependAgentLog(
        createLogEntry(
          "Guardian",
          "#10B981",
          "MATCH COMPLETE. Beginning crowd dispersal protocol.",
        ),
      );
      prependAgentLog(
        createLogEntry(
          "Flow Agent",
          "#F97316",
          "Exit routing optimized. Gates S1,S2,W1 opened fully.",
        ),
      );

      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        const resetMessages = createResetMessages();
        setLiveAgentLogs(resetMessages);
        previousEventRef.current = null;
      }, 10000);
    }
  }, [matchState.phase]);

  useEffect(() => {
    return () => {
      clearTimeout(resetTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleOverrideFlow = () => {
    setOverrideToast(true);
    setTimeout(() => setOverrideToast(false), 2600);
  };

  const handleResolveAlert = (alert) => {
    setActiveAlerts((prev) => prev.filter((item) => item.id !== alert.id));
    showOpsToast("✓ Gate North alert resolved", "success");
    prependAgentLog(
      createLogEntry(
        "Sync Agent",
        "#3B82F6",
        "Gate North congestion resolved. Flow returned to nominal.",
      ),
    );
  };

  const handleRunScenario = (scenarioType, label) => {
    triggerScenario(scenarioType);
    setScenarioMenuOpen(false);
    showOpsToast(`Scenario: ${label} activated`);

    if (scenarioType === "FULL_HOUSE") {
      setActiveAlerts((prev) => [
        {
          id: `alert-full-house-${Date.now()}`,
          title: "East Stand · 97% Capacity · Critical",
          detail: "Critical occupancy reached during Full House scenario",
          time: new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "critical",
        },
        ...prev,
      ]);
    }

    if (scenarioType === "RAIN_DELAY") {
      setActiveAlerts((prev) => [
        {
          id: `alert-rain-delay-${Date.now()}`,
          title: "Weather Alert · Rain possible in 20min",
          detail: "Weather radar indicates incoming rain band. Monitor movement.",
          time: new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "warning",
        },
        ...prev,
      ]);
    }
  };

  const handleAction = async (type) => {
    if (!staffMode && (type === "GUIDE_SEAT" || type.startsWith("POI_"))) {
      const nav = aiNavigationSuggestion(type, matchState, lastEvent);
      setNavGuide({
        id: `${Date.now()}`,
        destination: nav.destination,
        eta: nav.eta,
        reason: nav.reason,
        steps: nav.steps,
      });
      return;
    }

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
      <div className="flex h-screen overflow-y-auto font-sans selection:bg-cyan-tactical/30 text-text-primary theme-ops">
        <div className="flex-1 flex flex-col min-w-0">
          <header className="min-h-[100px] flex-shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-10 py-4 md:py-0 gap-4 border-b border-white/5 bg-[#0A0E1A]/95 backdrop-blur-3xl z-50 grid-texture">
            <div className="flex items-center gap-5">
              <div className="w-8 h-8 border-2 border-cyan-tactical flex items-center justify-center text-cyan-tactical font-black text-lg shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                VS
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-[0.1em] text-white font-heading">Ops Command</h1>
                <span className="text-[10px] font-bold text-cyan-tactical/60 tracking-[0.2em] font-heading">Mission Control v4</span>
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-10 w-full md:w-auto justify-between md:justify-start">
              {renderAdminToggle()}
            <div className="status-pill-badge">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#10b981] animate-pulse" />
              SYSTEM ONLINE
            </div>
            </div>
          </header>

          <div className="flex-1 xl:flex xl:flex-row min-h-0 bg-[#010409]">
            <aside className="w-full xl:w-[360px] 2xl:w-[420px] flex-shrink-0 border-b xl:border-b-0 xl:border-r border-white/5 p-4 md:p-6 xl:p-10 overflow-visible xl:overflow-y-auto bg-[#0d1117]/30 backdrop-blur-md max-h-none xl:max-h-none">
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
                <div className="relative">
                  <button
                    onClick={() => setScenarioMenuOpen((prev) => !prev)}
                    className="w-full py-4 rounded-xl text-xs font-black tracking-[0.16em] uppercase"
                    style={{
                      border: "1px solid rgba(99,179,237,0.3)",
                      background: "transparent",
                      color: "#60A5FA",
                    }}
                  >
                    ⚡ Run Scenario
                  </button>
                  {scenarioMenuOpen && (
                    <div className="absolute top-[110%] left-0 right-0 z-[150] rounded-xl border border-white/10 bg-[#0E1623] overflow-hidden shadow-2xl">
                      <button
                        className="w-full text-left px-4 py-3 text-[11px] font-bold text-white/90 hover:bg-white/5"
                        onClick={() => handleRunScenario("FULL_HOUSE", "Full House")}
                      >
                        🏟️ Full House
                      </button>
                      <button
                        className="w-full text-left px-4 py-3 text-[11px] font-bold text-white/90 hover:bg-white/5 border-t border-white/5"
                        onClick={() => handleRunScenario("WICKET_STORM", "Wicket Storm")}
                      >
                        ⚡ Wicket Storm
                      </button>
                      <button
                        className="w-full text-left px-4 py-3 text-[11px] font-bold text-white/90 hover:bg-white/5 border-t border-white/5"
                        onClick={() => handleRunScenario("RAIN_DELAY", "Rain Delay")}
                      >
                        🌧️ Rain Delay
                      </button>
                      <button
                        className="w-full text-left px-4 py-3 text-[11px] font-bold text-white/90 hover:bg-white/5 border-t border-white/5"
                        onClick={() => handleRunScenario("MATCH_OVER", "Match Over")}
                      >
                        🏆 Match Over
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <main className="xl:flex-1 relative flex flex-col p-3 md:p-6 overflow-visible xl:overflow-hidden bg-black/20 min-h-[520px] xl:min-h-0">
              <div className="absolute top-4 md:top-10 left-4 md:left-10 z-[100]">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl p-2 rounded-full border border-white/5 shadow-2xl">
                  <span className="text-[10px] font-black tracking-widest text-text-dim uppercase ml-4">Heat Map</span>
                  <div className="w-14 h-7 bg-white/5 rounded-full relative p-1 cursor-pointer" onClick={() => setShowHeatmap(!showHeatmap)}>
                    <div className={`w-5 h-5 rounded-full transition-all duration-300 shadow-lg ${showHeatmap ? 'translate-x-7 bg-cyan-tactical' : 'translate-x-0 bg-text-dim'}`} />
                  </div>
                </div>
              </div>
              <VibeMap venueData={null} standCapacities={standCapacities} path={path} sosAlerts={sosAlerts} attendeeMode={false} userPos={userPos} incentives={[]} showHeatmap={showHeatmap} lastEvent={lastEvent} />
            </main>

            <aside className="w-full xl:w-[420px] 2xl:w-[450px] flex-shrink-0 border-t xl:border-t-0 xl:border-l border-white/5 flex flex-col bg-[#0A0E1A]/40 backdrop-blur-md max-h-none xl:max-h-none">
              <div className="flex-1 p-4 md:p-6 xl:p-10 overflow-visible xl:overflow-y-auto space-y-12">
                <div className="space-y-6">
                  <h2 className="tech-header text-red-tactical border-b border-white/5 pb-2 font-heading">Critical Alerts</h2>
                  <div className="space-y-4">
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
                          onResolve={() => handleResolveAlert(alert)}
                        />
                      ))
                    )}
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
          <OpsToastStack toasts={opsToasts} />
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
             <VibeMap venueData={null} standCapacities={standCapacities} path={path} sosAlerts={sosAlerts} attendeeMode={true} userPos={userPos} incentives={[]} showHeatmap={showHeatmap} lastEvent={lastEvent} />
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
      {navGuide && <NavigationGuideModal guide={navGuide} onClose={() => setNavGuide(null)} />}
      
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

function NavigationGuideModal({ guide, onClose }) {
  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-20">
      <div className="w-full max-w-[480px] p-5 rounded-[24px] border border-white/10 bg-[#0E1623] shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-[#F59E0B] uppercase">
              AI Route Suggestion
            </p>
            <h3 className="text-lg font-black text-white mt-1">{guide.destination}</h3>
            <p className="text-[11px] text-text-secondary mt-1">Estimated walk: {guide.eta}</p>
          </div>
          <button
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-white/5 text-white border border-white/10"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="rounded-xl bg-[#111827] border border-white/10 p-3">
          <p className="text-[10px] text-[#8BA3C4] uppercase tracking-widest font-black">Why this route</p>
          <p className="text-[11px] text-white/85 mt-1 leading-relaxed">{guide.reason}</p>
        </div>
        <div className="space-y-2">
          {guide.steps.map((step, index) => (
            <div key={`${guide.id}-${index}`} className="flex gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-[#1F2937] text-[10px] font-black text-[#F59E0B] flex items-center justify-center">
                {index + 1}
              </span>
              <p className="text-[11px] leading-relaxed text-white/85">{step}</p>
            </div>
          ))}
        </div>
        <button
          className="w-full py-3 rounded-xl bg-[#3B82F6] text-white text-[11px] font-black tracking-[0.15em] uppercase"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
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
            onClick={handleResolve}
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

function OpsToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-6 right-6 z-[900] space-y-2">
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
