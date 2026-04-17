import { useEffect, useRef } from 'react';

/**
 * AgentLog — Transparent glass overlay terminal showing agent "thoughts".
 */
export default function AgentLog({ logs = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [logs]);

  function agentColor(agent) {
    switch (agent) {
      case 'FLOW_AGENT': return '#06b6d4';
      case 'SYNC_AGENT': return '#d946ef';
      case 'GUARDIAN':   return '#ef4444';
      default:           return '#64748b';
    }
  }

  function levelStyle(level) {
    switch (level) {
      case 'critical': return { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.25)' };
      case 'warning':  return { bg: 'rgba(245,158,11,0.04)', border: 'rgba(245,158,11,0.2)' };
      default:         return { bg: 'transparent', border: 'transparent' };
    }
  }

  return (
    <div className="neural-glass-panel flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="w-2 h-2 rounded-none bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: '#06b6d4' }}>
          AURA-CORE: NEURAL INTERCEPT
        </span>
        <div className="ml-auto flex gap-1.5">
          <span className="w-1.5 h-1.5 bg-cyan-500/50" />
          <span className="w-1.5 h-1.5 bg-cyan-500/50" />
          <span className="w-1.5 h-1.5 bg-cyan-500/50" />
        </div>
      </div>

      {/* Terminal log */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5"
        style={{ maxHeight: '380px', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-[10px] tracking-widest uppercase">Awaiting intercept...</p>
            <div className="mt-2 flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1 h-1 rounded-none bg-cyan-500/30 animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s` }} />
              ))}
            </div>
          </div>
        ) : (
          logs.map((log, i) => {
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
              hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const style = levelStyle(log.level);
            return (
              <div
                key={`${log.timestamp}-${i}`}
                className="flex gap-2 py-1.5 px-2 rounded-none transition-all duration-300 text-[10px] leading-relaxed"
                style={{
                  background: style.bg,
                  borderLeft: `2px solid ${style.border}`,
                  animation: i === 0 ? 'logSlideIn 0.3s ease-out' : undefined,
                }}
              >
                <span className="text-gray-600 shrink-0 tabular-nums">{time}</span>
                <span className="shrink-0 font-bold" style={{ color: agentColor(log.agent), minWidth: '72px' }}>
                  [{log.agent}]
                </span>
                <span className={`${
                  log.level === 'critical' ? 'text-red-300' :
                  log.level === 'warning' ? 'text-amber-300/80' :
                  'text-gray-400/80'
                }`}>
                  {/* Bold-highlight the ">>" autonomous decision prefix */}
                  {log.message.startsWith('>>') ? (
                    <>
                      <span style={{ color: '#06b6d4', fontWeight: 800 }}>&gt;&gt;</span>
                      {log.message.slice(2)}
                    </>
                  ) : log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
