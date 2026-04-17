import React from 'react';

/**
 * ZoneStatusList — Displays real-time status of stadium gates and sectors.
 * Used in the right sidebar of the Tactical OS (Staff Mode).
 */
export default function ZoneStatusList({ venueData }) {
  const zones = [
    { id: 'GATE_ALFA', sub: 'ENTRY_MAIN', status: 'NOMINAL', color: 'var(--cyan-tactical)' },
    { id: 'SEC_NORTH_B', sub: 'STAIRWELL_4', status: 'CONGESTION_MID', color: 'var(--amber-tactical)' },
    { id: 'VIP_LEVEL_2', sub: 'LOUNGE_ALPHA', status: 'NOMINAL', color: 'var(--cyan-tactical)' },
    { id: 'PARKING_WEST', sub: 'ZONE_E_EXIT', status: 'STALLED_EXIT', color: 'var(--red-tactical)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4 border-b border-border-dim pb-2">
         <span className="text-[10px] font-bold tracking-[0.2em] text-text-dim uppercase">ZONE_STATUS_MAP</span>
         <span className="text-[9px] font-mono text-[#5a7a8a]">7/7 ONLINE</span>
      </div>

      <div className="space-y-3">
        {zones.map(zone => (
          <div key={zone.id} className="p-3 bg-bg-panel/40 border-l-2 border-border-dim hover:bg-bg-panel/60 transition-all cursor-pointer">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <h3 className="text-[11px] font-bold tracking-widest text-white uppercase">{zone.id}</h3>
                <p className="text-[9px] font-mono text-text-dim uppercase">{zone.sub}</p>
              </div>
              <span className="text-[9px] font-bold tracking-widest" style={{ color: zone.color }}>{zone.status}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-8">
         <div className="flex justify-between items-center mb-4 border-b border-border-dim pb-2">
            <span className="text-[10px] font-bold tracking-[0.2em] text-text-dim uppercase">COMMAND_LOGS</span>
            <span className="text-[9px] font-mono text-[#5a7a8a]">T7Y_01</span>
         </div>
         <div className="h-40 bg-bg-space/80 border border-border-dim p-3 overflow-hidden relative">
            <div className="scanner-effect opacity-10" />
            <div className="space-y-2">
               <LogLine time="09:44:21" text="CONNECTION_STABLE" color="var(--cyan-tactical)" />
               <LogLine time="09:44:24" text="BOTTLENECK_MITIGATED @ GATE_4" color="var(--cyan-tactical)" />
               <LogLine time="09:44:30" text="UNRECOGNIZED_ID @ SEC_101" color="var(--red-tactical)" />
               <LogLine time="09:44:35" text="DATA_SYNC_COMPLETE" color="var(--cyan-tactical)" />
            </div>
         </div>
      </div>
    </div>
  );
}

function LogLine({ time, text, color }) {
  return (
    <div className="flex gap-2 text-[9px] font-mono opacity-80 animate-[logSlideIn_0.3s_ease-out]">
       <span className="text-text-dim">[{time}]</span>
       <span className="text-text-dim"> &gt;&gt; </span>
       <span style={{ color }}>{text}</span>
    </div>
  );
}
