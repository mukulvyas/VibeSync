import { useState } from 'react';
import { joinQueue } from '../utils/api';

/**
 * LineBuddy — queue matching by shared fan interest.
 */
export default function LineBuddy() {
  const [userId, setUserId] = useState('');
  const [interest, setInterest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleJoin() {
    if (!userId.trim() || !interest.trim()) {
      setError('Enter both your name and a fan interest');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await joinQueue(userId.trim(), interest.trim());
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setUserId('');
    setInterest('');
    setError('');
  }

  return (
    <div className="glass-card p-5 animate-fade-in">
      <h3 className="section-title text-sm mb-3">🤝 Line-Buddy</h3>

      {!result ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Your Name</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. Alex"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Favorite Player / Interest</label>
            <input
              type="text"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              placeholder="e.g. Messi, Lakers, F1"
              className="input-field text-sm"
            />
          </div>

          {error && <p className="text-xs text-vibe-red">{error}</p>}

          <button onClick={handleJoin} disabled={loading} className="btn-primary text-sm w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-vibe-dark/30 border-t-vibe-dark rounded-full animate-spin" />
                Joining...
              </span>
            ) : (
              '🎯 Join Queue'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {result.matched ? (
            <>
              {/* Match found */}
              <div className="p-4 bg-gradient-to-br from-vibe-magenta/10 to-vibe-cyan/10 border border-vibe-magenta/30 rounded-xl">
                <p className="text-vibe-magenta font-semibold text-sm mb-2">🎉 Match Found!</p>
                <p className="text-xs text-gray-300 mb-2">
                  You matched with <strong className="text-white">{result.match_user_id}</strong>
                </p>
                <div className="p-3 bg-vibe-dark/40 rounded-lg">
                  <p className="text-xs text-vibe-cyan italic">"{result.icebreaker}"</p>
                </div>
              </div>
              {/* Status bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-vibe-dark rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-vibe-cyan to-vibe-magenta rounded-full w-full transition-all duration-1000" />
                </div>
                <span className="text-xs text-vibe-lime font-semibold">Matched ✓</span>
              </div>
            </>
          ) : (
            <>
              {/* Waiting */}
              <div className="p-4 bg-vibe-dark/50 border border-vibe-amber/30 rounded-xl">
                <p className="text-vibe-amber font-semibold text-sm mb-1">⏳ In Queue</p>
                <p className="text-xs text-gray-400">
                  Waiting for another <strong className="text-white">{result.fan_interest}</strong> fan...
                </p>
                <p className="text-xs text-gray-500 mt-1">Position: #{result.position_in_queue}</p>
              </div>
              {/* Status bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-vibe-dark rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-vibe-amber to-vibe-amber/50 rounded-full w-1/3 animate-pulse" />
                </div>
                <span className="text-xs text-vibe-amber font-semibold">Searching...</span>
              </div>
            </>
          )}

          <button onClick={handleReset} className="btn-secondary text-sm w-full">
            🔄 Reset
          </button>
        </div>
      )}
    </div>
  );
}
