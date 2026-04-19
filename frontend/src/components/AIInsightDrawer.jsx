import React, { useEffect } from 'react';

/**
 * AIInsightDrawer — A floating glassmorphism panel for AI recommendations.
 * Optimized for the centerpiece hackathon demo.
 */
export default function AIInsightDrawer({ isOpen, onClose }) {
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[10002] flex justify-center px-0 transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="w-full max-w-lg glass-drawer overflow-hidden">
        {/* Drag Handle */}
        <div className="h-8 flex justify-center items-center cursor-pointer group" onClick={onClose}>
          <div className="w-10 h-1 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors" />
        </div>

        <div className="px-8 pb-12 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-purple-500 flex items-center justify-center text-white text-xl shadow-lg">
              ✦
            </div>
            <h3 className="text-sm font-black text-white tracking-[0.2em] font-heading uppercase">
              AI Insight
            </h3>
          </div>

          {/* Recommendation Card */}
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
            <p className="text-lg font-bold text-white leading-relaxed">
              AI suggests redirecting <span className="text-accent-primary">Gate B</span> crowd to <span className="text-accent-green">Gate D</span> — saves ~4 min avg wait
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-text-secondary font-heading">
                <span>Confidence Level</span>
                <span className="text-accent-primary">87% Confidence</span>
              </div>
              <div className="confidence-bar">
                <div className="confidence-fill" style={{ width: '87%' }} />
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-text-secondary tracking-widest uppercase font-heading">Predicted Flow Improvement</span>
              <span className="text-xs font-bold text-accent-green font-data">-18% Congestion</span>
            </div>
            <div className="h-12 w-full flex items-end">
               <svg viewBox="0 0 400 60" className="w-full h-full stroke-accent-primary fill-none">
                  <path 
                    d="M0,50 Q50,45 100,55 T200,30 T300,10 T400,15" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    className="opacity-80"
                  />
                  <circle cx="400" cy="15" r="4" fill="var(--accent-primary)" className="animate-pulse" />
               </svg>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-accent-primary text-white font-black tracking-[0.2em] uppercase rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
            >
              Apply
            </button>
            <button 
              onClick={onClose}
              className="px-8 border border-white/10 text-text-secondary font-black tracking-[0.2em] uppercase rounded-xl hover:bg-white/5 transition-all text-[10px]"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
