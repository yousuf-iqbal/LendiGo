/* ═══════════════════════════════════════════════════════════
   HelpCorner.jsx
   Place at: frontend/src/components/HelpCorner.jsx
   Replaces: existing HelpCorner component
═══════════════════════════════════════════════════════════ */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const C = {
  saffron:   '#F4A020',
  maroon:    '#800020',
  maroonL:   '#B00030',
  cream:     '#FDF6EC',
  warmWhite: '#FFF9F0',
  textDark:  '#2C1810',
  textMuted: '#6B4C3B',
  border:    'rgba(128,0,32,0.12)',
};

const STEPS = [
  { icon: '📋', title: 'Post a Request', desc: 'Tell the community what you need, your dates, and budget.' },
  { icon: '🤝', title: 'Receive Offers', desc: 'Lenders near you respond with items and prices.' },
  { icon: '✅', title: 'Confirm Booking', desc: 'Accept the best offer — a booking is created instantly.' },
  { icon: '💰', title: 'Pay Securely', desc: 'Pay from your wallet once the lender confirms.' },
  { icon: '📦', title: 'Exchange & Return', desc: 'Meet, use the item, return it, and leave a review.' },
];

export default function HelpCorner() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @keyframes hcSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hcPulse {
          0%,100% { box-shadow: 0 4px 20px rgba(128,0,32,0.35); }
          50%      { box-shadow: 0 4px 28px rgba(244,160,32,0.45); }
        }
        .hc-btn:hover { transform: translateY(-3px) scale(1.06) !important; }
        .hc-step:hover { background: #FFF0CC !important; border-color: rgba(244,160,32,0.4) !important; }
      `}</style>

      {/* Floating button */}
      <button
        className="hc-btn"
        onClick={() => setOpen(o => !o)}
        title="How it works"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 999,
          width: 52, height: 52, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.maroon}, #5C0018)`,
          border: 'none', cursor: 'pointer', color: '#fff',
          fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'hcPulse 3s ease-in-out infinite',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          boxShadow: '0 4px 20px rgba(128,0,32,0.35)',
        }}
      >
        {open ? '✕' : '?'}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 28, zIndex: 998,
          width: 320,
          background: C.warmWhite,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          boxShadow: '0 16px 48px rgba(128,0,32,0.18)',
          animation: 'hcSlideUp 0.3s ease both',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${C.maroon}, #5C0018)`,
            padding: '1.1rem 1.4rem',
          }}>
            <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              How Lendigo Works
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
              5 steps from request to return
            </p>
          </div>

          {/* Steps */}
          <div style={{ padding: '1rem' }}>
            {STEPS.map((s, i) => (
              <div key={i} className="hc-step" style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '0.75rem 0.85rem', borderRadius: 10,
                border: `1px solid transparent`,
                marginBottom: i < STEPS.length - 1 ? 6 : 0,
                transition: 'all 0.2s ease',
                cursor: 'default',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: `rgba(244,160,32,0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: C.textDark }}>{s.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: C.textMuted, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}

            {/* CTA */}
            <button
              onClick={() => { navigate('/post-request'); setOpen(false); }}
              style={{
                width: '100%', marginTop: 10,
                padding: '0.75rem',
                background: C.maroon, color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontWeight: 700, fontSize: '0.9rem',
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.maroonL; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.maroon; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Post a Request →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
