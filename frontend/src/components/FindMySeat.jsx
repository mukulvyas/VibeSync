import { useState } from 'react';
import { findPath } from '../utils/api';

/**
 * FindMySeat — seat selector + Cool Path finder.
 */
export default function FindMySeat({ onPathFound, onClear }) {
  const [seatId, setSeatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Fixed attendee start location (Gate 1 - 0,0) for simplicity or POI paths
  const startRow = 0;
  const startCol = 0;

  async function handleFind(targetId = null) {
    const target = targetId || seatId;
    if (!target || !target.trim()) {
      setError('Enter a seat ID (e.g., D5)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await findPath(target.trim(), startRow, startCol);
      setResult(data);
      onPathFound?.(data.path);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setResult(null);
    setSeatId('');
    setError('');
    onClear?.();
  }

  return (
    <div className="glass-card p-5 animate-fade-in shadow-xl">
      <h3 className="section-title text-sm mb-4">📍 Find Nearest</h3>

      {/* POI Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button onClick={() => handleFind('POI_WASHROOM')} className="bg-[#020617] border border-cyan-500/30 hover:border-cyan-400 p-3 flex flex-col items-center justify-center transition-all text-gray-300 hover:text-cyan-400">
          <span className="text-2xl mb-1">🚻</span>
          <span className="text-[10px] uppercase font-bold tracking-widest">Washroom</span>
        </button>
        <button onClick={() => handleFind('POI_WATER')} className="bg-[#020617] border border-cyan-500/30 hover:border-cyan-400 p-3 flex flex-col items-center justify-center transition-all text-gray-300 hover:text-cyan-400">
          <span className="text-2xl mb-1">💧</span>
          <span className="text-[10px] uppercase font-bold tracking-widest">Hydration</span>
        </button>
        <button onClick={() => handleFind('POI_FOOD')} className="bg-[#020617] border border-cyan-500/30 hover:border-cyan-400 p-3 flex flex-col items-center justify-center transition-all text-gray-300 hover:text-cyan-400">
          <span className="text-2xl mb-1">🍔</span>
          <span className="text-[10px] uppercase font-bold tracking-widest">Food</span>
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Or find a specific Seat:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={seatId}
              onChange={(e) => setSeatId(e.target.value.toUpperCase())}
              placeholder="e.g. N13, S74, W31"
              className="input-field text-sm w-full"
              maxLength={4}
            />
            <button onClick={() => handleFind()} disabled={loading} className="btn-primary px-4 whitespace-nowrap">
              {loading ? '...' : 'Route'}
            </button>
            {result && (
              <button onClick={handleClear} className="btn-danger px-4">X</button>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        {result && (
          <div className="mt-4 p-4 text-center rounded-none border border-cyan-500/50 bg-cyan-950/20" style={{ animation: 'logSlideIn 0.3s ease-out' }}>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Estimated Walk Time</p>
            <p className="text-3xl font-mono text-cyan-400 font-bold mb-2">
              {Math.max(1, Math.round(result.total_cost * 0.8))} <span className="text-sm">mins</span>
            </p>
            <p className="text-xs text-cyan-300 font-mono">Distance: {result.path.length * 12}m</p>
          </div>
        )}
      </div>
    </div>
  );
}
