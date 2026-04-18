import { useMemo, useEffect, useState } from "react";

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

const SECTIONS = [
  {
    id: "NORTH",
    label: "NORTH_STAND",
    color: "rgba(0, 210, 255, 0.1)",
    rowCount: 6,
  },
  {
    id: "SOUTH",
    label: "SOUTH_TERRACE",
    color: "rgba(0, 210, 255, 0.1)",
    rowCount: 6,
  },
  {
    id: "WEST",
    label: "WEST_AXIS",
    color: "rgba(0, 210, 255, 0.1)",
    rowCount: 8,
  },
  {
    id: "EAST",
    label: "EAST_AXIS",
    color: "rgba(0, 210, 255, 0.1)",
    rowCount: 8,
  },
];

export default function VibeMap({
  venueData,
  path,
  sosAlerts = [],
  onCellClick,
  attendeeMode = true,
  userPos,
  incentives = [],
  showHeatmap = true,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredStand, setHoveredStand] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // Compute section stats
  const sectionStats = useMemo(() => {
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
      const wait = Math.max(0, Math.round(capacity / 10 - 1)); // rough estimate
      stats[stand] = { capacity, wait };
    });
    return stats;
  }, [venueData]);

  // Generate 3D Bowl Data & Heatmap Points
  const { standColors, attendeeDots, heatmapPoints } = useMemo(() => {
    const s = {
      NORTH: "#1e293b",
      SOUTH: "#1e293b",
      EAST: "#1e293b",
      WEST: "#1e293b",
    };
    const dots = [];
    const hPoints = [];
    if (!venueData)
      return { standColors: s, attendeeDots: [], heatmapPoints: [] };

    venueData.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (cell.cell_type !== "seat") return;

        let stand = "";
        if (ri <= 2) stand = "NORTH";
        else if (ri >= 7) stand = "SOUTH";
        else if (ci <= 2) stand = "WEST";
        else if (ci >= 7) stand = "EAST";

        if (stand) {
          // Warm Attendee Gradients
          if (attendeeMode) {
            if (cell.density > 0.6) s[stand] = "rgba(245, 158, 11, 0.4)";
            if (cell.density > 0.85) s[stand] = "rgba(239, 68, 68, 0.4)";
          } else {
            if (cell.density > 0.85) s[stand] = "rgba(255, 71, 87, 0.2)";
            else if (cell.density > 0.6) s[stand] = "rgba(255, 165, 2, 0.15)";
          }

          // Create base for heatmap bloom
          if (cell.density > 0.2) {
            hPoints.push({
              id: `heat-${ri}-${ci}`,
              cx: ci * 100 + 50,
              cy: ri * 100 + 50,
              radius: 40 + cell.density * 60,
              opacity: 0.1 + cell.density * 0.4,
              color:
                cell.density > 0.8
                  ? attendeeMode ? "#ef4444" : "var(--red-tactical)"
                  : cell.density > 0.5
                    ? attendeeMode ? "#f59e0b" : "var(--amber-tactical)"
                    : attendeeMode ? "#3b82f6" : "var(--cyan-tactical)",
            });
          }

          const count = Math.floor(cell.density * 8);
          for (let i = 0; i < count; i++) {
            dots.push({
              id: `fan-${ri}-${ci}-${i}`,
              cx: ci * 100 + 50 + (Math.random() * 40 - 20),
              cy: ri * 100 + 50 + (Math.random() * 40 - 20),
              r: 1.2 + Math.random() * 1.5,
              opacity: 0.5 + cell.density * 0.5,
              dur: 1.5 + Math.random() * 1.5,
            });
          }
        }
      });
    });
    return { standColors: s, attendeeDots: dots, heatmapPoints: hPoints };
  }, [venueData, attendeeMode]);

  const pathPoints = useMemo(() => {
    if (!path) return "";
    return path.map((p) => `${p.col * 100 + 50},${p.row * 100 + 50}`).join(" ");
  }, [path]);

  // Map "YOU" marker to grid coordinates
  const pixelPos = useMemo(() => {
    if (!userPos) return { x: 500, y: 700 };
    return { x: userPos.col * 100 + 50, y: userPos.row * 100 + 50 };
  }, [userPos]);

  return (
    <div className="tactical-panel glass-tactical relative map-blueprint-bg min-h-[600px] flex items-center justify-center group overflow-hidden rounded-xl">
      <div className="scanner-effect opacity-50" />

      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full max-w-[850px] drop-shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-transform duration-700"
      >
        <defs>
          <radialGradient
            id="bowlInnerGlow"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="rgba(0, 210, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(0, 210, 255, 0)" />
          </radialGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {heatmapPoints.map((hp) => (
            <radialGradient id={`grad-${hp.id}`} key={hp.id}>
              <stop offset="0%" stopColor={hp.color} stopOpacity={hp.opacity} />
              <stop offset="100%" stopColor={hp.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* Stadium Floor Reflection */}
        <circle
          cx="500"
          cy="500"
          r="450"
          fill="url(#bowlInnerGlow)"
          opacity="0.5"
        />

        {/* ── HEATMAP BLOOMS ── */}
        {showHeatmap && (
          <g className="heatmap-layer mix-blend-screen" opacity="0.6">
            {heatmapPoints.map((hp) => (
              <circle
                key={hp.id}
                cx={hp.cx}
                cy={hp.cy}
                r={hp.radius}
                fill={`url(#grad-${hp.id})`}
                className="animate-pulse"
              />
            ))}
          </g>
        )}

        {/* ── 3D BOWL GEOMETRY ── */}

        {/* North Stand */}
        <g
          onClick={() => onCellClick?.("NORTH")}
          onMouseEnter={(e) => {
            setHoveredStand("NORTH");
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({
              stand: "NORTH",
              label: "SEC-NORTH [COMMAND]",
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
              ...sectionStats.NORTH,
            });
          }}
          onMouseLeave={() => {
            setHoveredStand(null);
            setTooltip(null);
          }}
          className="cursor-pointer transition-all duration-300"
          style={{
            transform:
              hoveredStand === "NORTH"
                ? "translateY(-5px) scale(1.01)"
                : "none",
            transformOrigin: "center 130px",
          }}
        >
          <path
            d="M 250,150 L 750,150 L 720,100 L 280,100 Z"
            fill="rgba(30, 41, 59, 0.9)"
            stroke="rgba(0,210,255,0.3)"
          />
          <path
            d="M 300,250 L 700,250 L 750,150 L 250,150 Z"
            fill={standColors.NORTH}
            className="transition-colors duration-1000"
          />
          {[190, 210, 230].map((h) => (
            <line
              key={h}
              x1={300 + (h - 150) / 2}
              y1={h}
              x2={700 - (h - 150) / 2}
              y2={h}
              stroke="rgba(0,210,255,0.15)"
              strokeWidth="0.5"
            />
          ))}
          <Label x={500} y={130} text="SEC-NORTH [COMMAND]" />
        </g>

        {/* South Stand */}
        <g
          onClick={() => onCellClick?.("SOUTH")}
          onMouseEnter={(e) => {
            setHoveredStand("SOUTH");
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({
              stand: "SOUTH",
              label: "SEC-SOUTH [FANS]",
              x: rect.left + rect.width / 2,
              y: rect.bottom + 10,
              ...sectionStats.SOUTH,
            });
          }}
          onMouseLeave={() => {
            setHoveredStand(null);
            setTooltip(null);
          }}
          className="cursor-pointer transition-all duration-300"
          style={{
            transform:
              hoveredStand === "SOUTH" ? "translateY(5px) scale(1.01)" : "none",
            transformOrigin: "center 875px",
          }}
        >
          <path
            d="M 250,850 L 750,850 L 720,900 L 280,900 Z"
            fill="rgba(30, 41, 59, 0.9)"
            stroke="rgba(0,210,255,0.3)"
          />
          <path
            d="M 300,750 L 700,750 L 750,850 L 250,850 Z"
            fill={standColors.SOUTH}
            className="transition-colors duration-1000"
          />
          {[770, 790, 810, 830].map((h) => (
            <line
              key={h}
              x1={300 - (850 - h) / 2}
              y1={h}
              x2={700 + (850 - h) / 2}
              y2={h}
              stroke="rgba(0,210,255,0.15)"
              strokeWidth="0.5"
            />
          ))}
          <Label x={500} y={875} text="SEC-SOUTH [FANS]" />
        </g>

        {/* West Stand */}
        <g
          onClick={() => onCellClick?.("WEST")}
          onMouseEnter={(e) => {
            setHoveredStand("WEST");
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({
              stand: "WEST",
              label: "WEST_AXIS",
              x: rect.left - 10,
              y: rect.top + rect.height / 2,
              ...sectionStats.WEST,
            });
          }}
          onMouseLeave={() => {
            setHoveredStand(null);
            setTooltip(null);
          }}
          className="cursor-pointer transition-all duration-300"
          style={{
            transform:
              hoveredStand === "WEST" ? "translateX(-5px) scale(1.01)" : "none",
            transformOrigin: "80px center",
          }}
        >
          <path
            d="M 100,250 L 100,750 L 50,720 L 50,280 Z"
            fill="rgba(30, 41, 59, 0.9)"
            stroke="rgba(0,210,255,0.3)"
          />
          <path
            d="M 250,300 L 250,700 L 100,750 L 100,250 Z"
            fill={standColors.WEST}
            className="transition-colors duration-1000"
          />
          {[140, 180, 220].map((w) => (
            <line
              key={w}
              x1={w}
              y1={300 - (250 - w) / 2}
              x2={w}
              y2={700 + (250 - w) / 2}
              stroke="rgba(0,210,255,0.15)"
              strokeWidth="0.5"
            />
          ))}
          <Label x={80} y={500} text="WEST_AXIS" rotate={-90} />
        </g>

        {/* East Stand */}
        <g
          onClick={() => onCellClick?.("EAST")}
          onMouseEnter={(e) => {
            setHoveredStand("EAST");
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({
              stand: "EAST",
              label: "EAST_VIP",
              x: rect.right + 10,
              y: rect.top + rect.height / 2,
              ...sectionStats.EAST,
            });
          }}
          onMouseLeave={() => {
            setHoveredStand(null);
            setTooltip(null);
          }}
          className="cursor-pointer transition-all duration-300"
          style={{
            transform:
              hoveredStand === "EAST" ? "translateX(5px) scale(1.01)" : "none",
            transformOrigin: "920px center",
          }}
        >
          <path
            d="M 900,250 L 900,750 L 950,720 L 950,280 Z"
            fill="rgba(30, 41, 59, 0.9)"
            stroke="rgba(0,210,255,0.3)"
          />
          <path
            d="M 750,300 L 750,700 L 900,750 L 900,250 Z"
            fill={standColors.EAST}
            className="transition-colors duration-1000"
          />
          {[780, 820, 860].map((w) => (
            <line
              key={w}
              x1={w}
              y1={300 + (w - 750) / 2}
              x2={w}
              y2={700 - (w - 750) / 2}
              stroke="rgba(0,210,255,0.15)"
              strokeWidth="0.5"
            />
          ))}
          <Label x={920} y={500} text="EAST_VIP" rotate={90} />
        </g>

        {/* ── PITCH (The Centerpiece) ── */}
        <g transform="translate(350, 350)" pointerEvents="none">
          {/* Deep Teal Pitch */}
          <rect
            width="300"
            height="300"
            fill="#0D3B2E"
            stroke="rgba(0, 210, 255, 0.2)"
            strokeWidth="1"
            rx="4"
          />
          
          {/* Subtle Yard Line Markings */}
          {[...Array(11)].map((_, i) => (
            <line
              key={i}
              x1={i * 30}
              y1="0"
              x2={i * 30}
              y2="300"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="0.5"
            />
          ))}

          {/* Center Circle & Line */}
          <circle
            cx="150"
            cy="150"
            r="40"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray="5 5"
          />
          <line
            x1="0"
            y1="150"
            x2="300"
            y2="150"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray="5 5"
          />
        </g>

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
          <g transform={`translate(${pixelPos.x}, ${pixelPos.y})`}>
            {/* Outer Pulse */}
            <circle
              r="24"
              fill="rgba(0, 122, 255, 0.2)"
              className="animate-ping"
            />
            {/* Inner Glowing Dot */}
            <circle
              r="10"
              fill="#007aff"
              stroke="white"
              strokeWidth="3"
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
          <div className={`font-bold mb-2 pb-1 border-b border-white/10 ${attendeeMode ? 'text-lg' : 'text-xs uppercase tracking-widest text-white'}`}>
            {attendeeMode ? tooltip.label.replace('_', ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : tooltip.label.replace('_', ' ')}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${attendeeMode && tooltip.capacity > 85 ? 'text-red-400' : attendeeMode ? 'text-[#F59E0B]' : 'text-cyan-tactical'}`}>
              {tooltip.capacity}%
            </span>
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">{attendeeMode ? 'Full' : 'Cap'}</span>
          </div>
          <div className="text-[10px] text-text-dim mt-2 font-medium">
             Est. wait: <span className="text-white font-bold">{Math.round(tooltip.capacity / 10)} min</span>
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
