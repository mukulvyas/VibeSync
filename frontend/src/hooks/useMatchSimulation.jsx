import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const MatchSimulationContext = createContext(null);

const INITIAL_MATCH_STATE = {
  batting_team: "IND",
  score: 142,
  wickets: 3,
  overs: 14.2,
  last_event: null,
  capacity: {
    north: 89,
    south: 76,
    east: 82,
    west: 71,
  },
  noise_db: 86,
  phase: "in_play",
};

const EVENT_POOL = [
  { type: "DOT", runs: 0, noise_spike: -5, crowd_surge: 0, weight: 30 },
  { type: "RUN_1", runs: 1, noise_spike: 2, crowd_surge: 0, weight: 25 },
  { type: "RUN_2", runs: 2, noise_spike: 5, crowd_surge: 0, weight: 15 },
  { type: "RUN_3", runs: 3, noise_spike: 8, crowd_surge: 0, weight: 5 },
  { type: "FOUR", runs: 4, noise_spike: 12, crowd_surge: 1, weight: 12 },
  { type: "SIX", runs: 6, noise_spike: 18, crowd_surge: 3, weight: 8 },
  { type: "WICKET", runs: 0, noise_spike: 20, crowd_surge: 4, weight: 5 },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function weightedEvent() {
  const total = EVENT_POOL.reduce((acc, e) => acc + e.weight, 0);
  let roll = Math.random() * total;
  for (const item of EVENT_POOL) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return EVENT_POOL[0];
}

function nextOverValue(current) {
  const whole = Math.floor(current);
  const decimal = Math.round((current - whole) * 10);
  const nextBall = decimal + 1;
  if (nextBall >= 6) return whole + 1;
  return Number(`${whole}.${nextBall}`);
}

function useMatchSimulationEngine() {
  const [matchState, setMatchState] = useState(INITIAL_MATCH_STATE);
  const [lastEvent, setLastEvent] = useState(null);
  const eventIntervalRef = useRef(null);
  const driftIntervalRef = useRef(null);
  const noiseDecayRef = useRef(null);
  const inningsResetRef = useRef(null);

  const baseNoise = 78;

  const resetMatch = () => {
    setMatchState({
      ...INITIAL_MATCH_STATE,
      score: 0,
      wickets: 0,
      overs: 0.0,
      phase: "in_play",
      last_event: null,
    });
    setLastEvent(null);
  };

  const spikeAndDecayNoise = (spike) => {
    const nextNoise = clamp(
      baseNoise + spike + (Math.random() * 6 - 3),
      65,
      105,
    );

    setMatchState((prev) => ({ ...prev, noise_db: Math.round(nextNoise) }));

    clearTimeout(noiseDecayRef.current);
    noiseDecayRef.current = setTimeout(() => {
      setMatchState((prev) => ({ ...prev, noise_db: baseNoise }));
    }, 3000);
  };

  const tickBall = () => {
    setMatchState((prev) => {
      if (prev.phase !== "in_play") return prev;

      const event = weightedEvent();
      const nextWickets =
        event.type === "WICKET" ? clamp(prev.wickets + 1, 0, 10) : prev.wickets;
      const nextOvers = nextOverValue(prev.overs);
      const nextScore = prev.score + event.runs;

      const crowdLift = event.crowd_surge;
      const nextCapacity = {
        north: clamp(prev.capacity.north + crowdLift, 40, 98),
        south: clamp(prev.capacity.south + crowdLift, 40, 98),
        east: clamp(prev.capacity.east + crowdLift, 40, 98),
        west: clamp(prev.capacity.west + crowdLift, 40, 98),
      };

      const inningsEnd = nextWickets >= 10 || nextOvers >= 20;
      const eventType = event.type.startsWith("RUN_") ? "RUN" : event.type;

      setLastEvent(eventType);
      spikeAndDecayNoise(event.noise_spike);

      if (inningsEnd) {
        clearTimeout(inningsResetRef.current);
        inningsResetRef.current = setTimeout(() => {
          resetMatch();
        }, 10000);
      }

      return {
        ...prev,
        score: nextScore,
        wickets: nextWickets,
        overs: nextOvers,
        capacity: nextCapacity,
        phase: inningsEnd ? "innings_end" : "in_play",
        last_event: eventType,
      };
    });
  };

  useEffect(() => {
    eventIntervalRef.current = setInterval(tickBall, 4000);
    driftIntervalRef.current = setInterval(() => {
      setMatchState((prev) => ({
        ...prev,
        capacity: {
          north: clamp(prev.capacity.north + Math.floor(Math.random() * 5) - 2, 40, 98),
          south: clamp(prev.capacity.south + Math.floor(Math.random() * 5) - 2, 40, 98),
          east: clamp(prev.capacity.east + Math.floor(Math.random() * 5) - 2, 40, 98),
          west: clamp(prev.capacity.west + Math.floor(Math.random() * 5) - 2, 40, 98),
        },
      }));
    }, 30000);

    return () => {
      clearInterval(eventIntervalRef.current);
      clearInterval(driftIntervalRef.current);
      clearTimeout(noiseDecayRef.current);
      clearTimeout(inningsResetRef.current);
    };
  }, []);

  const triggerScenario = (type) => {
    if (type === "FULL_HOUSE") {
      setMatchState((prev) => ({
        ...prev,
        capacity: {
          north: 95 + Math.floor(Math.random() * 5),
          south: 95 + Math.floor(Math.random() * 5),
          east: 95 + Math.floor(Math.random() * 5),
          west: 95 + Math.floor(Math.random() * 5),
        },
      }));
      return;
    }

    if (type === "WICKET_STORM") {
      setMatchState((prev) => ({
        ...prev,
        wickets: clamp(prev.wickets + 3, 0, 10),
        noise_db: clamp(prev.noise_db + 15, 65, 105),
        last_event: "WICKET",
      }));
      setLastEvent("WICKET");
      return;
    }

    if (type === "RAIN_DELAY") {
      setMatchState((prev) => ({
        ...prev,
        phase: "drinks_break",
        noise_db: 68,
        capacity: {
          north: clamp(prev.capacity.north - 20, 40, 98),
          south: clamp(prev.capacity.south - 20, 40, 98),
          east: clamp(prev.capacity.east - 20, 40, 98),
          west: clamp(prev.capacity.west - 20, 40, 98),
        },
      }));
      return;
    }

    if (type === "MATCH_OVER") {
      setMatchState((prev) => ({
        ...prev,
        phase: "match_over",
        noise_db: 102,
        last_event: "SIX",
      }));
      setLastEvent("SIX");
      clearTimeout(inningsResetRef.current);
      inningsResetRef.current = setTimeout(() => {
        resetMatch();
      }, 4000);
    }
  };

  return useMemo(
    () => ({ matchState, lastEvent, triggerScenario }),
    [matchState, lastEvent],
  );
}

export function MatchSimulationProvider({ children }) {
  const value = useMatchSimulationEngine();
  return (
    <MatchSimulationContext.Provider value={value}>
      {children}
    </MatchSimulationContext.Provider>
  );
}

export function useMatchSimulation() {
  const context = useContext(MatchSimulationContext);
  if (!context) {
    throw new Error("useMatchSimulation must be used within MatchSimulationProvider");
  }
  return context;
}

