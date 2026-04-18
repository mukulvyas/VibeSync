import React from 'react';

/**
 * AtmosphereMetrics — Displays live environmental conditions:
 * Noise Level, Air Quality, and WiFi Mesh Status.
 */
export default function AtmosphereMetrics({ noise, aqi, wifi }) {
  const getAQIStatus = (val) => {
    if (val < 50) return { label: 'Excellent', color: '#2ed573' };
    if (val < 100) return { label: 'Good', color: '#f59e0b' };
    return { label: 'Moderate', color: '#f59e0b' };
  };

  const aqiInfo = getAQIStatus(aqi);

  return (
    <div className="space-y-8">
      <Section label="Live Atmosphere" />
      
      <div className="space-y-6">
        {/* Equalizer for Noise */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-text-dim uppercase tracking-widest px-1">
             <span>Noise Level</span>
             <span className="text-white bg-[#374151] px-2 py-0.5 rounded-full font-data">{noise} dB</span>
          </div>
          <div className="flex items-end gap-1.5 h-12 px-2 bg-black/20 rounded-xl items-center justify-center">
            <div className="w-2 h-4 bg-[#F59E0B] rounded-full animate-bar-1" />
            <div className="w-2 h-8 bg-[#F59E0B] rounded-full animate-bar-2" />
            <div className="w-2 h-6 bg-[#F59E0B] rounded-full animate-bar-3" />
            <div className="w-2 h-10 bg-[#F59E0B] rounded-full animate-bar-4" />
            <div className="w-2 h-5 bg-[#F59E0B] rounded-full animate-bar-2" />
            <div className="w-2 h-9 bg-[#F59E0B] rounded-full animate-bar-1" />
          </div>
        </div>

        {/* AQI Pill */}
        <div className="flex justify-between items-center p-4 bg-[#1F2937] rounded-2xl border border-white/5 shadow-lg">
          <span className="text-xs font-bold text-white">Air Quality</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: aqiInfo.color }} />
            <span className="text-xs font-bold" style={{ color: aqiInfo.color }}>{aqiInfo.label}</span>
          </div>
        </div>

        {/* Signal Bars for WiFi */}
        <div className="flex justify-between items-center p-4 bg-[#1F2937] rounded-2xl border border-white/5 shadow-lg">
          <span className="text-xs font-bold text-white">Guest WiFi</span>
          <div className="flex items-end gap-1 h-3 pointer-events-none">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`w-1 rounded-sm ${i <= 3 ? 'bg-green-400' : 'bg-white/10'}`} 
                style={{ height: `${i * 25}%` }} 
              />
            ))}
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
