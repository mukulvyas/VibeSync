import React from 'react';

/**
 * AttendeeFocus — The left sidebar for Sentinel Command.
 * Focused shortcuts for Washroom, Food, and Seat guidance.
 */
export default function AttendeeFocus({ onAction }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold tracking-widest text-[#00d2ff]">ATTENDEE FOCUS</h2>
        <span className="text-[10px] text-text-dim tracking-tighter uppercase">SECTOR ALPHA</span>
      </div>

      <div className="space-y-4">
        <FocusCard 
          icon="🚻" 
          title="FIND WASHROOM" 
          sub="Restroom Hub 08 • Level 2"
          status="MODERATE"
          metrics={{ distance: '3m away', stat: '40% occupancy' }}
          onClick={() => onAction('POI_WASHROOM')}
        />

        <FocusCard 
          icon="🍴" 
          title="FIND FOOD" 
          sub="Signature Grill & Brew"
          status="5 MIN WAIT"
          metrics={{ distance: 'Kiosk 04', stat: 'Near Path' }}
          onClick={() => onAction('POI_FOOD')}
        />

        <FocusCard 
          icon="💺" 
          title="FIND SEAT" 
          sub="Gate North Entrance"
          status="ASSIGNED: SEC-104"
          metrics={{ distance: 'Row 12', stat: 'Seat A-24' }}
          onClick={() => onAction('GUIDE_SEAT')}
          actionText="START GUIDANCE"
        />
      </div>

      <div className="pt-4 border-t border-border-dim">
         <p className="text-[9px] font-mono tracking-widest text-text-dim mb-2 uppercase">SYSTEM NEURAL LOAD</p>
         <div className="h-1 w-full bg-bg-panel relative overflow-hidden">
            <div className="h-full bg-cyan-tactical animate-pulse" style={{ width: '24%' }} />
         </div>
         <p className="text-[8px] font-mono text-cyan-tactical mt-1 text-right">24%</p>
      </div>
    </div>
  );
}

function FocusCard({ icon, title, sub, status, metrics, onClick, actionText }) {
  return (
    <div className="metric-card group transition-all duration-500 hover:border-cyan-tactical cursor-pointer" onClick={onClick}>
      <div className="flex gap-4 items-start mb-3">
        <div className="w-10 h-10 bg-bg-space border border-border-dim flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-[11px] font-bold tracking-widest text-white group-hover:text-cyan-tactical transition-colors uppercase">{title}</h3>
            {status && <span className="text-[9px] font-bold text-amber-tactical tracking-tighter">{status}</span>}
          </div>
          <p className="text-[10px] text-text-dim mt-0.5">{sub}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-3 border-y border-border-dim/50 mb-3">
        <div className="space-y-0.5">
          <p className="text-[8px] font-mono text-text-dim uppercase">Distance/Wait</p>
          <p className="text-xs font-bold text-white uppercase">{metrics.distance}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[8px] font-mono text-text-dim uppercase">Occupancy/Info</p>
          <p className="text-xs font-bold text-white uppercase">{metrics.stat}</p>
        </div>
      </div>

      {actionText && (
        <button className="btn-tactical w-full py-1.5 opacity-50 group-hover:opacity-100">
           {actionText}
        </button>
      )}
    </div>
  );
}
