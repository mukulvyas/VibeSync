import { useEffect, useMemo, useRef, useState } from "react";

/**
 * VibeMap — High-Fidelity Tactical 3D Digital Twin
 *
 * FEATURES:
 * - Isometric 3D Bowl Geometry with vertical walls/shading
 * - Architectural Row Textures
 * - High-Legibility Backed Labels (Inter font)
 * - Agent Decision Overlays (Gift/Arrow pulsing)
 * - Neon Energy Ribbon Pathfinding
 */

const STAND_META = {
  NORTH: { name: "North Stand", gate: "N1", label: "NORTH STAND" },
  EAST: { name: "East VIP", gate: "E2", label: "EAST VIP" },
  WEST: { name: "West Stand", gate: "W1", label: "WEST STAND" },
  SOUTH: { name: "South Fans", gate: "S2", label: "SOUTH FANS" },
};

const STAND_PATHS = {
  NORTH: "M 250 220 A 280 220 0 0 1 750 220 L 700 300 A 210 150 0 0 0 300 300 Z",
  SOUTH: "M 250 780 A 280 220 0 0 0 750 780 L 700 700 A 210 150 0 0 1 300 700 Z",
  WEST: "M 210 300 A 240 200 0 0 0 210 700 L 300 660 A 170 130 0 0 1 300 340 Z",
  EAST: "M 790 300 A 240 200 0 0 1 790 700 L 700 660 A 170 130 0 0 0 700 340 Z",
};

const getHeatColor = (pct) => {
  if (pct >= 90) return "rgba(239, 68, 68, 0.65)";
  if (pct >= 75) return "rgba(245, 158, 11, 0.55)";
  if (pct >= 55) return "rgba(234, 179, 8, 0.4)";
  return "rgba(59, 130, 246, 0.3)";
};

