import React from 'react';

/**
 * AttendeeFocus — The left sidebar for Sentinel Command.
 * Focused shortcuts for Washroom, Food, and Seat guidance.
 */

export default function AttendeeFocus({ onAction, proximities, attendeeOnly, focused }) {
  const p = proximities || {};
  const washroomWait = p.WASHROOM?.wait || "2 min";
  const hydrationWait = p.HYDRATION?.wait || "No wait";
  const foodWait = p.FOOD?.wait || "5 min";

  return (
    <div className="space-y-6">
      {/* Hero Header for Home Tab */}
      {!focused && (
        <div className="flex flex-col gap-1 px-2">
           {window.innerHeight >= 700 && (
             <h3 className="text-[11px] font-black tracking-widest text-[#F59E0B] uppercase font-heading">Venue Insights</h3>
           )}
           <p className={`font-black text-white tracking-tight ${window.innerHeight < 700 ? 'text-[22px]' : 'text-2xl'}`}>
             Sentinel Command
           </p>
        </div>
      )}

      <div className="space-y-5">
        <FocusCard 
          type="ROUTE"
          icon="💺" 
          title="Exit Route" 
          sub="From Seat 43"
          status="Priority"
          metrics={{ primary: 'Row 12', secondary: 'Gate S2' }}
          onClick={() => onAction('GUIDE_SEAT')}
          actionText="Start Navigation"
        />

        {!focused && (
          <NearbyCard
            washroom={{ label: p.WASHROOM?.label || "HUB08", meters: p.WASHROOM?.meters ?? 87, wait: washroomWait }}
            hydration={{ label: p.HYDRATION?.label || "Water Station", meters: p.HYDRATION?.meters ?? 65, wait: hydrationWait }}
          />
        )}

        <FocusCard 
          type="POI"
          icon="🍔"
          title="Food Court"
          sub={p.FOOD?.label || "Food Court"}
          status={foodWait}
          metrics={{ primary: `${p.FOOD?.meters ?? 120}m`, secondary: foodWait }}
          onClick={() => onAction('POI_FOOD')}
          theme="blue"
        />

        {focused && (
          <>
            <FocusCard 
              type="POI"
              icon="🚻" 
              title="Washroom" 
              sub={p.WASHROOM?.label || "HUB08"}
              status={washroomWait}
              metrics={{ primary: `${p.WASHROOM?.meters ?? 87}m`, secondary: washroomWait }}
              onClick={() => onAction('POI_WASHROOM')}
              theme="blue"
            />

            <FocusCard 
              type="POI"
              icon="💧" 
              title="Hydration Hub" 
              sub={p.HYDRATION?.label || "Water Station"}
              status={hydrationWait}
              metrics={{ primary: `${p.HYDRATION?.meters ?? 65}m`, secondary: hydrationWait }}
              onClick={() => onAction('POI_HYDRATION')}
              theme="cyan"
            />
          </>
        )}
      </div>
    </div>
  );
}

function NearbyCard({ washroom, hydration }) {
  return (
    <div className="bg-[#111827] border border-white/5 p-6 rounded-[24px] space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-black text-white">Nearby</h4>
        <span className="text-[9px] font-black tracking-[0.2em] uppercase text-text-secondary">
          Quick Access
        </span>
      </div>
      <div className="space-y-3">
        <NearbyRow icon="🚻" name="Washroom" label={washroom.label} distance={`${washroom.meters}m`} wait={washroom.wait} />
        <NearbyRow icon="💧" name="Hydration Hub" label={hydration.label} distance={`${hydration.meters}m`} wait={hydration.wait} />
      </div>
    </div>
  );
}

function NearbyRow({ icon, name, label, distance, wait }) {
  return (
    <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-xs font-black text-white leading-none">{name}</p>
          <p className="text-[10px] text-text-secondary uppercase tracking-wide mt-1">{label}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-white font-data">{distance}</p>
        <p className="text-[10px] text-[#F59E0B] font-bold">{wait}</p>
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
