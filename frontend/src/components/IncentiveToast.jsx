import { useEffect, useState } from 'react';

/**
 * IncentiveToast — toast notification for trivia/reward incentive events.
 */
export default function IncentiveToast({ incentives, onDismiss }) {
  if (!incentives || incentives.length === 0) return null;

  // Show only the latest incentive
  const latest = incentives[0];

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm animate-slide-up">
      <div className="glass-panel p-5 border-l-4 border-vibe-magenta shadow-glow-magenta">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="text-sm font-bold text-vibe-magenta">Gate Alert</span>
          </div>
          <button
            onClick={() => onDismiss?.(0)}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-2">
          {latest.gate_id} is congested! Take a {latest.delay_suggestion_minutes}-min break and win:
        </p>

        <div className="p-3 bg-vibe-dark/60 rounded-lg mb-3">
          <p className="text-xs text-vibe-cyan font-semibold mb-1">🧠 Trivia:</p>
          <p className="text-sm text-white">{latest.trivia}</p>
        </div>

        <div className="p-3 bg-gradient-to-r from-vibe-magenta/10 to-vibe-lime/10 rounded-lg border border-vibe-lime/20">
          <p className="text-xs text-vibe-lime font-semibold">🎁 Reward: {latest.reward}</p>
        </div>

        <AutoDismiss onDismiss={() => onDismiss?.(0)} seconds={12} />
      </div>
    </div>
  );
}

/** Auto-dismiss progress bar */
function AutoDismiss({ onDismiss, seconds }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p - 100 / (seconds * 10);
        if (next <= 0) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onDismiss, seconds]);

  return (
    <div className="mt-3 h-1 bg-vibe-dark rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-vibe-magenta to-vibe-cyan rounded-full transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
