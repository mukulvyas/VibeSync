import { useState } from 'react';

/**
 * TriviaModal — SyncAgent reward trivia flow.
 * On correct answer: awards 50 pts and triggers Gate-C route unlock callback.
 * On wrong answer:  dismisses with "OFFER EXPIRES" message.
 */

const TRIVIA_BANK = [
  {
    q: 'Which algorithm does AURA-CORE FlowAgent use to compute optimal crowd routes?',
    opts: ['Dijkstra', 'A* (A-Star)', 'Bellman-Ford', 'BFS Breadth-First'],
    correct: 1,
  },
  {
    q: "What is SyncAgent's primary mechanism for reducing gate congestion?",
    opts: ['Physical barriers', 'CCTV surveillance', 'PA announcements', 'Real-time trivia & reward vouchers'],
    correct: 3,
  },
  {
    q: 'At what crowd density % does SyncAgent auto-trigger an incentive intervention?',
    opts: ['60%', '70%', '80%', '95%'],
    correct: 2,
  },
];

export default function TriviaModal({ open, onClose, onSuccess }) {
  const [question] = useState(() => TRIVIA_BANK[Math.floor(Math.random() * TRIVIA_BANK.length)]);
  const [answered, setAnswered] = useState(null); // index or null
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'

  if (!open) return null;

  function handleAnswer(idx) {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === question.correct) {
      setFeedback('correct');
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 2000);
    } else {
      setFeedback('wrong');
      setTimeout(() => { onClose?.(); }, 1500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,8,15,0.88)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-md p-7 rounded-none" style={{
        background: 'rgba(13,21,32,0.97)',
        border: '1px solid rgba(0,210,255,0.45)',
        boxShadow: '0 0 60px rgba(0,210,255,0.1)',
        fontFamily: "'JetBrains Mono', monospace",
        animation: 'logSlideIn 0.3s ease-out',
      }}>
        {/* Header */}
        <div className="text-[9px] tracking-[3px] font-bold mb-1" style={{ color: '#f5a623' }}>
          ⚡ SYNCAGENT · REWARD PROTOCOL
        </div>
        <div className="text-[9px] tracking-[2px] mb-5" style={{ color: '#5a7a8a' }}>
          ANSWER CORRECTLY TO UNLOCK GATE C ROUTE · +50 PTS
        </div>

        {/* Question */}
        <div className="text-sm font-semibold mb-5 leading-relaxed" style={{ color: '#c8e0f0', fontFamily: 'Rajdhani, sans-serif' }}>
          {question.q}
        </div>

        {/* Options */}
        {['A', 'B', 'C', 'D'].map((letter, idx) => {
          let borderColor = 'rgba(0,210,255,0.25)';
          let bg = 'rgba(0,210,255,0.06)';
          let textColor = '#00d2ff';
          if (answered !== null) {
            if (idx === question.correct) { bg = 'rgba(0,255,157,0.18)'; borderColor = '#00ff9d'; textColor = '#00ff9d'; }
            else if (idx === answered && answered !== question.correct) { bg = 'rgba(255,77,77,0.18)'; borderColor = '#ff4d4d'; textColor = '#ff4d4d'; }
          }
          return (
            <button key={idx} onClick={() => handleAnswer(idx)}
              disabled={answered !== null}
              className="block w-full text-left rounded-none mb-2 px-4 py-2.5 text-[11px] tracking-wide transition-all"
              style={{ background: bg, border: `1px solid ${borderColor}`, color: textColor, fontFamily: "'JetBrains Mono', monospace", cursor: answered !== null ? 'default' : 'pointer' }}>
              <span className="font-bold mr-2">{letter}.</span>{question.opts[idx]}
            </button>
          );
        })}

        {/* Feedback */}
        {feedback && (
          <div className="mt-4 text-center text-[11px] tracking-widest font-bold" style={{
            color: feedback === 'correct' ? '#00ff9d' : '#ff4d4d',
            animation: 'logSlideIn 0.3s ease-out',
          }}>
            {feedback === 'correct'
              ? '+50 PTS ADDED · GATE C ROUTE UNLOCKED'
              : 'INCORRECT — OFFER EXPIRES'}
          </div>
        )}
      </div>
    </div>
  );
}
