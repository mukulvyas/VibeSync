import { useMemo, useRef, useState } from "react";

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

const HEATMAP_COLORS = {
  NORTH: "rgba(239, 68, 68, 0.5)",
  EAST: "rgba(245, 158, 11, 0.35)",
  WEST: "rgba(245, 158, 11, 0.4)",
  SOUTH: "rgba(59, 130, 246, 0.3)",
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
}) {
  const containerRef = useRef(null);
  const [hoveredStand, setHoveredStand] = useState("");
  const [tooltip, setTooltip] = useState(null);

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

  return (
    <div
      ref={containerRef}
      className="tactical-panel glass-tactical relative map-blueprint-bg min-h-[600px] flex items-center justify-center group overflow-hidden rounded-xl"
    >
      <div className="scanner-effect opacity-50" />

      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full max-w-[850px] drop-shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-transform duration-700"
      >
        <defs>
          <radialGradient id="fieldGradient" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#2b6a43" />
            <stop offset="100%" stopColor="#1a4a2e" />
          </radialGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {Object.entries(HEATMAP_COLORS).map(([stand, color]) => (
            <radialGradient id={`heat-${stand}`} key={stand}>
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          ))}

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
        <path d="M 250 220 A 280 220 0 0 1 750 220 L 700 300 A 210 150 0 0 0 300 300 Z" fill="rgba(30,41,59,0.9)" stroke="rgba(255,255,255,0.07)" />
        <path d="M 250 780 A 280 220 0 0 0 750 780 L 700 700 A 210 150 0 0 1 300 700 Z" fill="rgba(30,41,59,0.9)" stroke="rgba(255,255,255,0.07)" />
        <path d="M 210 300 A 240 200 0 0 0 210 700 L 300 660 A 170 130 0 0 1 300 340 Z" fill="rgba(30,41,59,0.9)" stroke="rgba(255,255,255,0.07)" />
        <path d="M 790 300 A 240 200 0 0 1 790 700 L 700 660 A 170 130 0 0 0 700 340 Z" fill="rgba(30,41,59,0.9)" stroke="rgba(255,255,255,0.07)" />

        {/* Stand interactive hit regions */}
        <g
          className="cursor-pointer transition-all duration-300"
          onMouseEnter={(e) => showStandTooltip("NORTH", e)}
          onMouseMove={(e) => showStandTooltip("NORTH", e)}
          onMouseLeave={() => {
            setHoveredStand("");
            setTooltip(null);
          }}
          onClick={() => onCellClick?.("NORTH")}
          style={{ opacity: hoveredStand && hoveredStand !== "NORTH" ? 0.85 : 1 }}
        >
          <path d="M 250 220 A 280 220 0 0 1 750 220 L 700 300 A 210 150 0 0 0 300 300 Z" fill="rgba(59,130,246,0.06)" />
          <Label x={500} y={248} text={STAND_META.NORTH.label} />
        </g>
        <g
          className="cursor-pointer transition-all duration-300"
          onMouseEnter={(e) => showStandTooltip("SOUTH", e)}
          onMouseMove={(e) => showStandTooltip("SOUTH", e)}
          onMouseLeave={() => {
            setHoveredStand("");
            setTooltip(null);
          }}
          onClick={() => onCellClick?.("SOUTH")}
          style={{ opacity: hoveredStand && hoveredStand !== "SOUTH" ? 0.85 : 1 }}
        >
          <path d="M 250 780 A 280 220 0 0 0 750 780 L 700 700 A 210 150 0 0 1 300 700 Z" fill="rgba(59,130,246,0.06)" />
          <Label x={500} y={754} text={STAND_META.SOUTH.label} />
        </g>
        <g
          className="cursor-pointer transition-all duration-300"
          onMouseEnter={(e) => showStandTooltip("WEST", e)}
          onMouseMove={(e) => showStandTooltip("WEST", e)}
          onMouseLeave={() => {
            setHoveredStand("");
            setTooltip(null);
          }}
          onClick={() => onCellClick?.("WEST")}
          style={{ opacity: hoveredStand && hoveredStand !== "WEST" ? 0.85 : 1 }}
        >
          <path d="M 210 300 A 240 200 0 0 0 210 700 L 300 660 A 170 130 0 0 1 300 340 Z" fill="rgba(59,130,246,0.06)" />
          <Label x={252} y={500} text={STAND_META.WEST.label} rotate={-90} />
        </g>
        <g
          className="cursor-pointer transition-all duration-300"
          onMouseEnter={(e) => showStandTooltip("EAST", e)}
          onMouseMove={(e) => showStandTooltip("EAST", e)}
          onMouseLeave={() => {
            setHoveredStand("");
            setTooltip(null);
          }}
          onClick={() => onCellClick?.("EAST")}
          style={{ opacity: hoveredStand && hoveredStand !== "EAST" ? 0.85 : 1 }}
        >
          <path d="M 790 300 A 240 200 0 0 1 790 700 L 700 660 A 170 130 0 0 0 700 340 Z" fill="rgba(59,130,246,0.06)" />
          <Label x={748} y={500} text={STAND_META.EAST.label} rotate={90} />
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

        {/* ── YOU Marker ── */}
        {attendeeMode && (
          <g transform={`translate(${youMarker.x}, ${youMarker.y})`}>
            {/* Outer Pulse */}
            <circle
              r="18"
              fill="rgba(59,130,246,0.25)"
              className="animate-ping"
            />
            {/* Inner Glowing Dot */}
            <circle
              r="8"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
              className="blue-dot-pulse shadow-2xl"
            />
            
            {/* Floating Handle Label */}
            <g transform="translate(0, -35)">
               <rect x="-40" y="-12" width="80" height="24" rx="12" fill="white" className="shadow-2xl" />
               <text textAnchor="middle" y="5" fill="#111827" fontSize="10" fontWeight="800">YOU</text>
            </g>
          </g>
        )}
      </svg>

      {/* Map Legend */}
      <div className={`absolute bottom-6 right-6 p-6 rounded-[24px] space-y-4 min-w-[220px] shadow-2xl border border-white/5 ${attendeeMode ? 'bg-[#1F2937]/95' : 'glass-tactical'}`}>
        <h4 className={`text-[10px] font-black tracking-widest uppercase mb-1 ${attendeeMode ? 'text-[#F59E0B]' : 'text-cyan-tactical'}`}>
          {attendeeMode ? 'Live Crowd Flow' : 'SYSTEM_LEGEND'}
        </h4>
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${attendeeMode ? 'bg-blue-500' : 'bg-cyan-tactical'}`} />
          <span className="text-white/80 text-[11px] font-bold">{attendeeMode ? 'Empty Seats' : 'Asset Nominal'}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
          <span className="text-white/80 text-[11px] font-bold">{attendeeMode ? 'Starting to Fill' : 'Flow Congestion'}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <span className="text-white/80 text-[11px] font-bold">{attendeeMode ? 'At Peak Capacity' : 'Critical Flow'}</span>
        </div>
      </div>

      {/* Tooltip Card */}
      {tooltip && (
        <div
          className={`absolute z-50 p-5 rounded-2xl shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-[110%] animate-in fade-in zoom-in duration-200 border border-white/10 ${attendeeMode ? 'bg-[#1F2937] text-white' : 'glass-tactical'}`}
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <div className={`font-bold mb-2 pb-1 border-b border-white/10 ${attendeeMode ? 'text-sm' : 'text-xs uppercase tracking-widest text-white'}`}>
            {tooltip.name} · {tooltip.capacity}% capacity · Gate: {tooltip.gate}
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
