import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMatchSimulation } from "./hooks/useMatchSimulation.jsx";
import OpsDashboard from "./components/OpsDashboard";
import AttendeeShell from "./components/AttendeeShell";
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

// ── Seat randomiser ────────────────────────────────────────────────────────────
const STANDS = [
  { key: "north", label: "SEC-NORTH", abbr: "N", gate: "N1" },
  { key: "south", label: "SEC-SOUTH", abbr: "S", gate: "S2" },
  { key: "east",  label: "SEC-EAST",  abbr: "E", gate: "E2" },
  { key: "west",  label: "SEC-WEST",  abbr: "W", gate: "W1" },
];

const randomSeatInfo = () => {
  const stand = STANDS[Math.floor(Math.random() * STANDS.length)];
  const row   = Math.floor(Math.random() * 25) + 1;
  const seat  = Math.floor(Math.random() * 60) + 1;
  // Pick a bypass gate (different from the primary gate)
  const altStand = STANDS.find(s => s.key !== stand.key && s.key !== "south") || STANDS[2];
  return { stand, row, seat, altGate: altStand.gate, altStandLabel: altStand.label };
};

// ── AI Navigation Suggestion ───────────────────────────────────────────────────
const aiNavigationSuggestion = (type, matchState, lastEvent, seatInfo) => {
  const si = seatInfo;
  const gateByStand = { north: "N1", south: "S2", east: "E2", west: "W1" };
  const standCrowd = Object.entries(matchState.capacity).map(([stand, value]) => ({
    stand,
    value,
    gate: gateByStand[stand],
  }));
  const bestGate    = [...standCrowd].sort((a, b) => a.value - b.value)[0];
  const busiestGate = [...standCrowd].sort((a, b) => b.value - a.value)[0];
  const highEnergy  = lastEvent === "SIX" || lastEvent === "WICKET" || matchState.noise_db >= 95;
  const primaryCap  = matchState.capacity[si.stand.key];

  if (type === "GUIDE_ENTRY") {
    const isCongested = primaryCap > 85;
    if (isCongested) {
      return {
        destination: `Bypass Route via Gate ${si.altGate}`,
        eta: "6-8 min",
        reason: `AI detected heavy congestion (${primaryCap}%) at primary Gate ${si.stand.gate}. Rerouting via Gate ${si.altGate} and inner concourse avoids a 12-min delay.`,
        steps: [
          `Enter through Gate ${si.altGate} (${si.altStandLabel}).`,
          `Skip the main stairs; use the left corridor labeled "${si.stand.abbr} Access".`,
          `Proceed 50m past the food court.`,
          `Take the ramp up to ${si.stand.label} Level 1.`,
          `Your seat (Row ${si.row}, Seat ${si.seat}) is in the third aisle on your right.`,
        ],
      };
    } else {
      return {
        destination: `Entry via Gate ${si.stand.gate}`,
        eta: "3-5 min",
        reason: `Gate ${si.stand.gate} is operating nominally at ${primaryCap}% capacity. Walk-in is direct.`,
        steps: [
          `Enter through Gate ${si.stand.gate}.`,
          `Take the main staircase up to Level 1.`,
          `Turn right towards Section ${si.stand.abbr}.`,
          `Your seat (Row ${si.row}, Seat ${si.seat}) is the second aisle on your left.`,
        ],
      };
    }
  }

  if (type === "GUIDE_SEAT") {
    return {
      destination: `Exit via Gate ${bestGate.gate}`,
      eta: highEnergy ? "4-6 min" : "3-4 min",
      reason: `AI selected Gate ${bestGate.gate} because it is currently the lowest load (${bestGate.value}%), avoiding ${busiestGate.gate} at ${busiestGate.value}%.`,
      steps: [
        `From Seat ${si.seat}, move straight to the main aisle at Row ${si.row}.`,
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
      `Walk straight to the concourse connector from Row ${si.row}.`,
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

  // Randomised attendee seat (stable for session)
  const [seatInfo] = useState(() => randomSeatInfo());

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
      id: "alert-1",
      title: "Gate North · Congestion Alert",
      detail: "North stand capacity threshold reached",
      time: "17:26:11",
      status: "critical",
    },
    {
      id: "alert-2",
      title: "West Concourse · Thermal Warning",
      detail: "Temperature above optimal baseline",
      time: "17:29:45",
      status: "critical",
    },
    {
      id: "alert-3",
      title: "Zone C · Wait Time Escalation",
      detail: "Food queue depth critically high",
      time: "17:31:02",
      status: "critical",
    },
    {
      id: "alert-4",
      title: "S1 Exit · Flow Disruption",
      detail: "Minor bottleneck forming near stairwell",
      time: "17:34:15",
      status: "critical",
    },
  ]);

  // Medical Flow State Tracker
  const [medicalStatus, setMedicalStatus] = useState(null);

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

  const [isOverrideActive, setIsOverrideActive] = useState(false);

  const handleOverrideFlow = () => {
    setIsOverrideActive(prev => !prev);
    setOverrideToast(true);
    setTimeout(() => setOverrideToast(false), 2600);
  };

  const handleResolveAlert = (alert) => {
    setActiveAlerts((prev) => prev.filter((item) => item.id !== alert.id));
    
    if (alert.id.startsWith("medical")) {
      setMedicalStatus("resolved");
      showOpsToast("✓ Medical assistance complete", "success");
      prependAgentLog(
        createLogEntry("Guardian", "#10B981", `Medical alert at ${alert.detail} resolved safely.`)
      );
      return;
    }
    
    showOpsToast(`✓ Alert resolved`, "success");
    prependAgentLog(
      createLogEntry(
        "Sync Agent",
        "#3B82F6",
        `Congestion resolved. Flow returned to nominal.`,
      ),
    );
  };

  const handleMedicalSOS = () => {
    if (medicalStatus === "pending") return;
    setMedicalStatus("pending");
    setActiveAlerts((prev) => [{
      id: `medical-${Date.now()}`,
      title: "Medical Emergency · Critical",
      detail: `${seatInfo.stand.label} · Row ${seatInfo.row} · Seat ${seatInfo.seat}`,
      time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' }),
      status: "critical"
    }, ...prev]);
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
    if (!staffMode && (type === "GUIDE_SEAT" || type === "GUIDE_ENTRY" || type.startsWith("POI_"))) {
      const nav = aiNavigationSuggestion(type, matchState, lastEvent, seatInfo);
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
      <OpsDashboard
        matchState={matchState}
        history={history}
        standCapacities={standCapacities}
        path={path}
        sosAlerts={sosAlerts}
        userPos={userPos}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        lastEvent={lastEvent}
        liveAgentLogs={liveAgentLogs}
        activeAlerts={activeAlerts}
        scenarioMenuOpen={scenarioMenuOpen}
        setScenarioMenuOpen={setScenarioMenuOpen}
        opsToasts={opsToasts}
        isInsightOpen={isInsightOpen}
        setIsInsightOpen={setIsInsightOpen}
        overrideToast={overrideToast}
        isOverrideActive={isOverrideActive}
        onOverrideFlow={handleOverrideFlow}
        onRunScenario={handleRunScenario}
        onResolveAlert={handleResolveAlert}
        renderAdminToggle={renderAdminToggle}
      />
    );
  }

  return (
    <AttendeeShell
      mobileTab={mobileTab}
      setMobileTab={setMobileTab}
      matchState={matchState}
      time={time}
      proximities={proximities}
      handleAction={handleAction}
      standCapacities={standCapacities}
      path={path}
      sosAlerts={sosAlerts}
      userPos={userPos}
      showHeatmap={showHeatmap}
      setShowHeatmap={setShowHeatmap}
      lastEvent={lastEvent}
      liveAgentLogs={liveAgentLogs}
      isInsightOpen={isInsightOpen}
      setIsInsightOpen={setIsInsightOpen}
      navGuide={navGuide}
      setNavGuide={setNavGuide}
      renderAdminToggle={renderAdminToggle}
      medicalStatus={medicalStatus}
      handleMedicalSOS={handleMedicalSOS}
      seatInfo={seatInfo}
    />
  );
}
