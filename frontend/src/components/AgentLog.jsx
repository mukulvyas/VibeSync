import { useEffect, useRef, useState } from 'react';

const STREAM_MESSAGES = [
  {
    id: "m1",
    agent: "Guardian",
    initials: "GB",
    avatar: "#10B981",
    timestamp: "09:31",
    text: "SECTORS CLEAR. Biometric scanning nominal.",
  },
  {
    id: "m2",
    agent: "Sync Agent",
    initials: "SA",
    avatar: "#3B82F6",
    timestamp: "17:23",
    text: "Gate S2 crowd density at 78%. Deploying voucher IB_295.",
  },
  {
    id: "m3",
    agent: "Flow Agent",
    initials: "FA",
    avatar: "#F59E0B",
    timestamp: "17:25",
    text: "THERMAL ANOMALY near North Stand. Rerouting flow via East corridor.",
  },
  {
    id: "m4",
    agent: "Flow Agent",
    initials: "FA",
    avatar: "#F59E0B",
    timestamp: "17:26",
    text: "BOTTLENECK cleared at Gate N1. Dynamic path active.",
  },
];

export default function AgentLog({ logs = [] }) {
  const scrollRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(STREAM_MESSAGES.length);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, visibleCount]);

  const renderedLogs = logs.length > 0 ? logs : STREAM_MESSAGES.slice(0, visibleCount);

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
        {renderedLogs.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-white/10 border-t-cyan-tactical rounded-full animate-spin" />
            <p className="text-text-dim text-[10px] tracking-[0.1em] font-heading">Streaming agent telemetry...</p>
          </div>
        ) : (
          renderedLogs.map((log, index) => {
            return (
              <div
                key={log.id}
                className={`flex items-start gap-4 group agent-log-entry ${index >= 4 ? "agent-log-entry-fade" : ""}`}
              >
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold shadow-2xl transition-transform hover:scale-110"
                  style={{ backgroundColor: log.avatar }}
                >
                  <span className="text-black/80">{log.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="font-bold text-xs font-heading text-white/90">{log.agent}</span>
                    <span className="text-[9px] text-text-dim/50 font-data">{log.timestamp}</span>
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-none bg-[#1C2333] border border-white/5 shadow-sm inline-block max-w-full">
                    <p className="text-[11px] leading-relaxed font-medium text-white/80">
                      {log.text}
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
