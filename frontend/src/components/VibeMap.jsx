import { useMemo, useEffect, useState } from 'react';

/**
 * VibeMap v3 — Real Stadium Geometry
 * 
 * Layout: Central pitch surrounded by 4 curved stands (North, South, East, West)
 * with gate icons at corners and cells as small glowing circles.
 */

// ── Stadium Position Mapping ──────────────────────
// Maps each (row, col) in the 10×10 grid to a physical (x, y) stadium coordinate.
// North Stand: rows 0-2 (top curve)
// South Stand: rows 7-9 (bottom curve)
// West Stand:  rows 3-6, cols 0-4 (left curve)
// East Stand:  rows 3-6, cols 5-9 (right curve)

const SVG_W = 900, SVG_H = 620;
const CX = SVG_W / 2, CY = SVG_H / 2;
const PITCH_W = 230, PITCH_H = 130;

function getStadiumPos(r, c) {
  // NORTH STAND: rows 0-2, 10 cells per row
  if (r <= 2) {
    const tier = 2 - r; // 0=close to pitch (row 2), 2=far (row 0/gates)
    const tierY = CY - PITCH_H / 2 - 28 - tier * 36;
    const t = c / 9;
    const arc = Math.sin(t * Math.PI) * (10 + tier * 5);
    const spread = 520 + tier * 30;
    const x = CX - spread / 2 + t * spread;
    const y = tierY - arc;
    return { x, y, stand: 'north' };
  }

  // SOUTH STAND: rows 7-9
  if (r >= 7) {
    const tier = r - 7; // 0=close (row 7), 2=far (row 9/gates)
    const tierY = CY + PITCH_H / 2 + 28 + tier * 36;
    const t = c / 9;
    const arc = Math.sin(t * Math.PI) * (10 + tier * 5);
    const spread = 520 + tier * 30;
    const x = CX - spread / 2 + t * spread;
    const y = tierY + arc;
    return { x, y, stand: 'south' };
  }

  // rows 3-6 → side stands
  const sideT = (r - 3) / 3; // 0..1 vertical fraction

  if (c <= 4) {
    // WEST STAND
    const tier = 4 - c; // col 0=far (tier 4), col 4=close (tier 0)
    const tierX = CX - PITCH_W / 2 - 28 - tier * 32;
    const arc = Math.sin(sideT * Math.PI) * (8 + tier * 4);
    const spread = 230 + tier * 18;
    const y = CY - spread / 2 + sideT * spread;
    const x = tierX - arc;
    return { x, y, stand: 'west' };
  }

  // EAST STAND
  const tier = c - 5; // col 5=close (tier 0), col 9=far (tier 4)
  const tierX = CX + PITCH_W / 2 + 28 + tier * 32;
  const arc = Math.sin(sideT * Math.PI) * (8 + tier * 4);
  const spread = 230 + tier * 18;
  const y = CY - spread / 2 + sideT * spread;
  const x = tierX + arc;
  return { x, y, stand: 'east' };
}


// ── Color Helpers ─────────────────────────────────
function densityColor(d) {
  if (d <= 0.25) return '#22c55e';
  if (d <= 0.45) return '#84cc16';
  if (d <= 0.60) return '#eab308';
  if (d <= 0.75) return '#f97316';
  return '#ef4444';
}

function densityGlowRadius(d) {
  if (d <= 0.3) return 4;
  if (d <= 0.6) return 8;
  return 14;
}


// ── Fan Dots ──────────────────────────────────────
function generateFanDots(venueData, count = 30) {
  if (!venueData) return [];
  const dots = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * 10);
    const c = Math.floor(Math.random() * 10);
    const cell = venueData[r]?.[c];
    if (cell && cell.density > 0.25) {
      const pos = getStadiumPos(r, c);
      dots.push({
        id: i,
        cx: pos.cx,
        cy: pos.cy,
        x: pos.x + (Math.random() - 0.5) * 24,
        y: pos.y + (Math.random() - 0.5) * 24,
        size: 1.5 + Math.random() * 2,
        delay: Math.random() * 4,
        dur: 2.5 + Math.random() * 3,
        opacity: 0.3 + cell.density * 0.5,
      });
    }
  }
  return dots;
}


