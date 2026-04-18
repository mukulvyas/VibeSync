import React from 'react';

/**
 * AttendeeFocus — The left sidebar for Sentinel Command.
 * Focused shortcuts for Washroom, Food, and Seat guidance.
 */

export default function AttendeeFocus({ onAction, proximities }) {
  const p = proximities || {};

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
         <h3 className="text-[10px] font-black tracking-[0.4em] text-cyan-tactical uppercase">EXPRESS_ACTIONS</h3>
         <p className="text-xs text-text-dim uppercase font-bold tracking-widest">Real-time venue intelligence</p>
      </div>

      <div className="space-y-6">
        <FocusCard 
          icon="🚻" 
          title="FIND_WASHROOM" 
          sub={p.WASHROOM?.label || "HUB_08"}
          status="MODERATE"
          metrics={{ distance: `${p.WASHROOM?.meters || 0}m`, stat: `${p.WASHROOM?.minutes || 0}m wait` }}
          onClick={() => onAction('POI_WASHROOM')}
          progress={45}
        />

        <FocusCard 
          icon="💧" 
          title="HYDRATION_HUB" 
          sub={p.HYDRATION?.label || "WATER_STAT"}
          status="OPTIMAL"
          metrics={{ distance: `${p.HYDRATION?.meters || 0}m`, stat: `No wait` }}
          onClick={() => onAction('POI_HYDRATION')}
          progress={10}
        />

        <FocusCard 
          icon="💺" 
          title="RE-ROUTE_SEAT" 
          sub="SEC-104 Entrance"
          status="PRIORITY"
          metrics={{ distance: 'Row 12', stat: 'Gate N2' }}
          onClick={() => onAction('GUIDE_SEAT')}
          actionText="START_PATH"
        />
      </div>
    </div>
  );
}

function FocusCard({ icon, title, sub, status, metrics, onClick, actionText = "GET_DIRECTION", progress }) {
  return (
    <div className="group relative transition-all duration-300 transform active:scale-95">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-tactical/20 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative glass-tactical border border-white/5 p-6 rounded-2xl space-y-4 hover:border-cyan-tactical/40 transition-all overflow-hidden bg-white/5 backdrop-blur-3xl shadow-2xl">
        <div className="flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 rounded-xl bg-black/40 flex items-center justify-center text-3xl shadow-inner border border-white/5">{icon}</div>
            <div className="flex flex-col">
              <h4 className="text-sm font-black tracking-widest text-white uppercase">{title}</h4>
              <p className="text-[10px] font-bold text-text-dim tracking-wider">{sub}</p>
            </div>
          </div>
          <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${status === 'OPTIMAL' ? 'border-green-400/40 text-green-400 bg-green-400/5' : status === 'PRIORITY' ? 'border-cyan-tactical text-cyan-tactical bg-cyan-tactical/5' : 'border-amber-400/40 text-amber-400 bg-amber-400/5'}`}>
            {status}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-text-dim uppercase tracking-widest mb-1">PROXIMITY</span>
            <p className="text-sm font-mono font-bold text-white">{metrics.distance}</p>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-black text-text-dim uppercase tracking-widest mb-1">TELEMETRY</span>
            <p className="text-sm font-mono font-bold text-cyan-tactical">{metrics.stat}</p>
          </div>
        </div>

        {progress !== undefined && (
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div className={`h-full transition-all duration-1000 ${progress > 70 ? 'bg-red-400' : progress > 30 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${progress}%` }} />
          </div>
        )}

        <button 
          onClick={onClick} 
          className="w-full py-3.5 bg-white text-black text-[10px] font-black tracking-[0.2em] rounded-xl hover:bg-cyan-tactical hover:text-[#010409] transition-all shadow-xl"
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}
