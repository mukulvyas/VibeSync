import { useMemo } from 'react';

/**
 * VibeMap — SVG 10×10 stadium grid with density heatmap and cool path overlay.
 */
export default function VibeMap({ venueData, path, sosAlerts = [], onCellClick }) {
  if (!venueData) {
    return (
      <div className="glass-panel p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-vibe-cyan/30 border-t-vibe-cyan rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Connecting to venue...</p>
        </div>
      </div>
    );
  }

  const cellSize = 56;
  const gap = 3;
  const padding = 20;
  const totalSize = 10 * (cellSize + gap) - gap + padding * 2;

  // Build SOS alert lookup
  const sosMap = useMemo(() => {
    const map = new Set();
    sosAlerts.forEach(a => map.add(`${a.x},${a.y}`));
    return map;
  }, [sosAlerts]);

  // Build path lookup
  const pathSet = useMemo(() => {
    const s = new Set();
    if (path) path.forEach(p => s.add(`${p.row},${p.col}`));
    return s;
  }, [path]);

  function densityColor(density) {
    if (density <= 0.3) return `rgba(132, 204, 22, ${0.4 + density})`; // lime
    if (density <= 0.6) return `rgba(245, 158, 11, ${0.4 + density * 0.6})`; // amber
    return `rgba(239, 68, 68, ${0.5 + density * 0.4})`; // red
  }

  function cellIcon(cellType) {
    if (cellType === 'gate') return '🚪';
    if (cellType === 'aisle') return '';
    return '';
  }

  return (
    <div className="glass-panel p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title text-base sm:text-lg">🏟️ VibeMap — Live Crowd Density</h2>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-lime-500/60"></span> Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-amber-500/60"></span> Med
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-500/60"></span> High
          </span>
        </div>
      </div>

      <div className="flex justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalSize} ${totalSize}`}
          className="w-full max-w-[600px]"
          style={{ minWidth: '320px' }}
        >
          {/* Background */}
          <rect width={totalSize} height={totalSize} rx="16" fill="#0d0d24" />

          {venueData.map((row, ri) =>
            row.map((cell, ci) => {
              const x = padding + ci * (cellSize + gap);
              const y = padding + ri * (cellSize + gap);
              const key = `${ri},${ci}`;
              const isPath = pathSet.has(key);
              const isSOS = sosMap.has(key);
              const isHot = cell.density > 0.75;

              return (
                <g key={key} onClick={() => onCellClick?.(cell)} style={{ cursor: 'pointer' }}>
                  {/* Cell background */}
                  <rect
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx="8"
                    fill={densityColor(cell.density)}
                    stroke={isPath ? '#06b6d4' : isSOS ? '#ef4444' : '#1a1a3e'}
                    strokeWidth={isPath ? 3 : isSOS ? 3 : 1}
                    className={isHot ? 'cell-hot' : ''}
                  />

                  {/* Path glow overlay */}
                  {isPath && (
                    <rect
                      x={x + 2}
                      y={y + 2}
                      width={cellSize - 4}
                      height={cellSize - 4}
                      rx="6"
                      fill="rgba(6, 182, 212, 0.25)"
                      stroke="#06b6d4"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* SOS indicator */}
                  {isSOS && (
                    <>
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={cellSize - 4}
                        height={cellSize - 4}
                        rx="6"
                        fill="rgba(239, 68, 68, 0.3)"
                        className="cell-hot"
                      />
                      <text
                        x={x + cellSize / 2}
                        y={y + cellSize / 2 - 6}
                        textAnchor="middle"
                        fill="#ef4444"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        🚨
                      </text>
                    </>
                  )}

                  {/* Cell label */}
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + (cell.cell_type === 'gate' ? -4 : 2)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={cell.density > 0.6 ? '#fff' : '#cbd5e1'}
                    fontSize={cell.cell_type === 'seat' ? '9' : '12'}
                    fontFamily="Inter, system-ui"
                    fontWeight={cell.cell_type === 'gate' ? '700' : '500'}
                  >
                    {cell.cell_type === 'gate' ? '🚪' : cell.seat_id || '·'}
                  </text>

                  {/* Density value */}
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize - 8}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.4)"
                    fontSize="7"
                    fontFamily="Inter, system-ui"
                  >
                    {cell.density.toFixed(2)}
                  </text>
                </g>
              );
            })
          )}

          {/* Draw path lines */}
          {path && path.length > 1 && (
            <polyline
              points={path
                .map(
                  (p) =>
                    `${padding + p.col * (cellSize + gap) + cellSize / 2},${
                      padding + p.row * (cellSize + gap) + cellSize / 2
                    }`
                )
                .join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 4"
              opacity="0.8"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="24"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </polyline>
          )}

          {/* Path start marker */}
          {path && path.length > 0 && (
            <>
              <circle
                cx={padding + path[0].col * (cellSize + gap) + cellSize / 2}
                cy={padding + path[0].row * (cellSize + gap) + cellSize / 2}
                r="6"
                fill="#06b6d4"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={padding + path[path.length - 1].col * (cellSize + gap) + cellSize / 2}
                cy={padding + path[path.length - 1].row * (cellSize + gap) + cellSize / 2}
                r="8"
                fill="#d946ef"
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={padding + path[path.length - 1].col * (cellSize + gap) + cellSize / 2}
                y={padding + path[path.length - 1].row * (cellSize + gap) + cellSize / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize="8"
                fontWeight="bold"
              >
                📍
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