export default function VibeMap({
  venueData,
  standCapacities,
  path,
  sosAlerts = [],
  onCellClick,
  attendeeMode = true,
  userPos,
  incentives = [],
  showHeatmap = true,
  lastEvent = null,
  /**
   * "fill": map fills parent height (object-fit: contain)
   * "auto": map has min height
   */
  containerHeight = "auto",
}) {
  const containerRef = useRef(null);
  const [hoveredStand, setHoveredStand] = useState("");
  const [tooltip, setTooltip] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimeoutRef = useRef(null);

  const sectionStats = useMemo(() => {
    if (standCapacities) {
      return {
        NORTH: { capacity: standCapacities.NORTH ?? 0 },
        SOUTH: { capacity: standCapacities.SOUTH ?? 0 },
        EAST: { capacity: standCapacities.EAST ?? 0 },
        WEST: { capacity: standCapacities.WEST ?? 0 },
      };
    }
    if (!venueData) return {};
    const stats = {};
    venueData.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (cell.cell_type !== "seat") return;
        let stand = "";
        if (ri <= 2) stand = "NORTH";
        else if (ri >= 7) stand = "SOUTH";
        else if (ci <= 2) stand = "WEST";
        else if (ci >= 7) stand = "EAST";
        if (stand) {
          if (!stats[stand]) stats[stand] = { total: 0, occupied: 0 };
          stats[stand].total++;
          if (cell.density > 0.1) stats[stand].occupied++;
        }
      });
    });
    Object.keys(stats).forEach((stand) => {
      const { total, occupied } = stats[stand];
      const capacity = Math.round((occupied / total) * 100);
      stats[stand] = { capacity };
    });
    return stats;
  }, [venueData, standCapacities]);

  const attendeeDots = useMemo(() => {
    const dots = [];
    if (!venueData) return dots;

    venueData.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (cell.cell_type !== "seat") return;

        const count = Math.floor(cell.density * 6);
        for (let i = 0; i < count; i++) {
          dots.push({
            id: `fan-${ri}-${ci}-${i}`,
            cx: ci * 100 + 50 + (Math.random() * 30 - 15),
            cy: ri * 100 + 50 + (Math.random() * 30 - 15),
            r: 1 + Math.random() * 1.2,
          });
        }
      });
    });
    return dots;
  }, [venueData]);

  const pathPoints = useMemo(() => {
    if (!path) return "";
    return path.map((p) => `${p.col * 100 + 50},${p.row * 100 + 50}`).join(" ");
  }, [path]);

  const youMarker = useMemo(() => ({ x: 500, y: 760 }), []);

  useEffect(() => {
    if (lastEvent !== "SIX" && lastEvent !== "WICKET") return;
    setIsFlashing(true);
    clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => {
      setIsFlashing(false);
    }, 600);
  }, [lastEvent]);

  useEffect(() => {
    return () => {
      clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const getWaitTime = (capacity) => {
    const cap = capacity || 0;
    if (cap >= 90) return "10-14 min";
    if (cap >= 75) return "6-9 min";
    if (cap >= 55) return "3-5 min";
    return "1-2 min";
  };

  const showStandTooltip = (stand, event) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const stat = sectionStats[stand] || { capacity: 0 };
    const meta = STAND_META[stand];
    setHoveredStand(stand);
    setTooltip({
      stand,
      name: meta.name,
      gate: meta.gate,
      capacity: stat.capacity,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top - 12,
    });
  };

  const sizeClass = containerHeight === "fill"
    ? "min-h-0 h-full w-full flex-1 flex flex-col overflow-hidden rounded-xl group aspect-auto"
    : "min-h-[600px] flex items-center justify-center group overflow-hidden rounded-xl";

  const svgClass = containerHeight === "fill"
    ? "flex-1 min-h-0 w-full h-full max-w-none min-w-0 transition-transform duration-700 pointer-events-auto"
    : "w-full h-full max-w-[850px] transition-transform duration-700 pointer-events-auto";

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Stadium seating map with live crowd density by stand"
      className={`tactical-panel glass-tactical relative map-blueprint-bg ${sizeClass}`}
    >
      <div className={`scanner-effect opacity-50 ${containerHeight === "fill" ? "pointer-events-none absolute inset-0 rounded-xl" : ""}`} />

      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid meet"
        className={`${svgClass} ${isFlashing ? "stadium-flash" : ""}`}
      >
        <title>Stadium Heatmap View</title>
        <desc>Dynamic map showing crowd density across North, South, East, and West stands at Wankhede Stadium.</desc>
        <defs>
          <radialGradient id="fieldGradient" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#2b6a43" />
            <stop offset="100%" stopColor="#1a4a2e" />
          </radialGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {Object.entries(STAND_PATHS).map(([stand]) => {
            const capacity = sectionStats[stand]?.capacity ?? 0;
            const color = getHeatColor(capacity);
            return (
            <radialGradient id={`heat-${stand}`} key={stand}>
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
            );
          })}

          <linearGradient id="pitchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a36e" />
            <stop offset="100%" stopColor="#a98254" />
          </linearGradient>
        </defs>

        {/* Cricket field */}
        <ellipse
          cx="500"
          cy="500"
          rx="265"
          ry="205"
          fill="url(#fieldGradient)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
        />
        <ellipse
          cx="500"
          cy="500"
          rx="155"
          ry="120"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeDasharray="7 7"
          strokeWidth="2"
        />
        <rect
          x="490"
          y="430"
          width="20"
          height="140"
          rx="3"
          fill="url(#pitchGradient)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.5"
        />

        {/* Curved stand shells */}
        <path d={STAND_PATHS.NORTH} fill="rgba(30,41,59,0.9)" stroke="rgba(255,255,255,0.07)" />
        <path d={STAND_PATHS.SOUTH} fill="rgba(30,41,59,0.9)" stroke="rgba(255,255,255,0.07)" />
        <path d={STAND_PATHS.WEST} fill="rgba(30,41,59,0.9)" stroke="rgba(255,255,255,0.07)" />
        <path d={STAND_PATHS.EAST} fill="rgba(30,41,59,0.9)" stroke="rgba(255,255,255,0.07)" />

        {/* Stand interactive hit regions */}
        <g
          className="cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-tactical"
          role="button"
          tabIndex={0}
          aria-label={`North Stand: ${sectionStats.NORTH?.capacity ?? 0}% capacity`}
          onMouseEnter={(e) => showStandTooltip("NORTH", e)}
          onMouseMove={(e) => showStandTooltip("NORTH", e)}
          onMouseLeave={() => {
            setHoveredStand("");
            setTooltip(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCellClick?.("NORTH");
            }
          }}
          onClick={() => onCellClick?.("NORTH")}
          style={{ opacity: hoveredStand && hoveredStand !== "NORTH" ? 0.85 : 1 }}
        >
          <path
            d={STAND_PATHS.NORTH}
            fill={showHeatmap ? getHeatColor(sectionStats.NORTH?.capacity ?? 0) : "rgba(59,130,246,0.06)"}
            style={{ transition: "fill 1s ease" }}
          />
          <Label x={500} y={248} text={STAND_META.NORTH.label} />
        </g>
        <g
          className="cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-tactical"
          role="button"
          tabIndex={0}
          aria-label={`South Stand: ${sectionStats.SOUTH?.capacity ?? 0}% capacity`}
          onMouseEnter={(e) => showStandTooltip("SOUTH", e)}
          onMouseMove={(e) => showStandTooltip("SOUTH", e)}
          onMouseLeave={() => {
            setHoveredStand("");
            setTooltip(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCellClick?.("SOUTH");
            }
          }}
          onClick={() => onCellClick?.("SOUTH")}
          style={{ opacity: hoveredStand && hoveredStand !== "SOUTH" ? 0.85 : 1 }}
        >
          <path
            d={STAND_PATHS.SOUTH}
            fill={showHeatmap ? getHeatColor(sectionStats.SOUTH?.capacity ?? 0) : "rgba(59,130,246,0.06)"}
            style={{ transition: "fill 1s ease" }}
          />
          <Label x={500} y={754} text={STAND_META.SOUTH.label} />
        </g>
        <g
          className="cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-tactical"
          role="button"
          tabIndex={0}
          aria-label={`West Stand: ${sectionStats.WEST?.capacity ?? 0}% capacity`}
          onMouseEnter={(e) => showStandTooltip("WEST", e)}
          onMouseMove={(e) => showStandTooltip("WEST", e)}
          onMouseLeave={() => {
            setHoveredStand("");
            setTooltip(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCellClick?.("WEST");
            }
          }}
          onClick={() => onCellClick?.("WEST")}
          style={{ opacity: hoveredStand && hoveredStand !== "WEST" ? 0.85 : 1 }}
        >
          <path
            d={STAND_PATHS.WEST}
            fill={showHeatmap ? getHeatColor(sectionStats.WEST?.capacity ?? 0) : "rgba(59,130,246,0.06)"}
            style={{ transition: "fill 1s ease" }}
          />
          <Label x={310} y={500} text={STAND_META.WEST.label} rotate={-90} />
        </g>
        <g
          className="cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-tactical"
          role="button"
          tabIndex={0}
          aria-label={`East Stand: ${sectionStats.EAST?.capacity ?? 0}% capacity`}
          onMouseEnter={(e) => showStandTooltip("EAST", e)}
          onMouseMove={(e) => showStandTooltip("EAST", e)}
          onMouseLeave={() => {
            setHoveredStand("");
            setTooltip(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCellClick?.("EAST");
            }
          }}
          onClick={() => onCellClick?.("EAST")}
          style={{ opacity: hoveredStand && hoveredStand !== "EAST" ? 0.85 : 1 }}
        >
          <path
            d={STAND_PATHS.EAST}
            fill={showHeatmap ? getHeatColor(sectionStats.EAST?.capacity ?? 0) : "rgba(59,130,246,0.06)"}
            style={{ transition: "fill 1s ease" }}
          />
          <Label x={690} y={500} text={STAND_META.EAST.label} rotate={90} />
        </g>

        {/* Heatmap blobs by stand */}
        {showHeatmap && (
          <g className="heatmap-layer mix-blend-screen" opacity={attendeeMode ? 0.85 : 0.92}>
            <ellipse cx="500" cy="260" rx="230" ry="90" fill="url(#heat-NORTH)" />
            <ellipse cx="770" cy="500" rx="85" ry="170" fill="url(#heat-EAST)" />
            <ellipse cx="230" cy="500" rx="95" ry="170" fill="url(#heat-WEST)" />
            {attendeeMode ? (
              <ellipse cx="500" cy="740" rx="240" ry="85" fill="url(#heat-SOUTH)" />
            ) : (
              <ellipse cx="500" cy="740" rx="240" ry="85" fill="rgba(245, 158, 11, 0.26)" />
            )}
          </g>
        )}

        {/* ── ATTENDEES (STATIC MARKERS) ── */}
        {!showHeatmap && (
          <g className="crowd-layer" pointerEvents="none">
            {attendeeDots.map((dot) => (
              <circle
                key={dot.id}
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r}
                fill={
                  attendeeMode
                    ? "var(--cyan-tactical)"
                    : "var(--amber-tactical)"
                }
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
                opacity="0.8"
              />
            ))}
          </g>
        )}

        {/* ── Path Ribbon (Energy Flow) ── ON TOP */}
        {pathPoints && (
          <polyline
            points={pathPoints}
            fill="none"
            stroke="var(--cyan-tactical)"
            strokeWidth="24"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="energy-ribbon opacity-40 shadow-2xl"
            filter="url(#glow)"
          />
        )}
        {pathPoints && (
          <polyline
            points={pathPoints}
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.9"
          />
        )}

      </svg>

      {/* Map Legend (Hidden in attendeeMode as it is handled by the Shell) */}
      {!attendeeMode && (
        <div className={`absolute top-4 right-4 p-3 rounded-[16px] space-y-2 min-w-[140px] shadow-2xl border border-white/5 glass-tactical scale-90 origin-top-right z-50`}>
          <h4 className={`text-[8px] font-black tracking-widest uppercase mb-1 text-cyan-tactical`}>
            SYSTEM_LEGEND
          </h4>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-tactical" />
            <span className="text-white/80 text-[9px] font-bold">Asset Nominal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span className="text-white/80 text-[9px] font-bold">Flow Congestion</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-white/80 text-[9px] font-bold">Critical Flow</span>
          </div>
        </div>
      )}

      {/* Tooltip Card */}
      {tooltip && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: tooltip.stand === "EAST" ? tooltip.x - 140 : tooltip.x + 12,
            top: tooltip.y + 12,
            position: "absolute",
            background: "rgba(6,11,20,0.95)",
            border: "1px solid rgba(99,179,237,0.3)",
            borderRadius: 8,
            padding: "8px 12px",
            zIndex: 999,
          }}
        >
          <div style={{ fontWeight: 700 }}>{tooltip.name}</div>
          <div style={{ color: "#F59E0B" }}>{tooltip.capacity}% capacity</div>
          <div style={{ color: "#8BA3C4" }}>Gate: {tooltip.gate}</div>
          <div style={{ color: "#8BA3C4" }}>
            Est. wait: {getWaitTime(tooltip.capacity)}
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ x, y, text, rotate = 0 }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate})`}>
      <rect
        x="-60"
        y="-10"
        width="120"
        height="20"
        rx="2"
        fill="rgba(0,0,0,0.6)"
        className="label-backed"
      />
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        dy="1"
        fill="white"
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.1em"
      >
        {text}
      </text>
    </g>
  );
}
