import { useEffect, useRef } from 'react';

/**
 * AgentLog — Terminal-style scrolling log showing agent "thoughts".
 */
export default function AgentLog({ logs = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  function agentColor(agent) {
    switch (agent) {
      case 'FlowAgent': return '#06b6d4';   // cyan
      case 'SyncAgent': return '#d946ef';    // magenta
      case 'Guardian':  return '#ef4444';    // red
      default:          return '#64748b';
    }
  }

  function levelBg(level) {
    switch (level) {
      case 'critical': return 'rgba(239,68,68,0.08)';
      case 'warning':  return 'rgba(245,158,11,0.06)';
      default:         return 'transparent';
    }
  }

  function levelBorder(level) {
    switch (level) {
      case 'critical': return 'rgba(239,68,68,0.3)';
      case 'warning':  return 'rgba(245,158,11,0.2)';
      default:         return 'transparent';
    }
  }

  return (
    <div className="neural-link-panel flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-cyan-400/70">
          Agent Neural Link
        </span>
        <div className="ml-auto flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
        </div>
      </div>

      {/* Terminal log */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1 font-mono text-[11px] leading-relaxed"
        style={{ maxHeight: '400px' }}
      >
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-xs tracking-widest uppercase">Awaiting agent signals...</p>
            <div className="mt-2 flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-cyan-500/40 animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          logs.map((log, i) => {
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
              hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            return (
              <div
                key={`${log.timestamp}-${i}`}
                className="flex gap-2 py-1.5 px-2 rounded-md transition-all duration-300"
                style={{
                  background: levelBg(log.level),
                  borderLeft: `2px solid ${levelBorder(log.level)}`,
                  animation: i === 0 ? 'logSlideIn 0.3s ease-out' : undefined,
                }}
              >
                <span className="text-gray-600 shrink-0 tabular-nums">{time}</span>
                <span
                  className="shrink-0 font-bold"
                  style={{ color: agentColor(log.agent), minWidth: '72px' }}
                >
                  [{log.agent}]
                </span>
                <span className={`${
                  log.level === 'critical' ? 'text-red-300' :
                  log.level === 'warning' ? 'text-amber-300/80' :
                  'text-gray-400'
                }`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
