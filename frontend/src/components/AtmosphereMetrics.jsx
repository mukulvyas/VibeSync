import React from 'react';

/**
 * AtmosphereMetrics — Displays live environmental conditions:
 * Noise Level, Air Quality, and WiFi Mesh Status.
 */
export default function AtmosphereMetrics({ noise, aqi, wifi }) {
  return (
    <div className="space-y-6">
      <Section label="Atmosphere" />
      
      <div className="space-y-4">
        {/* Animated Noise Level Equalizer */}
        <div className="glass-tactical p-5 rounded-3xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center px-1">
             <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Noise Level</span>
             <span className="text-white font-data text-xs font-black tracking-widest">{noise} dB</span>
          </div>
          
          <div className="flex items-end gap-2 h-16 px-2 bg-black/40 rounded-2xl justify-center overflow-hidden">
            {[18, 34, 24, 44, 30].map((h, i) => (
              <div 
                key={i}
                className="w-2.5 rounded-full animate-audio"
                style={{ 
                  height: `${h}px`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${0.9 + i * 0.15}s`,
                  background: `linear-gradient(to top, #3B82F6, #F59E0B)`
                }} 
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* AQI Pill */}
          <div className="flex justify-between items-center px-5 py-4 bg-[#F59E0B]/10 rounded-2xl border border-[#F59E0B]/30 shadow-lg">
            <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest">Air Quality</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse shadow-[0_0_8px_#F59E0B]" />
              <span className="text-[10px] font-black text-white tracking-tight bg-[#F59E0B]/20 border border-[#F59E0B]/40 rounded-full px-2 py-0.5">
                {aqi}
              </span>
            </div>
          </div>

          {/* Guest WiFi Signal SVG */}
          <div className="flex justify-between items-center px-5 py-4 bg-[#111827] rounded-2xl border border-white/5 shadow-lg">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">WiFi</span>
            <div className="flex items-center gap-1.5 h-3">
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="14" width="4" height="4" rx="1" fill="#10B981"/>
                <rect x="6" y="10" width="4" height="8" rx="1" fill="#10B981"/>
                <rect x="12" y="5" width="4" height="13" rx="1" fill="#10B981"/>
                <rect x="18" y="0" width="4" height="18" rx="1" fill="#1C2D40"/>
              </svg>
              <span className="text-[10px] font-black text-white tracking-tight bg-[#10B981]/20 border border-[#10B981]/40 rounded-full px-2 py-0.5">
                {wifi}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label }) {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="w-1 h-3 bg-[#F59E0B] rounded-full" />
      <span className="text-[11px] font-black tracking-widest text-[#F59E0B] uppercase font-heading">{label}</span>
    </div>
  );
}
