import { useEffect, useState } from 'react';

/**
 * ImpactCounter — "AURA-CORE IMPACT" animated before/after wait time comparison.
 * Counts up from 0 → 22 min (without) and 0 → 9 min (with) on mount.
 */
export default function ImpactCounter() {
  const [withoutVal, setWithoutVal] = useState(0);
  const [withVal, setWithVal] = useState(0);

  useEffect(() => {
    const delay = setTimeout(() => {
      const WITHOUT_TARGET = 22;
      const WITH_TARGET = 9;
      let wo = 0, wi = 0;
      const interval = setInterval(() => {
        let done = true;
        if (wo < WITHOUT_TARGET) { wo++; setWithoutVal(wo); done = false; }
        if (wi < WITH_TARGET) { wi++; setWithVal(wi); done = false; }
        if (done) clearInterval(interval);
      }, 80);
      return () => clearInterval(interval);
    }, 1000);
    return () => clearTimeout(delay);
  }, []);

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="text-[9px] font-mono tracking-[0.2em] uppercase mb-3" style={{ color: '#5a7a8a' }}>
        AURA-CORE IMPACT
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Without */}
        <div className="p-3 text-center" style={{ background: '#080d14', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '4px' }}>
          <div className="text-[8px] font-mono tracking-widest mb-2" style={{ color: '#5a7a8a' }}>
            WITHOUT<br />AURA-CORE
          </div>
          <div className="text-2xl font-bold font-mono" style={{ color: '#ff4d4d' }}>
            {withoutVal}<span className="text-xs ml-1">min</span>
          </div>
        </div>
        {/* With */}
        <div className="p-3 text-center" style={{ background: '#080d14', border: '1px solid rgba(0,255,157,0.3)', borderRadius: '4px' }}>
          <div className="text-[8px] font-mono tracking-widest mb-2" style={{ color: '#5a7a8a' }}>
            WITH<br />AURA-CORE
          </div>
          <div className="text-2xl font-bold font-mono" style={{ color: '#00ff9d' }}>
            {withVal}<span className="text-xs ml-1">min</span>
          </div>
        </div>
      </div>
      <div className="text-[11px] font-bold font-mono text-center tracking-widest" style={{ color: '#00d2ff' }}>
        EFFICIENCY GAIN: 59% ↑
      </div>
    </div>
  );
}
