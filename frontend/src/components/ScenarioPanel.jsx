import { useState } from 'react';
import { API_BASE } from '../utils/config.js';

// Expose a global trigger for the match countdown full-surge call from App.jsx
export function triggerFullSurgeGlobal() {
  fetch(`${API_BASE}/scenario/full-surge`, { method: 'POST' }).catch(() => {});
}

const SCENARIOS = [
  {
    id: 'full-surge',
    label: 'Match End Surge',
    subtitle: 'Exit Rush Event',
    icon: '🌊',
    description: 'All gates, exits surge to max density',
    endpoint: '/scenario/full-surge',
    color: '#f5a623',
    glow: '0 0 20px rgba(245,158,11,0.3)',
  },
  {
    id: 'power-outage',
    label: 'Power Outage',
    subtitle: 'Blackout / Cascade Event',
    icon: '⚡',
    description: 'System-wide lighting failure',
    endpoint: '/scenario/power-outage',
    color: '#06b6d4',
    glow: '0 0 20px rgba(6,182,212,0.3)',
  },
  {
    id: 'medical-priority',
    label: 'Medical Priority One',
    subtitle: 'Priority Override',
    icon: '🚨',
    description: 'Critical emergency at sector E4',
    endpoint: '/scenario/medical-priority-one',
    color: '#ef4444',
    glow: '0 0 20px rgba(239,68,68,0.3)',
  },
  {
    id: 'gate-blockage',
    label: 'Gate Jam',
    subtitle: 'Checkpoint Jam',
    icon: '🚧',
    description: 'Security chokepoint locked',
    endpoint: '/scenario/gate-blockage',
    color: '#f59e0b',
    glow: '0 0 20px rgba(245,158,11,0.3)',
  },
];

export default function ScenarioPanel() {
  const [activeScenario, setActiveScenario] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleScenario(scenario) {
    setLoading(true);
    setActiveScenario(scenario.id);
    try {
      await fetch(`${API_BASE}${scenario.endpoint}`, { method: 'POST' });
      setTimeout(() => setActiveScenario(null), 3000);
    } catch (e) {
      console.error('Scenario failed:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="scenario-panel">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#06b6d4]">
          ▶ SYS.INJECT_SCENARIO
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {SCENARIOS.map(s => {
          const isActive = activeScenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleScenario(s)}
              disabled={loading}
              className="scenario-btn group relative"
              style={{
                borderColor: isActive ? s.color : undefined,
                boxShadow: isActive ? s.glow : undefined,
              }}
            >
              <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">
                {s.icon}
              </span>
              <span className="text-[10px] font-bold text-white block leading-tight">
                {s.label}
              </span>
              <span className="text-[8px] text-gray-500 block mt-0.5 uppercase tracking-wider">
                {s.subtitle}
              </span>
              {isActive && (
                <div
                  className="absolute inset-0 rounded-xl animate-pulse opacity-20"
                  style={{ background: s.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
