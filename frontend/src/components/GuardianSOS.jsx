import { useState } from 'react';
import { triggerSOS } from '../utils/api';

/**
 * GuardianSOS — prominent emergency button with confirmation modal.
 */
export default function GuardianSOS() {
  const [showModal, setShowModal] = useState(false);
  const [seatId, setSeatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSOS() {
    if (!seatId.trim()) {
      setError('Enter your seat ID');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await triggerSOS(seatId.trim());
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setShowModal(false);
    setResult(null);
    setSeatId('');
    setError('');
  }

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={() => setShowModal(true)}
        className="relative btn-danger w-full py-4 text-lg font-bold tracking-wider sos-ripple"
      >
        🚨 Guardian SOS
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 w-full max-w-sm animate-slide-up">
            {!result ? (
              <>
                <div className="text-center mb-5">
                  <div className="w-16 h-16 mx-auto mb-3 bg-vibe-red/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🚨</span>
                  </div>
                  <h3 className="text-xl font-bold text-vibe-red">Emergency SOS</h3>
                  <p className="text-sm text-gray-400 mt-1">Staff will be dispatched to your seat immediately</p>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-gray-400 mb-1 block">Your Seat ID</label>
                  <input
                    type="text"
                    value={seatId}
                    onChange={(e) => setSeatId(e.target.value.toUpperCase())}
                    placeholder="e.g. D5"
                    className="input-field text-center text-lg font-bold tracking-widest"
                    maxLength={4}
                    autoFocus
                  />
                </div>

                {error && <p className="text-xs text-vibe-red text-center mb-3">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={handleClose} className="btn-secondary flex-1 text-sm">
                    Cancel
                  </button>
                  <button onClick={handleSOS} disabled={loading} className="btn-danger flex-1 text-sm">
                    {loading ? 'Sending...' : 'Confirm SOS'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center animate-slide-up">
                <div className="w-16 h-16 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Help is Coming</h3>
                <p className="text-sm text-gray-300 mb-1">{result.message}</p>
                <p className="text-xs text-gray-500">
                  Location: ({result.x}, {result.y}) · {result.alert_level}
                </p>
                <button onClick={handleClose} className="btn-primary text-sm mt-5 w-full">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