// ── Stand Glow (average density per stand) ────────
function computeStandGlows(venueData) {
  if (!venueData) return {};
  const stands = { north: [], south: [], west: [], east: [] };

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const cell = venueData[r][c];
      const { stand } = getStadiumPos(r, c);
      if (stands[stand]) stands[stand].push(cell.density);
    }
  }

  const result = {};
  for (const [name, densities] of Object.entries(stands)) {
    const avg = densities.reduce((a, b) => a + b, 0) / densities.length;
    result[name] = {
      avg,
      color: densityColor(avg),
      opacity: Math.max(0.03, avg * 0.2),
    };
  }
  return result;
}


// ── Main Component ────────────────────────────────
export default function VibeMap({ venueData, path, sosAlerts = [], onCellClick }) {
  const [fanDots, setFanDots] = useState([]);

  useEffect(() => {
    if (venueData) setFanDots(generateFanDots(venueData, 30));
  }, [venueData]);

  const sosMap = useMemo(() => {
    const m = new Set();
    sosAlerts.forEach(a => m.add(`${a.x},${a.y}`));
    return m;
  }, [sosAlerts]);

  const pathSet = useMemo(() => {
    const s = new Set();
    if (path) path.forEach(p => s.add(`${p.row},${p.col}`));
    return s;
  }, [path]);

  const standGlows = useMemo(() => computeStandGlows(venueData), [venueData]);

  // Build smooth Cool Path curve
  const pathCurve = useMemo(() => {
    if (!path || path.length < 2) return null;
    const points = path.map(p => getStadiumPos(p.row, p.col));
    // Build smooth SVG path using cardinal spline
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      const cpy = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x + (curr.x - prev.x) * 0.3} ${prev.y + (curr.y - prev.y) * 0.1}, ${cpx} ${cpy}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return { d, points };
  }, [path]);

  // ── Loading state ──
  if (!venueData) {
    return (
      <div className="arena-panel flex items-center justify-center" style={{ minHeight: 420 }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm tracking-widest uppercase">Connecting to Arena...</p>
        </div>
      </div>
    );
  }

  // ── Gate corner positions ──
  const gates = [
    { x: 62, y: 42, label: 'Gate 1' },
    { x: SVG_W - 62, y: 42, label: 'Gate 2' },
    { x: 62, y: SVG_H - 42, label: 'Gate 3' },
    { x: SVG_W - 62, y: SVG_H - 42, label: 'Gate 4' },
  ];

  return (
    <div className="arena-panel p-2 sm:p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-cyan-300/80">
            Live Arena
          </h2>
        </div>
        <div className="flex items-center gap-4 text-[9px] tracking-wider uppercase text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e55' }} /> Clear
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: '#eab308', boxShadow: '0 0 6px #eab30855' }} /> Busy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef444455' }} /> Critical
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ maxWidth: '820px', minWidth: '360px' }}>
          <defs>
            {/* Oval clip for entire stadium */}
            <clipPath id="stadium-clip">
              <ellipse cx={CX} cy={CY} rx={CX - 20} ry={CY - 16} />
            </clipPath>

            {/* Cyan neon glow */}
            <filter id="arena-glow-v3" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feFlood floodColor="#06b6d4" floodOpacity="0.5" />
              <feComposite in2="b" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Path neon glow */}
            <filter id="path-glow-v3" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" />
              <feFlood floodColor="#06b6d4" floodOpacity="0.7" />
              <feComposite operator="in" in2="SourceGraphic" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Stand glow filters */}
            <filter id="stand-glow-red" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="18" />
              <feFlood floodColor="#ef4444" floodOpacity="0.4" />
              <feComposite operator="in" in2="SourceGraphic" />
            </filter>
            <filter id="stand-glow-amber" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="14" />
              <feFlood floodColor="#f59e0b" floodOpacity="0.3" />
              <feComposite operator="in" in2="SourceGraphic" />
            </filter>

            {/* Pitch grass gradient */}
            <linearGradient id="pitch-grass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="50%" stopColor="#166534" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
          </defs>

          {/* Deep space background */}
          <rect width={SVG_W} height={SVG_H} rx="24" fill="#0b0e14" />

          {/* Oval arena border with cyan glow */}
          <ellipse cx={CX} cy={CY} rx={CX - 20} ry={CY - 16}
            fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5"
            filter="url(#arena-glow-v3)" />
          <ellipse cx={CX} cy={CY} rx={CX - 26} ry={CY - 22}
            fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.15"
            strokeDasharray="6 4" />

          {/* Clipped stadium content */}
          <g clipPath="url(#stadium-clip)">

            {/* ── Stand glow backgrounds ──────── */}
            {standGlows.north && standGlows.north.avg > 0.5 && (
              <ellipse cx={CX} cy={CY - PITCH_H / 2 - 60} rx={280} ry={80}
                fill={standGlows.north.color} opacity={standGlows.north.opacity}
                filter={standGlows.north.avg > 0.7 ? 'url(#stand-glow-red)' : 'url(#stand-glow-amber)'} />
            )}
            {standGlows.south && standGlows.south.avg > 0.5 && (
              <ellipse cx={CX} cy={CY + PITCH_H / 2 + 60} rx={280} ry={80}
                fill={standGlows.south.color} opacity={standGlows.south.opacity}
                filter={standGlows.south.avg > 0.7 ? 'url(#stand-glow-red)' : 'url(#stand-glow-amber)'} />
            )}
            {standGlows.west && standGlows.west.avg > 0.5 && (
              <ellipse cx={CX - PITCH_W / 2 - 80} cy={CY} rx={80} ry={140}
                fill={standGlows.west.color} opacity={standGlows.west.opacity}
                filter={standGlows.west.avg > 0.7 ? 'url(#stand-glow-red)' : 'url(#stand-glow-amber)'} />
            )}
            {standGlows.east && standGlows.east.avg > 0.5 && (
              <ellipse cx={CX + PITCH_W / 2 + 80} cy={CY} rx={80} ry={140}
                fill={standGlows.east.color} opacity={standGlows.east.opacity}
                filter={standGlows.east.avg > 0.7 ? 'url(#stand-glow-red)' : 'url(#stand-glow-amber)'} />
            )}

            {/* ── Central Pitch ───────────────── */}
            <rect x={CX - PITCH_W / 2} y={CY - PITCH_H / 2}
              width={PITCH_W} height={PITCH_H}
              rx="6" fill="url(#pitch-grass)" opacity="0.8" />
            {/* Pitch outline */}
            <rect x={CX - PITCH_W / 2 + 4} y={CY - PITCH_H / 2 + 4}
              width={PITCH_W - 8} height={PITCH_H - 8}
              rx="3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {/* Center circle */}
            <circle cx={CX} cy={CY} r={24} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {/* Center dot */}
            <circle cx={CX} cy={CY} r={2} fill="rgba(255,255,255,0.2)" />
            {/* Center line */}
            <line x1={CX} y1={CY - PITCH_H / 2 + 4} x2={CX} y2={CY + PITCH_H / 2 - 4}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Penalty areas */}
            <rect x={CX - PITCH_W / 2 + 4} y={CY - 30} width={36} height={60}
              rx="2" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
            <rect x={CX + PITCH_W / 2 - 40} y={CY - 30} width={36} height={60}
              rx="2" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
            {/* Pitch label */}
            <text x={CX} y={CY + 2} textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.08)" fontSize="11" fontFamily="Inter"
              fontWeight="800" letterSpacing="4">PITCH</text>

            {/* ── Seat Cells (circles) ────────── */}
            {venueData.map((row, ri) =>
              row.map((cell, ci) => {
                const pos = getStadiumPos(ri, ci);
                const key = `${ri},${ci}`;
                const isPath = pathSet.has(key);
                const isSOS = sosMap.has(key);
                const isHot = cell.density > 0.75;
                const isGate = cell.cell_type === 'gate';
                const color = densityColor(cell.density);
                const glowR = densityGlowRadius(cell.density);
                const seatR = isGate ? 9 : 7;

                return (
                  <g key={key} onClick={() => onCellClick?.(cell)} style={{ cursor: 'pointer' }}>
                    {/* Atmospheric glow under each seat */}
                    <circle cx={pos.x} cy={pos.y} r={glowR + seatR}
                      fill={color} opacity={cell.density * 0.18}
                      style={{ filter: `blur(${glowR}px)` }} />

                    {/* Seat circle */}
                    <circle cx={pos.x} cy={pos.y} r={seatR}
                      fill={`${color}40`}
                      stroke={isPath ? '#06b6d4' : isSOS ? '#ef4444' : `${color}80`}
                      strokeWidth={isPath ? 2 : isSOS ? 2 : 0.8}
                    >
                      {isHot && (
                        <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
                      )}
                    </circle>

                    {/* Inner dot (density intensity) */}
                    <circle cx={pos.x} cy={pos.y}
                      r={2 + cell.density * 3}
                      fill={color}
                      opacity={0.6 + cell.density * 0.3}
                    />

                    {/* Path ring */}
                    {isPath && (
                      <circle cx={pos.x} cy={pos.y} r={seatR + 3}
                        fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6"
                        strokeDasharray="3 2" />
                    )}

                    {/* SOS pulse */}
                    {isSOS && (
                      <>
                        <circle cx={pos.x} cy={pos.y} r={seatR + 2}
                          fill="none" stroke="#ef4444" strokeWidth="1.5">
                          <animate attributeName="r" from={seatR} to={seatR + 18} dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        <text x={pos.x} y={pos.y - seatR - 6} textAnchor="middle"
                          fill="#ef4444" fontSize="8" fontWeight="800" fontFamily="Inter">SOS</text>
                      </>
                    )}

                    {/* Seat label (only for seats, not gates/aisles) */}
                    {cell.seat_id && (
                      <text x={pos.x} y={pos.y + 0.5} textAnchor="middle" dominantBaseline="middle"
                        fill={cell.density > 0.6 ? '#fff' : '#94a3b8'}
                        fontSize="5.5" fontFamily="Inter" fontWeight="600" letterSpacing="0.3">
                        {cell.seat_id}
                      </text>
                    )}
                  </g>
                );
              })
            )}

            {/* ── Floating Fan Dots ───────────── */}
            {fanDots.map(dot => (
              <circle key={`fan-${dot.id}`} cx={dot.x} cy={dot.y}
                r={dot.size} fill="#fff" opacity={dot.opacity}
                className="fan-dot"
                style={{ animationDelay: `${dot.delay}s`, animationDuration: `${dot.dur}s` }} />
            ))}

          </g>
          {/* End clipped content */}

          {/* ── Gate Icons (outside clip, at corners) ── */}
          {gates.map((g, i) => (
            <g key={`gate-${i}`}>
              <rect x={g.x - 20} y={g.y - 10} width={40} height={20}
                rx="6" fill="rgba(6,182,212,0.08)"
                stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
              <text x={g.x} y={g.y + 1} textAnchor="middle" dominantBaseline="middle"
                fill="#06b6d4" fontSize="7" fontFamily="Inter" fontWeight="700"
                opacity="0.7" letterSpacing="0.5">{g.label.toUpperCase()}</text>
            </g>
          ))}

          {/* ── Stand Labels ──────────────────── */}
          <text x={CX} y={36} textAnchor="middle" fill="rgba(255,255,255,0.12)"
            fontSize="9" fontFamily="Inter" fontWeight="700" letterSpacing="4">NORTH STAND</text>
          <text x={CX} y={SVG_H - 26} textAnchor="middle" fill="rgba(255,255,255,0.12)"
            fontSize="9" fontFamily="Inter" fontWeight="700" letterSpacing="4">SOUTH STAND</text>
          <text x={46} y={CY} textAnchor="middle" fill="rgba(255,255,255,0.1)"
            fontSize="8" fontFamily="Inter" fontWeight="700" letterSpacing="3"
            transform={`rotate(-90, 46, ${CY})`}>WEST</text>
          <text x={SVG_W - 46} y={CY} textAnchor="middle" fill="rgba(255,255,255,0.1)"
            fontSize="8" fontFamily="Inter" fontWeight="700" letterSpacing="3"
            transform={`rotate(90, ${SVG_W - 46}, ${CY})`}>EAST</text>

          {/* ── Cool Path (curved neon line) ──── */}
          {pathCurve && (
            <>
              <path d={pathCurve.d} fill="none" stroke="#06b6d4" strokeWidth="3"
                strokeLinecap="round" strokeDasharray="10 6"
                filter="url(#path-glow-v3)" opacity="0.9">
                <animate attributeName="stroke-dashoffset" from="32" to="0" dur="1.2s" repeatCount="indefinite" />
              </path>

              {/* Start marker */}
              <circle cx={pathCurve.points[0].x} cy={pathCurve.points[0].y}
                r={8} fill="#06b6d4" stroke="#0b0e14" strokeWidth="2"
                filter="url(#path-glow-v3)" />
              <text x={pathCurve.points[0].x} y={pathCurve.points[0].y + 0.5}
                textAnchor="middle" dominantBaseline="middle"
                fill="#0b0e14" fontSize="6" fontWeight="800">▶</text>

              {/* End marker */}
              <circle cx={pathCurve.points.at(-1).x} cy={pathCurve.points.at(-1).y}
                r={10} fill="#d946ef" stroke="#0b0e14" strokeWidth="2">
                <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
              </circle>
              <text x={pathCurve.points.at(-1).x} y={pathCurve.points.at(-1).y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fill="#fff" fontSize="7" fontWeight="bold">📍</text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
