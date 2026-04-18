import React from 'react';

/**
 * AttendeeFocus — The left sidebar for Sentinel Command.
 * Focused shortcuts for Washroom, Food, and Seat guidance.
 */

export default function AttendeeFocus({ onAction, proximities }) {
  const p = proximities || {};

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-1 px-2">
         <h3 className="text-[11px] font-black tracking-widest text-[#F59E0B] uppercase font-heading">Venue Insights</h3>
         <p className="text-xl font-bold text-white tracking-tight">Real-time nearby explorer</p>
      </div>

      <div className="space-y-8">
        <FocusCard 
          icon="🚻" 
          title="Washroom" 
          sub={p.WASHROOM?.label || "Hub 08"}
          status="Moderate"
          metrics={{ distance: `${p.WASHROOM?.meters || 0}m`, stat: `${p.WASHROOM?.minutes || 0} min` }}
          onClick={() => onAction('POI_WASHROOM')}
          color="bg-ios-blue"
        />

        <FocusCard 
          icon="💧" 
          title="Hydration" 
          sub={p.HYDRATION?.label || "Water Station"}
          status="Optimal"
          metrics={{ distance: `${p.HYDRATION?.meters || 0}m`, stat: `Clear` }}
          onClick={() => onAction('POI_HYDRATION')}
          color="bg-ios-blue"
        />

        <FocusCard 
          icon="💺" 
          title="Your Route" 
          sub="SEC-104 Entrance"
          status="Priority"
          metrics={{ distance: 'Row 12', stat: 'Gate N2' }}
          onClick={() => onAction('GUIDE_SEAT')}
          actionText="Start Navigation"
          color="bg-ios-blue"
        />
      </div>
    </div>
  );
}

function FocusCard({ icon, title, sub, status, metrics, onClick, actionText = "Get Directions" }) {
  return (
    <div className="group relative transition-all duration-300">
      <div className="bg-[#1F2937] border border-white/5 p-7 rounded-[28px] space-y-5 shadow-2xl overflow-hidden active:scale-[0.98]">
        <div className="flex justify-between items-center">
          <div className="flex gap-5 items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#374151] flex items-center justify-center text-3xl shadow-lg">{icon}</div>
            <div className="flex flex-col">
              <h4 className="text-lg font-bold text-white leading-none mb-1">{title}</h4>
              <p className="text-xs font-medium text-text-dim">{sub}</p>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
            status === 'Optimal' ? 'border-green-400/40 text-green-400' : 
            status === 'Priority' ? 'border-amber-400/40 text-amber-400' : 
            'border-amber-400/20 text-text-dim'
          }`}>
            {status}
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-white/5 pt-5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Estimated Distance</span>
            <p className="text-2xl font-black text-white">{metrics.distance}</p>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Wait Time</span>
            <p className="text-2xl font-black text-[#F59E0B]">{metrics.stat}</p>
          </div>
        </div>

        <button 
          onClick={onClick} 
          className="w-full py-4 ios-btn-blue rounded-2xl text-sm font-bold tracking-wide"
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}
