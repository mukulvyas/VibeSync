import { useState } from 'react';

const API = 'http://localhost:8000';

const SCENARIOS = [
  {
    id: 'full-surge',
    label: 'Match Ends',
    subtitle: 'Full Surge',
    icon: '🏟️',
    description: 'All exits hit critical congestion',
    endpoint: '/scenario/full-surge',
    color: '#ef4444',
    glow: '0 0 20px rgba(239,68,68,0.3)',
  },
  {
    id: 'medical',
    label: 'Medical Emergency',
    subtitle: 'SOS Demo',
    icon: '🚑',
    description: 'Emergency at seat E4',
    endpoint: '/scenario/medical-emergency',
    color: '#f59e0b',
    glow: '0 0 20px rgba(245,158,11,0.3)',
  },
  {
    id: 'gate-blockage',
    label: 'Gate 3 Blockage',
    subtitle: 'Jam Event',
    icon: '🚧',
    description: 'Column 3 completely blocked',
    endpoint: '/scenario/gate-blockage',
    color: '#d946ef',
    glow: '0 0 20px rgba(217,70,239,0.3)',
  },
];

export default function ScenarioPanel() {
  const [activeScenario, setActiveScenario] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleScenario(scenario) {
    setLoading(true);
    setActiveScenario(scenario.id);
    try {
      await fetch(`${API}${scenario.endpoint}`, { method: 'POST' });
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
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">
          ⚡ Scenario Injection
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
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
