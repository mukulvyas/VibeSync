import { useState, useEffect } from 'react';
import { triggerSOS } from '../utils/api';

/**
 * GuardianSOS — emergency button with confirmation modal.
 * UPGRADE 4: On successful SOS dispatch, shows a slide-in panel with
 * seat ID, resolved coords, ETA, and a pulsing red beacon. Auto-dismisses in 6s.
 */
export default function GuardianSOS() {
  const [showModal, setShowModal] = useState(false);
  const [seatId, setSeatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [panelDismissing, setPanelDismissing] = useState(false);

  useEffect(() => {
    if (result) {
      setShowModal(false);
      setShowPanel(true);
      setPanelDismissing(false);
      const timer = setTimeout(() => {
        setPanelDismissing(true);
        setTimeout(() => { setShowPanel(false); setPanelDismissing(false); setResult(null); }, 400);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  async function handleSOS() {
    if (!seatId.trim()) { setError('Enter your seat ID'); return; }
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
    setSeatId('');
    setError('');
  }

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={() => setShowModal(true)}
        className="relative w-full py-4 text-lg font-bold tracking-wider sos-ripple"
        style={{
          background: 'rgba(255,77,77,0.1)',
          border: '1px solid #ff4d4d',
          color: '#ff4d4d',
          fontFamily: 'Rajdhani, sans-serif',
          letterSpacing: '2px',
        }}
      >
        🆘 Guardian SOS
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="glass-panel p-6 w-full max-w-sm" style={{ animation: 'logSlideIn 0.3s ease-out' }}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,77,77,0.2)' }}>
                <span className="text-3xl">🚨</span>
              </div>
              <h3 className="text-xl font-bold" style={{ color: '#ff4d4d' }}>Emergency SOS</h3>
              <p className="text-sm mt-1" style={{ color: '#5a7a8a' }}>Staff will be dispatched to your seat immediately</p>
            </div>
            <div className="mb-4">
              <label className="text-xs mb-1 block" style={{ color: '#5a7a8a' }}>Your Seat ID</label>
              <input
                type="text"
                value={seatId}
                onChange={(e) => setSeatId(e.target.value.toUpperCase())}
                placeholder="e.g. N14, S52"
                className="input-field text-center text-lg font-bold tracking-widest"
                maxLength={4}
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-center mb-3" style={{ color: '#ff4d4d' }}>{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleClose} className="flex-1 text-sm py-2 px-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#c8e0f0' }}>
                Cancel
              </button>
              <button onClick={handleSOS} disabled={loading} className="flex-1 text-sm py-2 px-4 font-bold"
                style={{ background: 'rgba(255,77,77,0.15)', border: '1px solid #ff4d4d', color: '#ff4d4d' }}>
                {loading ? 'Sending...' : 'Confirm SOS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE 4: Slide-in SOS Dispatch Panel */}
      {showPanel && result && (
        <div
          className="fixed right-0 z-40 flex flex-col gap-1"
          style={{
            top: '80px',
            width: '220px',
            background: 'rgba(13,21,32,0.97)',
            border: '1px solid rgba(255,77,77,0.5)',
            borderRight: 'none',
            borderRadius: '6px 0 0 6px',
            padding: '14px',
            fontFamily: "'JetBrains Mono', monospace",
            animation: panelDismissing
              ? 'sosSlideOut 0.4s ease forwards'
              : 'sosSlideIn 0.4s ease forwards',
            boxShadow: '-8px 0 30px rgba(255,77,77,0.15)',
          }}
        >
          <style>{`
            @keyframes sosSlideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
            @keyframes sosSlideOut { from { transform: translateX(0); opacity:1; } to { transform: translateX(100%); opacity:0; } }
          `}</style>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff4d4d', boxShadow: '0 0 8px #ff4d4d' }} />
            <span className="text-[9px] tracking-[2px] font-bold" style={{ color: '#ff4d4d' }}>GUARDIANAGENT ACTIVE</span>
          </div>
          <Row label="SEAT ID" value={result.seat_id} color="#c8e0f0" />
          <Row label="COORDS" value={`(${result.x}, ${result.y})`} />
          <Row label="ALERT" value={result.alert_level} color="#ff4d4d" />
          <Row label="UNIT-3 ETA" value="~90s" color="#f5a623" />
          <Row label="UPLINK" value="ENCRYPTED" color="#00d2ff" />
          <div className="mt-3 text-[9px] leading-relaxed" style={{ color: '#5a7a8a' }}>{result.message}</div>
        </div>
      )}
    </>
  );
}

function Row({ label, value, color }) {
  return (
    <div className="flex justify-between text-[9px] py-1" style={{ borderBottom: '1px solid rgba(0,210,255,0.06)' }}>
      <span style={{ color: '#5a7a8a', letterSpacing: '1px' }}>{label}</span>
      <span style={{ color: color || '#c8e0f0' }}>{value}</span>
    </div>
  );
}
