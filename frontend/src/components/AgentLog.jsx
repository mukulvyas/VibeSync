import { useEffect, useRef } from 'react';

/**
 * AgentLog — Transparent glass overlay terminal showing agent "thoughts".
 */
function agentColor(agent) {
  switch (agent) {
    case 'FLOW_AGENT': return '#00D4FF';
    case 'SYNC_AGENT': return '#9C88FF';
    case 'GUARDIAN':   return '#FF4757';
    default:           return '#64748b';
  }
}

function agentInitials(agent) {
  switch (agent) {
    case 'FLOW_AGENT': return 'FA';
    case 'SYNC_AGENT': return 'SA';
    case 'GUARDIAN':   return 'GD';
    default:           return 'AI';
  }
}

function levelStyle(level) {
  switch (level) {
    case 'critical': return { bg: 'rgba(255,71,87,0.06)', border: 'rgba(255,71,87,0.25)' };
    case 'warning':  return { bg: 'rgba(255, 165, 2, 0.04)', border: 'rgba(255, 165, 2, 0.2)' };
    default:         return { bg: 'transparent', border: 'transparent' };
  }
}

export default function AgentLog({ logs = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [logs]);

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden h-full bg-[#1C2333]/30 border border-white/5">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-[#0A0E1A]/40">
        <div className="w-2 h-2 rounded-full bg-cyan-tactical shadow-[0_0_10px_#00d4ff] animate-pulse" />
        <span className="text-[10px] font-black tracking-[0.2em] uppercase font-heading text-white/60">
          Agent Intel Stream
        </span>
      </div>

      {/* Modern Chat Interface */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6 font-data"
        style={{ maxHeight: '500px' }}
      >
        {logs.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-white/10 border-t-cyan-tactical rounded-full animate-spin" />
            <p className="text-text-dim text-[10px] tracking-[0.1em] font-heading">Establishing secure link...</p>
          </div>
        ) : (
          logs.map((log, i) => {
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
              hour12: false, hour: '2-digit', minute: '2-digit'
            });
            const color = agentColor(log.agent);
            const agentName = log.agent === 'FLOW_AGENT' ? 'Flow Agent' : 
                             log.agent === 'SYNC_AGENT' ? 'Sync Agent' : 
                             log.agent === 'GUARDIAN' ? 'Guardian' : 'Core AI';

            return (
              <div key={`${log.timestamp}-${i}`} className="flex items-start gap-4 group">
                <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold shadow-2xl transition-transform hover:scale-110" style={{ backgroundColor: color }}>
                  <span className="text-black/80">{agentInitials(log.agent)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-bold text-xs font-heading text-white/90">{agentName}</span>
                    <span className="text-[9px] text-text-dim/50 font-data">{time}</span>
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-none bg-[#1C2333] border border-white/5 shadow-sm inline-block max-w-full">
                    <p className={`text-[11px] leading-relaxed font-medium ${
                      log.level === 'critical' ? 'text-red-tactical' :
                      log.level === 'warning' ? 'text-amber-tactical' :
                      'text-white/80'
                    }`}>
                      {log.message.startsWith('>>') ? (
                        <>
                          <span className="text-cyan-tactical font-black mr-1 leading-none">&raquo;</span>
                          {log.message.slice(2)}
                        </>
                      ) : log.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
