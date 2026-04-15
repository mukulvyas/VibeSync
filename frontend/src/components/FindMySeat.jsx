import { useState } from 'react';
import { findPath } from '../utils/api';

/**
 * FindMySeat — seat selector + Cool Path finder.
 */
export default function FindMySeat({ onPathFound, onClear }) {
  const [seatId, setSeatId] = useState('');
  const [startRow, setStartRow] = useState(0);
  const [startCol, setStartCol] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleFind() {
    if (!seatId.trim()) {
      setError('Enter a seat ID (e.g., D5)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await findPath(seatId.trim(), startRow, startCol);
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
    <div className="glass-card p-5 animate-fade-in">
      <h3 className="section-title text-sm mb-3">🧭 Find My Seat</h3>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Seat ID</label>
          <input
            type="text"
            value={seatId}
            onChange={(e) => setSeatId(e.target.value.toUpperCase())}
            placeholder="e.g. D5, A3, H8"
            className="input-field text-sm"
            maxLength={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Start Row</label>
            <input
              type="number"
              value={startRow}
              onChange={(e) => setStartRow(Number(e.target.value))}
              min={0}
              max={9}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Start Col</label>
            <input
              type="number"
              value={startCol}
              onChange={(e) => setStartCol(Number(e.target.value))}
              min={0}
              max={9}
              className="input-field text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-vibe-red">{error}</p>
        )}

        <div className="flex gap-2">
          <button onClick={handleFind} disabled={loading} className="btn-primary text-sm flex-1">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-vibe-dark/30 border-t-vibe-dark rounded-full animate-spin" />
                Finding...
              </span>
            ) : (
              '🗺️ Find Cool Path'
            )}
          </button>
          {result && (
            <button onClick={handleClear} className="btn-secondary text-sm">
              Clear
            </button>
          )}
        </div>

        {result && (
          <div className="mt-3 p-3 bg-vibe-dark/50 rounded-lg border border-vibe-cyan/20 animate-slide-up">
            <p className="text-xs text-vibe-cyan font-semibold mb-1">Cool Path Found ✨</p>
            <p className="text-xs text-gray-300">
              Seat <strong>{result.seat_id}</strong> → ({result.target_row}, {result.target_col})
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {result.path.length} steps · Cost: {result.total_cost.toFixed(1)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
