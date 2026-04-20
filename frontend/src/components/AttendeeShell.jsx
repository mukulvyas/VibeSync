import VibeMap from "./VibeMap";
import AttendeeFocus from "./AttendeeFocus";
import AtmosphereMetrics from "./AtmosphereMetrics";
import AgentLog from "./AgentLog";
import AIInsightDrawer from "./AIInsightDrawer";
import StadiumUpdates from "./StadiumUpdates";

export default function AttendeeShell({
  mobileTab,
  setMobileTab,
  matchState,
  time,
  proximities,
  handleAction,
  standCapacities,
  path,
  sosAlerts,
  userPos,
  showHeatmap,
  setShowHeatmap,
  lastEvent,
  liveAgentLogs,
  isInsightOpen,
  setIsInsightOpen,
  navGuide,
  setNavGuide,
  renderAdminToggle,
  medicalStatus,
  handleMedicalSOS,
  seatInfo,
}) {
  return (
    <div className="app-shell-centered theme-attendee">
      <header className="mobile-status-bar font-data">
        <div className="attendee-shell-inner mobile-status-bar-inner">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[8px] text-text-secondary uppercase tracking-[0.2em] font-black opacity-60">Your Location</span>
            <span className="block text-[10px] text-white font-bold tracking-tight whitespace-normal break-words">
              {seatInfo
                ? `${seatInfo.stand.label} · Row ${seatInfo.row} · Seat ${seatInfo.seat}`
                : "SEC-SOUTH · Row 12 · Seat 43"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {renderAdminToggle(true)}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[9px] font-black text-white tracking-[0.2em]">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mobile-content-scroller no-scrollbar">
        <div className="attendee-shell-inner">
          {mobileTab === "HOME" && (
            <div className="py-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full overflow-hidden">
              <div className="relative p-6 rounded-[24px] overflow-hidden border border-white/5 bg-gradient-to-br from-[#0E1623] to-[#162030] space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-black tracking-[0.18em] text-[#F59E0B] uppercase">IND vs AUS · T20 · Live</p>
                    <p className="mt-3 text-3xl font-black text-white font-data tracking-tight">
                      {matchState.batting_team} {matchState.score}/{matchState.wickets} ({matchState.overs.toFixed(1)} ov)
                    </p>
                  </div>
                  <span className="text-[11px] text-text-secondary font-bold">29degC · Clear sky</span>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary font-black">Match Clock</span>
                  <span className="font-data text-3xl font-black text-white tracking-widest">
                    {String(Math.floor(time / 60)).padStart(2, "0")}:{String(time % 60).padStart(2, "0")}
                  </span>
                </div>
              </div>

              <AtmosphereMetrics noise={matchState.noise_db} aqi="Moderate" wifi="Optimal" />

              {/* MEDICAL SOS BLOCK */}
              <div className="px-2 pb-2" aria-live="polite" aria-atomic="true">
                {medicalStatus === "resolved" ? (
                  <div className="p-4 rounded-[20px] bg-green-500/10 border border-green-500/20 flex items-center justify-start gap-4" role="status">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl" aria-hidden="true">✅</div>
                    <div>
                      <p className="text-[12px] font-black text-green-400 uppercase tracking-[0.1em]">Assistance Complete</p>
                      <p className="text-[10px] text-green-500/80 mt-0.5">Staff have concluded at your seat.</p>
                    </div>
                  </div>
                ) : medicalStatus === "pending" ? (
                  <div className="p-4 rounded-[20px] bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-start gap-4 shadow-[0_0_15px_rgba(245,158,11,0.1)]" role="status">
                    <div className="w-10 h-10 rounded-full bg-[#F59E0B]/20 flex items-center justify-center text-xl animate-pulse" aria-hidden="true">⏳</div>
                    <div>
                      <p className="text-[12px] font-black text-[#F59E0B] uppercase tracking-[0.1em]">Team Dispatched</p>
                      <p className="text-[10px] text-[#F59E0B]/80 mt-0.5">Help is on the way to your seat.</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleMedicalSOS}
                    className="w-full relative group overflow-hidden p-4 rounded-[20px] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 transition-all flex items-center justify-start gap-4 active:scale-[0.98]"
                    aria-label="Request medical assistance at your seat"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#EF4444]/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform" aria-hidden="true">🚨</div>
                    <div className="text-left">
                      <p className="text-[12px] font-black text-[#EF4444] uppercase tracking-[0.1em] leading-none">Medical Assistance</p>
                      <p className="text-[10px] font-bold text-[#EF4444]/70 mt-1">Tap for immediate seat support</p>
                    </div>
                  </button>
                )}
              </div>

              <AttendeeFocus attendeeOnly proximities={proximities} onAction={handleAction} seatInfo={seatInfo} />
            </div>
          )}

          {mobileTab === "MAP" && (
            <div className="flex flex-col h-[calc(100dvh-112px)] relative animate-in fade-in duration-500 overflow-hidden">
              <div className="flex-shrink-0 h-[44px] px-4 flex items-center">
                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-xl">
                  <button
                    type="button"
                    className="w-10 h-5 bg-white/10 rounded-full relative p-0.5 cursor-pointer border-0"
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    aria-pressed={showHeatmap}
                    aria-label={showHeatmap ? "Heat map on" : "Heat map off"}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                        showHeatmap ? "translate-x-5 bg-cyan-tactical" : "translate-x-0 bg-text-dim"
                      }`}
                    />
                  </button>
                  <span className="text-[8px] font-black tracking-widest text-white/60 mr-2 uppercase">Heatmap</span>
                </div>
              </div>
              <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden">
                <VibeMap
                  venueData={null}
                  standCapacities={standCapacities}
                  path={path}
                  sosAlerts={sosAlerts}
                  attendeeMode={true}
                  userPos={userPos}
                  incentives={[]}
                  showHeatmap={showHeatmap}
                  lastEvent={lastEvent}
                  containerHeight="fill"
                />
                
                {/* Repositioned Legend Card */}
                <div className="absolute top-[60px] right-[20px] z-[50] w-[180px] p-4 rounded-[20px] bg-[#1F2937]/90 border border-white/10 shadow-2xl backdrop-blur-md scale-90 origin-top-right">
                   <h4 className="text-[8px] font-black tracking-widest uppercase mb-2 text-[#F59E0B]">Live Crowd Flow</h4>
                   <div className="space-y-2">
                     <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-blue-500" />
                       <span className="text-white/80 text-[9px] font-bold">Empty Seats</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                       <span className="text-white/80 text-[9px] font-bold">Starting to Fill</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-red-500" />
                       <span className="text-white/80 text-[9px] font-bold">At Peak</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {mobileTab === "FIND" && (
            <div className="py-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-white px-2">Find Amenities</h2>
              <AttendeeFocus onAction={handleAction} proximities={proximities} focused={true} seatInfo={seatInfo} />
            </div>
          )}

          {mobileTab === "ALERTS" && (
            <div className="py-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-white px-2">Updates</h2>
              <StadiumUpdates 
                venueState={{
                  north: matchState.capacity.north,
                  south: matchState.capacity.south,
                  east: matchState.capacity.east,
                  west: matchState.capacity.west,
                  noise_db: matchState.noise_db
                }}
                lastEvent={lastEvent}
              />
            </div>
          )}
        </div>
      </div>

      <nav className="bottom-tabs">
        <div className="attendee-shell-inner bottom-tabs-inner">
          <MobileTabItem icon="🏠" label="Home" active={mobileTab === "HOME"} onClick={() => setMobileTab("HOME")} />
          <MobileTabItem icon="🗺️" label="Map" active={mobileTab === "MAP"} onClick={() => setMobileTab("MAP")} />
          <MobileTabItem icon="🔍" label="Find" active={mobileTab === "FIND"} onClick={() => setMobileTab("FIND")} />
          <MobileTabItem icon="🔔" label="Alerts" active={mobileTab === "ALERTS"} onClick={() => setMobileTab("ALERTS")} />
        </div>
      </nav>

      <AIInsightDrawer 
        isOpen={isInsightOpen} 
        onClose={() => setIsInsightOpen(false)} 
        attendeeMode={true}
        matchState={matchState}
        seatInfo={seatInfo}
      />
      {navGuide && <NavigationGuideModal guide={navGuide} onClose={() => setNavGuide(null)} />}

      <button
        type="button"
        onClick={() => setIsInsightOpen(true)}
        className="fixed bottom-[90px] right-4 z-[500] fab-ai"
        style={{ left: "auto" }}
        title="AI Insights available"
        aria-label="Open AI insights"
      >
        <span className="text-2xl" aria-hidden>
          ✦
        </span>
      </button>
    </div>
  );
}

function NavigationGuideModal({ guide, onClose }) {
  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-20">
      <div className="w-full max-w-[480px] p-5 rounded-[24px] border border-white/10 bg-[#0E1623] shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-[#F59E0B] uppercase">AI Route Suggestion</p>
            <h3 className="text-lg font-black text-white mt-1">{guide.destination}</h3>
            <p className="text-[11px] text-text-secondary mt-1">Estimated walk: {guide.eta}</p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-white/5 text-white border border-white/10"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="rounded-xl bg-[#111827] border border-white/10 p-3">
          <p className="text-[10px] text-[#8BA3C4] uppercase tracking-widest font-black">Why this route</p>
          <p className="text-[11px] text-white/85 mt-1 leading-relaxed">{guide.reason}</p>
        </div>
        <div className="space-y-2">
          {guide.steps.map((step, index) => (
            <div key={`${guide.id}-${index}`} className="flex gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-[#1F2937] text-[10px] font-black text-[#F59E0B] flex items-center justify-center">
                {index + 1}
              </span>
              <p className="text-[11px] leading-relaxed text-white/85">{step}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="w-full py-3 rounded-xl bg-[#3B82F6] text-white text-[11px] font-black tracking-[0.15em] uppercase"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function MobileTabItem({ icon, label, active, onClick }) {
  return (
    <div
      className={`tab-item ${active ? "active" : ""}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="tab"
      tabIndex={0}
      aria-selected={active}
    >
      <span className="tab-icon text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="tab-label">{label}</span>
      {active && <div className="tab-indicator" />}
    </div>
  );
}
