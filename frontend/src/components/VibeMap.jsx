import { useMemo, useEffect, useState } from 'react';

/**
 * VibeMap — High-End Tactical Blueprint
 * 
 * DESIGN SPECS:
 * - Geometric trapezoidal stands (Blueprint style)
 * - Dot-matrix seating pattern
 * - Pulse clusters for density (Heat Particles)
 * - Sweeping radar & scanning line
 * - Interactive legend
 */

const AISLE_LABELS = [
  { text: 'SEC-104', x: 480, y: 285 },
  { text: 'SEC-105', x: 650, y: 285 },
  { text: 'VIP-B', x: 500, y: 760 },
  { text: 'SEC-106', x: 650, y: 760 },
];

export default function VibeMap({ venueData, path, sosAlerts = [], onCellClick, attendeeMode = true, agentLogs = [] }) {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Map density to dot-matrix cluster intensity
  const { standColors, attendeeDots } = useMemo(() => {
    const s = { north: '#1e293b', south: '#1e293b', east: '#1e293b', west: '#1e293b' };
    const dots = [];
    if (!venueData) return { standColors: s, attendeeDots: [] };

    venueData.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (cell.cell_type !== 'seat') return;
        
        // Stand Logic
        let stand = '';
        if (ri <= 2) stand = 'north';
        else if (ri >= 7) stand = 'south';
        else if (ci <= 2) stand = 'west';
        else if (ci >= 7) stand = 'east';

        if (stand) {
          if (cell.density > 0.6) s[stand] = 'rgba(245, 158, 11, 0.4)'; 
          if (cell.density > 0.85) s[stand] = 'rgba(239, 68, 68, 0.4)';

          // Generate attendee dots for visuals
          const count = Math.floor(cell.density * 12);
          for (let i = 0; i < count; i++) {
            dots.push({
              id: `fan-${ri}-${ci}-${i}`,
              cx: (ci * 100 + 50) + (Math.random() * 60 - 30),
              cy: (ri * 100 + 50) + (Math.random() * 60 - 30),
              r: 1.5 + Math.random() * 2,
              opacity: 0.4 + cell.density * 0.5
            });
          }
        }
      });
    });
    return { standColors: s, attendeeDots: dots };
  }, [venueData]);

  const pathPoints = useMemo(() => {
    if (!path) return '';
    return path.map(p => `${p.col * 100 + 50},${p.row * 100 + 50}`).join(' ');
  }, [path]);

  // Coordinates for YOU marker (Mock for attendee mode)
  const userPos = { x: 550, y: 730 };

  return (
    <div className="tactical-panel relative map-blueprint-bg min-h-[600px] flex items-center justify-center group overflow-hidden">
      {/* Scanner Effect */}
      <div className="scanner-effect" />

      {/* SVG Blueprint */}
      <svg viewBox="0 0 1000 1000" className="w-full h-full max-w-[800px] drop-shadow-[0_0_30px_rgba(0,210,255,0.1)]">
        <defs>
          {/* Dot Matrix Pattern */}
          <pattern id="dotMatrix" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(0, 210, 255, 0.15)" />
          </pattern>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Stadium Boundary (Geometric) */}
        <path 
           d="M 150,150 L 850,150 L 950,500 L 850,850 L 150,850 L 50,500 Z" 
           fill="none" 
           stroke="rgba(0, 210, 255, 0.1)" 
           strokeWidth="2"
           strokeDasharray="10 5"
        />

        {/* Background Grid Dots (Global) */}
        <rect width="1000" height="1000" fill="url(#dotMatrix)" pointerEvents="none" />

        {/* ── STANDS ── */}
        {/* North Stand */}
        <g className="cursor-pointer group/stand" onClick={() => onCellClick?.('NORTH')}>
          <path d="M 300,250 L 700,250 L 750,150 L 250,150 Z" 
                className="map-geometry-path"
                style={{ fill: standColors.north }} />
          <text x="500" y="130" textAnchor="middle" className="tech-header fill-dim" fontSize="12">NORTH_TERRACE [SEC-101]</text>
        </g>

        {/* South Stand */}
        <g className="cursor-pointer group/stand" onClick={() => onCellClick?.('SOUTH')}>
          <path d="M 300,750 L 700,750 L 750,850 L 250,850 Z" 
                className="map-geometry-path"
                style={{ fill: standColors.south }} />
          <text x="500" y="880" textAnchor="middle" className="tech-header fill-dim" fontSize="12">SOUTH_STAND [SEC-204]</text>
        </g>

        {/* West Stand (Skewed Side) */}
        <g className="cursor-pointer group/stand" onClick={() => onCellClick?.('WEST')}>
          <path d="M 250,300 L 250,700 L 100,750 L 100,250 Z" 
                className="map-geometry-path"
                style={{ fill: standColors.west }} />
          <text x="80" y="500" textAnchor="middle" className="tech-header fill-dim" fontSize="12" transform="rotate(-90 80,500)">AXIS_W [LOGISTICS]</text>
        </g>

        {/* East Stand */}
        <g className="cursor-pointer group/stand" onClick={() => onCellClick?.('EAST')}>
          <path d="M 750,300 L 750,700 L 900,750 L 900,250 Z" 
                className="map-geometry-path"
                style={{ fill: standColors.east }} />
          <text x="920" y="500" textAnchor="middle" className="tech-header fill-dim" fontSize="12" transform="rotate(90 920,500)">VIP-LEVEL / MEDIA</text>
        </g>

        {/* ── PITCH ── */}
        <g pointerEvents="none">
          <rect x="350" y="350" width="300" height="300" fill="none" stroke="rgba(0, 210, 255, 0.2)" strokeWidth="1" />
          <circle cx="500" cy="500" r="40" fill="none" stroke="rgba(0, 210, 255, 0.15)" strokeWidth="1" strokeDasharray="5 5" />
          <line x1="350" y1="500" x2="650" y2="500" stroke="rgba(0, 210, 255, 0.15)" strokeWidth="1" strokeDasharray="5 5" />
        </g>

        {/* ── ATTENDEES (FAN DOTS) ── */}
        <g className="attendees" pointerEvents="none">
          {attendeeDots.map(dot => (
            <circle 
              key={dot.id} 
              cx={dot.cx} 
              cy={dot.cy} 
              r={dot.r} 
              fill={attendeeMode ? "var(--cyan-tactical)" : "var(--amber-tactical)"} 
              opacity={dot.opacity} 
            />
          ))}
        </g>

        {/* Aisle Labels */}
        {AISLE_LABELS.map((label, idx) => (
          <text key={idx} x={label.x} y={label.y} className="text-[10px] fill-[#5a7a8a] font-mono tracking-widest">{label.text}</text>
        ))}

        {/* ── Pathfinding Line ── */}
        {pathPoints && (
          <polyline 
            points={pathPoints} 
            fill="none" 
            stroke="var(--cyan-tactical)" 
            strokeWidth="3" 
            strokeDasharray="8 4" 
            className="data-stream-path animate-tech-pulse" 
            filter="url(#glow)"
          />
        )}

        {/* ── SOS Alerts ── */}
        {sosAlerts.filter(a => !a.resolved).map(alert => (
          <g key={alert.id} transform={`translate(${alert.y * 100 + 50}, ${alert.x * 100 + 50})`}>
            <circle r="15" fill="var(--red-tactical)" className="animate-ping opacity-20" />
            <circle r="6" fill="var(--red-tactical)" filter="url(#glow)" />
          </g>
        ))}

        {/* ── User Marker (Attendee Mode) ── */}
        {attendeeMode && (
          <g transform={`translate(${userPos.x}, ${userPos.y})`}>
            <circle r="10" fill="var(--cyan-tactical)" className="animate-ping opacity-30" />
            <rect x="-10" y="-10" width="20" height="20" fill="var(--cyan-tactical)" className="rotate-45" filter="url(#glow)" />
            <g transform="translate(0, 25)">
               <rect x="-25" y="-10" width="50" height="16" fill="var(--cyan-tactical)" />
               <text y="2" textAnchor="middle" fill="var(--bg-space)" className="text-[10px] font-bold">YOU</text>
            </g>
          </g>
        )}

        {/* Radar Sweep */}
        <g transform="translate(500, 500)">
          <line x1="0" y1="0" x2="0" y2="-450" stroke="var(--cyan-tactical)" strokeWidth="1" opacity="0.3" className="origin-center animate-[spin_6s_linear_infinite]" />
        </g>
      </svg>

      {/* Map Legend (Floating) */}
      <div className="absolute bottom-6 right-6 p-4 bg-bg-panel/80 backdrop-blur-md border border-border-dim text-[10px] font-mono space-y-2">
         <LegendItem color="var(--cyan-tactical)" label="SEAT_VACANCY" />
         <LegendItem color="var(--amber-tactical)" label="FLOW_DENSITY" />
         <LegendItem color="var(--cyan-tactical)" label="OPT_EVAC_PATH" dashed />
      </div>

      {/* Zoom Controls */}
      <div className="absolute right-6 bottom-32 flex flex-col gap-2">
         <button className="w-8 h-8 border border-border-dim bg-bg-panel/80 text-cyan-tactical hover:bg-cyan-tactical/20 transition-all">+</button>
         <button className="w-8 h-8 border border-border-dim bg-bg-panel/80 text-cyan-tactical hover:bg-cyan-tactical/20 transition-all">-</button>
         <button className="w-8 h-8 border border-border-dim bg-bg-panel/80 text-cyan-tactical hover:bg-cyan-tactical/20 transition-all">⬡</button>
      </div>

      <style>{`
        .fill-dim { fill: var(--text-dim); }
      `}</style>
    </div>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 ${dashed ? 'border-t-2 border-dashed' : ''}`} style={{ backgroundColor: dashed ? 'transparent' : color, borderTopColor: color }} />
      <span className="text-white/70 tracking-tighter uppercase">{label}</span>
    </div>
  );
}
