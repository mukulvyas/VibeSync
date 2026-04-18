import React from 'react';

/**
 * AIInsightDrawer — A floating glassmorphism panel for AI recommendations.
 * Featuring spring physics animation and predictive flow visuals.
 */
export default function AIInsightDrawer({ isOpen, onClose }) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[100] flex justify-center px-4 transition-transform duration-700 spring-drawer-transition ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="w-full max-w-2xl bg-[#1C2333]/80 backdrop-blur-2xl border border-white/10 rounded-t-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Drag Handle */}
        <div className="h-10 flex justify-center items-center cursor-pointer group" onClick={onClose}>
          <div className="w-12 h-1.5 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors" />
        </div>

        <div className="px-8 pb-10 space-y-8">
          {/* Header & Recommendation */}
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-tactical flex items-center justify-center text-black text-2xl shadow-[0_0_20px_rgba(0,212,255,0.4)]">
              ✦
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-bold text-cyan-tactical tracking-widest font-heading uppercase">
                AI Recommendation Engine
              </h3>
              <p className="text-xl font-bold text-white leading-tight">
                AI suggests redirecting <span className="text-cyan-tactical">Gate B</span> crowd to <span className="text-green-tactical">Gate D</span> 
                <br />
                <span className="text-lg opacity-80 text-white">— saves ~4 min avg wait</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Confidence Score */}
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-text-dim font-heading">
                <span>Confidence Score</span>
                <span className="text-cyan-tactical font-data">87.4%</span>
              </div>
              <div className="flex gap-1.5 h-1.5">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-sm ${i < 9 ? 'bg-cyan-tactical shadow-[0_0_8px_rgba(0,212,255,0.5)]' : 'bg-white/5'}`} 
                  />
                ))}
              </div>
            </div>

            {/* Predictive Sparkline Mock */}
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-text-dim font-heading">
                <span>Predicted Flow Delta</span>
                <span className="text-green-tactical font-data">-14% Load</span>
              </div>
              <svg viewBox="0 0 200 30" className="w-full h-8 stroke-green-tactical fill-none">
                <path 
                  d="M0,15 Q25,5 50,20 T100,10 T150,25 T200,5" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  className="opacity-80"
                />
                <circle cx="200" cy="5" r="3" fill="var(--green-tactical)" className="animate-pulse" />
              </svg>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-5 bg-green-tactical text-black font-black tracking-[0.2em] uppercase rounded-xl hover:scale-[1.02] transition-transform shadow-[0_10px_30px_rgba(46,213,115,0.2)]"
            >
              Apply Recommendation
            </button>
            <button 
              onClick={onClose}
              className="px-10 border border-white/10 text-white font-black tracking-[0.2em] uppercase rounded-xl hover:bg-white/5 transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
