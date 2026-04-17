import React from 'react';

/**
 * AtmosphereMetrics — Displays live environmental conditions:
 * Noise Level, Air Quality, and WiFi Mesh Status.
 */
export default function AtmosphereMetrics({ noise, aqi, wifi }) {
  const getAQIStatus = (val) => {
    if (val < 50) return { label: 'EXCELLENT', color: 'var(--cyan-tactical)' };
    if (val < 100) return { label: 'GOOD', color: 'var(--amber-tactical)' };
    return { label: 'MODERATE', color: 'var(--amber-tactical)' };
  };

  const aqiInfo = getAQIStatus(aqi);

  return (
    <div className="space-y-6">
      <Section label="LIVE ATMOSPHERE" />
      
      <div className="space-y-4">
        {/* Temperature placeholder or static for now */}
        <div className="flex justify-between items-end">
           <span className="text-4xl font-rajdhani font-bold text-white tracking-widest">72°F</span>
           <span className="text-[10px] text-text-dim mb-1">Wind: 4mph N</span>
        </div>

        <MetricRow 
          label="NOISE LEVEL" 
          value={`${noise} dB`} 
          subLabel={noise > 85 ? 'PEAK' : 'OPTIMAL'} 
          color={noise > 85 ? 'var(--amber-tactical)' : 'var(--cyan-tactical)'} 
        />

        <MetricRow 
          label="AIR QUALITY" 
          value={aqiInfo.label} 
          subLabel={`${aqi} AQI`} 
          color={aqiInfo.color} 
        />

        <MetricRow 
          label="WIFI MESH" 
          value="OPTIMAL" 
          subLabel={`${wifi} Mbps`} 
          color="var(--cyan-tactical)" 
        />
      </div>
    </div>
  );
}

function Section({ label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1.5 h-1.5 bg-cyan-tactical rotate-45" />
      <span className="text-[11px] font-bold tracking-[0.2em] text-text-dim uppercase">{label}</span>
    </div>
  );
}

function MetricRow({ label, value, subLabel, color }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-mono tracking-widest text-text-dim uppercase">{label}</p>
      <div className="flex justify-between items-center group">
        <span className="text-sm font-bold tracking-wider text-white group-hover:text-cyan-tactical transition-colors">{value}</span>
        <span className="text-[9px] font-mono" style={{ color }}>{subLabel}</span>
      </div>
      <div className="h-[2px] w-full bg-bg-panel">
         <div className="h-full bg-cyan-tactical opacity-20" style={{ width: '100%' }} />
      </div>
    </div>
  );
}
