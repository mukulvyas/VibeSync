import React from 'react';

/**
 * AttendeeFocus — The left sidebar for Sentinel Command.
 * Focused shortcuts for Washroom, Food, and Seat guidance.
 */

export default function AttendeeFocus({ onAction, proximities, attendeeOnly, focused }) {
  const p = proximities || {};

  return (
    <div className="space-y-6">
      {/* Hero Header for Home Tab */}
      {!focused && (
        <div className="flex flex-col gap-1 px-2">
           <h3 className="text-[11px] font-black tracking-widest text-[#F59E0B] uppercase font-heading">Venue Insights</h3>
           <p className="text-2xl font-black text-white tracking-tight">Sentinel Command</p>
        </div>
      )}

      <div className="space-y-5">
        <FocusCard 
          type="ROUTE"
          icon="💺" 
          title="Your Route" 
          sub="SEC-104 Entrance"
          status="Priority"
          metrics={{ primary: 'Row 12', secondary: 'Gate N2' }}
          onClick={() => onAction('GUIDE_SEAT')}
          actionText="Start Navigation"
        />

        <FocusCard 
          type="POI"
          icon="🚻" 
          title="Washroom" 
          sub={p.WASHROOM?.label || "Hub 08"}
          status="2m wait"
          metrics={{ primary: `${p.WASHROOM?.meters || 0}m`, secondary: `${p.WASHROOM?.minutes || 0} min` }}
          onClick={() => onAction('POI_WASHROOM')}
          theme="blue"
        />

        <FocusCard 
          type="POI"
          icon="💧" 
          title="Hydration Hub" 
          sub={p.HYDRATION?.label || "Water Station"}
          status="No wait"
          metrics={{ primary: `${p.HYDRATION?.meters || 0}m`, secondary: `Clear` }}
          onClick={() => onAction('POI_HYDRATION')}
          theme="cyan"
        />
      </div>
    </div>
  );
}

function FocusCard({ type, icon, title, sub, status, metrics, onClick, actionText = "Get Directions", theme }) {
  const isRoute = type === 'ROUTE';
  
  return (
    <div className={`group relative transition-all duration-300 ${isRoute ? 'card-route-gradient' : ''}`}>
      <div className="bg-[#111827] border border-white/5 p-6 rounded-[24px] space-y-4 shadow-xl active:scale-[0.98] border-b-2 border-b-white/5 group-hover:border-b-accent-primary/20 transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex gap-4 items-center">
            {isRoute ? (
              <div className="w-14 h-14 rounded-2xl bg-[#1F2937] flex items-center justify-center text-2xl shadow-lg">{icon}</div>
            ) : (
              <div className={theme === 'cyan' ? 'circle-icon-cyan' : 'circle-icon-blue'}>{icon}</div>
            )}
            <div className="flex flex-col">
              <h4 className="text-base font-black text-white leading-none mb-1">{title}</h4>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">{sub}</p>
            </div>
          </div>
          
          {isRoute ? (
            <span className="badge-priority">PRIORITY</span>
          ) : (
            <span className={status === 'No wait' ? 'badge-wait-green' : 'badge-wait-orange'}>
               <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1" />
               {status}
            </span>
          )}
        </div>

        <div className="flex justify-between items-end pt-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-0.5">{isRoute ? 'Location' : 'Distance'}</span>
            <p className="text-xl font-black text-white font-data">{metrics.primary}</p>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-0.5">{isRoute ? 'Access' : 'Estimated Time'}</span>
            <p className="text-xl font-black text-[#F59E0B] font-data">{metrics.secondary}</p>
          </div>
        </div>

        <button 
          onClick={onClick} 
          className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
            isRoute ? 'bg-[#3B82F6] text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)]' : 'bg-white/5 text-white border border-white/5 hover:bg-white/10'
          }`}
        >
          {actionText}
          <span className="nav-arrow-slide text-lg">→</span>
        </button>
      </div>
    </div>
  );
}
