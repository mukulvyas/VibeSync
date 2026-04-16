import { useMemo, useEffect, useState } from 'react';

/**
 * VibeMap v2 — Oval stadium arena with atmospheric lighting, 
 * rounded seat icons, neon glow effects, and floating fan dots.
 */

// Generate random fan dots
function generateFanDots(venueData, count = 25) {
  if (!venueData) return [];
  const dots = [];
  for (let i = 0; i < count; i++) {
    // Bias toward high-density cells
    const r = Math.floor(Math.random() * 10);
    const c = Math.floor(Math.random() * 10);
    const cell = venueData[r]?.[c];
    if (cell && cell.density > 0.3) {
      dots.push({
        id: i,
        baseRow: r,
        baseCol: c,
        offsetX: (Math.random() - 0.5) * 30,
        offsetY: (Math.random() - 0.5) * 30,
        size: 2 + Math.random() * 2.5,
        animDelay: Math.random() * 4,
        animDuration: 2 + Math.random() * 3,
        opacity: 0.4 + cell.density * 0.5,
      });
    }
  }
  return dots;
}

export default function VibeMap({ venueData, path, sosAlerts = [], onCellClick }) {
  const [fanDots, setFanDots] = useState([]);

  // Regenerate fan dots when venue data changes
  useEffect(() => {
    if (venueData) {
      setFanDots(generateFanDots(venueData, 30));
    }
  }, [venueData]);

  const cellSize = 46;
  const cellGap = 5;
  const gridWidth = 10 * (cellSize + cellGap);
  const gridHeight = 10 * (cellSize + cellGap);
  const padding = 50;
  const svgW = gridWidth + padding * 2;
  const svgH = gridHeight + padding * 2;

  // Oval arena dimensions
  const ovalCx = svgW / 2;
  const ovalCy = svgH / 2;
  const ovalRx = svgW / 2 - 8;
  const ovalRy = svgH / 2 - 8;

  // SOS and path lookups
  const sosMap = useMemo(() => {
    const map = new Set();
    sosAlerts.forEach(a => map.add(`${a.x},${a.y}`));
    return map;
  }, [sosAlerts]);

  const pathSet = useMemo(() => {
    const s = new Set();
    if (path) path.forEach(p => s.add(`${p.row},${p.col}`));
    return s;
  }, [path]);

  function densityColor(density) {
    if (density <= 0.25) return '#22c55e';  // green
    if (density <= 0.45) return '#84cc16';  // lime
    if (density <= 0.60) return '#eab308';  // yellow
    if (density <= 0.75) return '#f97316';  // orange
    return '#ef4444';                        // red
  }

  function densityGlow(density) {
    if (density <= 0.4) return 'drop-shadow(0 0 4px rgba(34,197,94,0.3))';
    if (density <= 0.65) return 'drop-shadow(0 0 6px rgba(234,179,8,0.4))';
    if (density <= 0.8) return 'drop-shadow(0 0 8px rgba(249,115,22,0.5))';
    return 'drop-shadow(0 0 12px rgba(239,68,68,0.7))';
  }

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

  return (
    <div className="arena-panel p-3 sm:p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-cyan-300/80">
            Live Arena
          </h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] tracking-wider uppercase text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e55' }}></span> Clear
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#eab308', boxShadow: '0 0 6px #eab30855' }}></span> Busy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef444455' }}></span> Critical
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full"
          style={{ maxWidth: '640px', minWidth: '340px' }}
        >
          <defs>
            {/* Cyan neon glow filter for the oval */}
            <filter id="arena-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur1" />
              <feFlood floodColor="#06b6d4" floodOpacity="0.5" />
              <feComposite in2="blur1" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Red emergency glow */}
            <filter id="emergency-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur2" />
              <feFlood floodColor="#ef4444" floodOpacity="0.6" />
              <feComposite in2="blur2" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Path glow */}
            <filter id="path-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" />
              <feFlood floodColor="#06b6d4" floodOpacity="0.8" />
              <feComposite operator="in" in2="SourceGraphic" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* SOS pulse animation */}
            <radialGradient id="sos-gradient">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Deep space background */}
          <rect width={svgW} height={svgH} rx="20" fill="#0b0e14" />

          {/* Oval arena border with cyan neon glow */}
          <ellipse
            cx={ovalCx} cy={ovalCy} rx={ovalRx} ry={ovalRy}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            opacity="0.6"
            filter="url(#arena-glow)"
          />
          <ellipse
            cx={ovalCx} cy={ovalCy} rx={ovalRx - 6} ry={ovalRy - 6}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="0.5"
            opacity="0.2"
            strokeDasharray="6 4"
          />

          {/* Grid cells as rounded seat icons */}
          {venueData.map((row, ri) =>
            row.map((cell, ci) => {
              const x = padding + ci * (cellSize + cellGap);
              const y = padding + ri * (cellSize + cellGap);
              const key = `${ri},${ci}`;
              const isPath = pathSet.has(key);
              const isSOS = sosMap.has(key);
              const isHot = cell.density > 0.75;
              const color = densityColor(cell.density);
              const isGate = cell.cell_type === 'gate';
              const isAisle = cell.cell_type === 'aisle';

              return (
                <g key={key} onClick={() => onCellClick?.(cell)} style={{ cursor: 'pointer' }}>
                  {/* Atmospheric drop shadow / glow */}
                  <rect
                    x={x} y={y}
                    width={cellSize} height={cellSize}
                    rx={isGate ? 6 : 14}
                    fill={color}
                    opacity={0.15}
                    style={{ filter: densityGlow(cell.density) }}
                  />

                  {/* Main cell — rounded stadium seat */}
                  <rect
                    x={x + 2} y={y + 2}
                    width={cellSize - 4} height={cellSize - 4}
                    rx={isGate ? 5 : 12}
                    fill={`${color}${isAisle ? '40' : '30'}`}
                    stroke={isPath ? '#06b6d4' : isSOS ? '#ef4444' : `${color}60`}
                    strokeWidth={isPath ? 2.5 : isSOS ? 2.5 : 1}
                    style={{ filter: isHot ? 'url(#emergency-glow)' : densityGlow(cell.density) }}
                  >
                    {isHot && (
                      <animate
                        attributeName="opacity"
                        values="1;0.5;1"
                        dur="1.2s"
                        repeatCount="indefinite"
                      />
                    )}
                  </rect>

                  {/* Path highlight */}
                  {isPath && (
                    <rect
                      x={x + 4} y={y + 4}
                      width={cellSize - 8} height={cellSize - 8}
                      rx={10}
                      fill="rgba(6,182,212,0.15)"
                      stroke="#06b6d4"
                      strokeWidth="1"
                      strokeDasharray="3 2"
                    />
                  )}

                  {/* SOS pulse rings */}
                  {isSOS && (
                    <>
                      <circle
                        cx={x + cellSize / 2} cy={y + cellSize / 2}
                        r={cellSize / 2 + 4}
                        fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6"
                      >
                        <animate attributeName="r" from={cellSize / 2} to={cellSize / 2 + 16} dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                      <text
                        x={x + cellSize / 2} y={y + 12}
                        textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="800"
                      >SOS</text>
                    </>
                  )}

                  {/* Cell label */}
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + (isGate ? -2 : 1)}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={cell.density > 0.65 ? '#fff' : '#94a3b8'}
                    fontSize={isGate ? '8' : '8'}
                    fontFamily="Inter, system-ui"
                    fontWeight={isGate ? '700' : '500'}
                    letterSpacing="0.5"
                  >
                    {isGate ? 'GATE' : isAisle ? '·' : cell.seat_id || '·'}
                  </text>

                  {/* Density micro-label */}
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize - 6}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.25)"
                    fontSize="6"
                    fontFamily="Inter, monospace"
                  >
                    {(cell.density * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })
          )}

          {/* Floating fan dots */}
          {fanDots.map(dot => {
            const cx = padding + dot.baseCol * (cellSize + cellGap) + cellSize / 2 + dot.offsetX;
            const cy = padding + dot.baseRow * (cellSize + cellGap) + cellSize / 2 + dot.offsetY;
            return (
              <circle
                key={`fan-${dot.id}`}
                cx={cx} cy={cy}
                r={dot.size}
                fill="#fff"
                opacity={dot.opacity}
                className="fan-dot"
                style={{
                  animationDelay: `${dot.animDelay}s`,
                  animationDuration: `${dot.animDuration}s`,
                }}
              />
            );
          })}

          {/* Cool path line */}
          {path && path.length > 1 && (
            <polyline
              points={path
                .map(p =>
                  `${padding + p.col * (cellSize + cellGap) + cellSize / 2},${padding + p.row * (cellSize + cellGap) + cellSize / 2}`
                )
                .join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 5"
              filter="url(#path-glow)"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="26"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </polyline>
          )}

          {/* Path markers */}
          {path && path.length > 0 && (
            <>
              {/* Start */}
              <circle
                cx={padding + path[0].col * (cellSize + cellGap) + cellSize / 2}
                cy={padding + path[0].row * (cellSize + cellGap) + cellSize / 2}
                r="7" fill="#06b6d4" stroke="#0b0e14" strokeWidth="2"
                filter="url(#path-glow)"
              />
              {/* End */}
              <circle
                cx={padding + path[path.length - 1].col * (cellSize + cellGap) + cellSize / 2}
                cy={padding + path[path.length - 1].row * (cellSize + cellGap) + cellSize / 2}
                r="9" fill="#d946ef" stroke="#0b0e14" strokeWidth="2"
              >
                <animate attributeName="r" values="9;11;9" dur="2s" repeatCount="indefinite" />
              </circle>
              <text
                x={padding + path[path.length - 1].col * (cellSize + cellGap) + cellSize / 2}
                y={padding + path[path.length - 1].row * (cellSize + cellGap) + cellSize / 2 + 1}
                textAnchor="middle" dominantBaseline="middle"
                fill="#fff" fontSize="7" fontWeight="bold"
              >📍</text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
