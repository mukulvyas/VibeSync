import { useMemo, useEffect, useState } from 'react';

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
  { id: 'NORTH', label: 'NORTH_STAND', color: 'rgba(0, 210, 255, 0.1)', rowCount: 6 },
  { id: 'SOUTH', label: 'SOUTH_TERRACE', color: 'rgba(0, 210, 255, 0.1)', rowCount: 6 },
  { id: 'WEST', label: 'WEST_AXIS', color: 'rgba(0, 210, 255, 0.1)', rowCount: 8 },
  { id: 'EAST', label: 'EAST_AXIS', color: 'rgba(0, 210, 255, 0.1)', rowCount: 8 },
];

export default function VibeMap({ venueData, path, sosAlerts = [], onCellClick, attendeeMode = true, userPos, incentives = [], showHeatmap = true }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredStand, setHoveredStand] = useState(null);

  // Generate 3D Bowl Data & Heatmap Points
  const { standColors, attendeeDots, heatmapPoints } = useMemo(() => {
    const s = { NORTH: '#1e293b', SOUTH: '#1e293b', EAST: '#1e293b', WEST: '#1e293b' };
    const dots = [];
    const hPoints = [];
    if (!venueData) return { standColors: s, attendeeDots: [], heatmapPoints: [] };

    venueData.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (cell.cell_type !== 'seat') return;
        
        let stand = '';
        if (ri <= 2) stand = 'NORTH';
        else if (ri >= 7) stand = 'SOUTH';
        else if (ci <= 2) stand = 'WEST';
        else if (ci >= 7) stand = 'EAST';

        if (stand) {
          if (cell.density > 0.6) s[stand] = 'rgba(245, 158, 11, 0.4)'; 
          if (cell.density > 0.85) s[stand] = 'rgba(239, 68, 68, 0.4)';

          // Create base for heatmap bloom
          if (cell.density > 0.2) {
            hPoints.push({
              id: `heat-${ri}-${ci}`,
              cx: ci * 100 + 50,
              cy: ri * 100 + 50,
              radius: 40 + cell.density * 60,
              opacity: 0.1 + cell.density * 0.4,
              color: cell.density > 0.8 ? 'var(--red-tactical)' : cell.density > 0.5 ? 'var(--amber-tactical)' : 'var(--cyan-tactical)'
            });
          }

          const count = Math.floor(cell.density * 8);
          for (let i = 0; i < count; i++) {
            dots.push({
              id: `fan-${ri}-${ci}-${i}`,
              cx: (ci * 100 + 50) + (Math.random() * 40 - 20),
              cy: (ri * 100 + 50) + (Math.random() * 40 - 20),
              r: 1.2 + Math.random() * 1.5,
              opacity: 0.5 + cell.density * 0.5,
              dur: 1.5 + Math.random() * 1.5
            });
          }
        }
      });
    });
    return { standColors: s, attendeeDots: dots, heatmapPoints: hPoints };
  }, [venueData]);

  const pathPoints = useMemo(() => {
    if (!path) return '';
    return path.map(p => `${p.col * 100 + 50},${p.row * 100 + 50}`).join(' ');
  }, [path]);

  // Map "YOU" marker to grid coordinates
  const pixelPos = useMemo(() => {
    if (!userPos) return { x: 500, y: 700 };
    return { x: userPos.col * 100 + 50, y: userPos.row * 100 + 50 };
  }, [userPos]);

  return (
    <div className="tactical-panel glass-tactical relative map-blueprint-bg min-h-[600px] flex items-center justify-center group overflow-hidden rounded-xl">
      <div className="scanner-effect opacity-50" />

      <svg viewBox="0 0 1000 1000" className="w-full h-full max-w-[850px] drop-shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-transform duration-700">
        <defs>
          <radialGradient id="bowlInnerGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="rgba(0, 210, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(0, 210, 255, 0)" />
          </radialGradient>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
             <feGaussianBlur stdDeviation="6" result="blur" />
             <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {heatmapPoints.map(hp => (
            <radialGradient id={`grad-${hp.id}`} key={hp.id}>
              <stop offset="0%" stopColor={hp.color} stopOpacity={hp.opacity} />
              <stop offset="100%" stopColor={hp.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* Stadium Floor Reflection */}
        <circle cx="500" cy="500" r="450" fill="url(#bowlInnerGlow)" opacity="0.5" />

        {/* ── HEATMAP BLOOMS ── */}
        {showHeatmap && (
          <g className="heatmap-layer mix-blend-screen" opacity="0.6">
            {heatmapPoints.map(hp => (
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
          onClick={() => onCellClick?.('NORTH')} 
          onMouseEnter={() => setHoveredStand('NORTH')}
          onMouseLeave={() => setHoveredStand(null)}
          className="cursor-pointer transition-all duration-300"
          style={{ transform: hoveredStand === 'NORTH' ? 'translateY(-5px) scale(1.01)' : 'none', transformOrigin: 'center 130px' }}
        >
          <path d="M 250,150 L 750,150 L 720,100 L 280,100 Z" fill="rgba(30, 41, 59, 0.9)" stroke="rgba(0,210,255,0.3)" />
          <path d="M 300,250 L 700,250 L 750,150 L 250,150 Z" fill={standColors.NORTH} className="transition-colors duration-1000" />
          {[190, 210, 230].map(h => (
            <line key={h} x1={300 + (h-150)/2} y1={h} x2={700 - (h-150)/2} y2={h} stroke="rgba(0,210,255,0.15)" strokeWidth="0.5" />
          ))}
          <Label x={500} y={130} text="SEC-NORTH [COMMAND]" />
        </g>

        {/* South Stand */}
        <g 
          onClick={() => onCellClick?.('SOUTH')}
          onMouseEnter={() => setHoveredStand('SOUTH')}
          onMouseLeave={() => setHoveredStand(null)}
          className="cursor-pointer transition-all duration-300"
          style={{ transform: hoveredStand === 'SOUTH' ? 'translateY(5px) scale(1.01)' : 'none', transformOrigin: 'center 875px' }}
        >
          <path d="M 250,850 L 750,850 L 720,900 L 280,900 Z" fill="rgba(30, 41, 59, 0.9)" stroke="rgba(0,210,255,0.3)" />
          <path d="M 300,750 L 700,750 L 750,850 L 250,850 Z" fill={standColors.SOUTH} className="transition-colors duration-1000" />
          {[770, 790, 810, 830].map(h => (
            <line key={h} x1={300 - (850-h)/2} y1={h} x2={700 + (850-h)/2} y2={h} stroke="rgba(0,210,255,0.15)" strokeWidth="0.5" />
          ))}
          <Label x={500} y={875} text="SEC-SOUTH [FANS]" />
        </g>

        {/* West Stand */}
        <g 
          onClick={() => onCellClick?.('WEST')}
          onMouseEnter={() => setHoveredStand('WEST')}
          onMouseLeave={() => setHoveredStand(null)}
          className="cursor-pointer transition-all duration-300"
          style={{ transform: hoveredStand === 'WEST' ? 'translateX(-5px) scale(1.01)' : 'none', transformOrigin: '80px center' }}
        >
          <path d="M 100,250 L 100,750 L 50,720 L 50,280 Z" fill="rgba(30, 41, 59, 0.9)" stroke="rgba(0,210,255,0.3)" />
          <path d="M 250,300 L 250,700 L 100,750 L 100,250 Z" fill={standColors.WEST} className="transition-colors duration-1000" />
          {[140, 180, 220].map(w => (
            <line key={w} x1={w} y1={300 - (250-w)/2} x2={w} y2={700 + (250-w)/2} stroke="rgba(0,210,255,0.15)" strokeWidth="0.5" />
          ))}
          <Label x={80} y={500} text="WEST_AXIS" rotate={-90} />
        </g>

        {/* East Stand */}
        <g 
          onClick={() => onCellClick?.('EAST')}
          onMouseEnter={() => setHoveredStand('EAST')}
          onMouseLeave={() => setHoveredStand(null)}
          className="cursor-pointer transition-all duration-300"
          style={{ transform: hoveredStand === 'EAST' ? 'translateX(5px) scale(1.01)' : 'none', transformOrigin: '920px center' }}
        >
          <path d="M 900,250 L 900,750 L 950,720 L 950,280 Z" fill="rgba(30, 41, 59, 0.9)" stroke="rgba(0,210,255,0.3)" />
          <path d="M 750,300 L 750,700 L 900,750 L 900,250 Z" fill={standColors.EAST} className="transition-colors duration-1000" />
          {[780, 820, 860].map(w => (
             <line key={w} x1={w} y1={300 + (w-750)/2} x2={w} y2={700 - (w-750)/2} stroke="rgba(0,210,255,0.15)" strokeWidth="0.5" />
          ))}
          <Label x={920} y={500} text="EAST_VIP" rotate={90} />
        </g>

        {/* ── PITCH (The Centerpiece) ── */}
        <g transform="translate(350, 350)" pointerEvents="none">
           <rect width="300" height="300" fill="rgba(0, 210, 255, 0.05)" stroke="rgba(0, 210, 255, 0.3)" strokeWidth="1" rx="4" />
           <circle cx="150" cy="150" r="50" fill="none" stroke="rgba(0, 210, 255, 0.2)" strokeWidth="1" strokeDasharray="10 5" />
           <line x1="0" y1="150" x2="300" y2="150" stroke="rgba(0, 210, 255, 0.2)" strokeWidth="1" strokeDasharray="10 5" />
        </g>

        {/* ── ATTENDEES (STATIC MARKERS) ── */}
        {!showHeatmap && (
          <g className="crowd-layer" pointerEvents="none">
            {attendeeDots.map(dot => (
              <circle 
                key={dot.id} 
                cx={dot.cx} 
                cy={dot.cy} 
                r={dot.r} 
                fill={attendeeMode ? "var(--cyan-tactical)" : "var(--amber-tactical)"} 
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
             <circle r="20" fill="var(--cyan-tactical)" className="animate-ping opacity-30" />
             <rect x="-12" y="-12" width="24" height="24" fill="white" className="rotate-45 shadow-2xl" />
             <g transform="translate(0, 50)">
                 <rect x="-45" y="-18" width="90" height="28" fill="var(--cyan-tactical)" rx="6" className="shadow-2xl" />
                 <text textAnchor="middle" y="0" dominantBaseline="middle" fill="#010409" fontSize="14" fontWeight="900">POSITION_YOU</text>
             </g>
          </g>
        )}
        
      </svg>

      {/* Map Legend */}
      <div className="absolute bottom-6 right-6 p-4 bg-bg-panel/90 backdrop-blur-xl border border-border-dim text-[10px] font-bold space-y-2 label-backed">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-tactical rounded-full" />
            <span className="text-white/80">3D_ASSET_NOMINAL</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-tactical rounded-full" />
            <span className="text-white/80">FLOW_CONGESTION</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-cyan-tactical" />
            <span className="text-white/80">ENERGY_RIBBON</span>
         </div>
      </div>
    </div>
  );
}

function Label({ x, y, text, rotate = 0 }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate})`}>
       <rect x="-60" y="-10" width="120" height="20" rx="2" fill="rgba(0,0,0,0.6)" className="label-backed" />
       <text textAnchor="middle" dominantBaseline="middle" dy="1" fill="white" fontSize="11" fontWeight="600" letterSpacing="0.1em">
          {text}
       </text>
    </g>
  );
}
