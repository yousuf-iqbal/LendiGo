/* ═══════════════════════════════════════════════════════════
   FloatingBackground.jsx
   Place at: frontend/src/components/FloatingBackground.jsx
   Usage: <FloatingBackground /> — drop inside any page wrapper
          It renders fixed, behind all content, never blocks clicks
═══════════════════════════════════════════════════════════ */

export default function FloatingBackground({ variant = 'default' }) {
  const configs = {
    default: [
      { cls: 'orb1', style: { width:520, height:520, top:-130, right:-90,  color:'rgba(244,160,32,0.18)',  anim:'floatA', dur:20 } },
      { cls: 'orb2', style: { width:360, height:360, bottom:60, left:-70,  color:'rgba(128,0,32,0.12)',    anim:'floatB', dur:25 } },
      { cls: 'orb3', style: { width:240, height:240, top:'42%', left:'40%',color:'rgba(196,149,106,0.14)',anim:'floatC', dur:30 } },
      { cls: 'orb4', style: { width:160, height:160, bottom:'18%',right:'22%',color:'rgba(244,160,32,0.12)',anim:'floatA', dur:16, rev:true } },
    ],
    hero: [
      { cls: 'orb1', style: { width:700, height:700, top:-200, right:-150, color:'rgba(244,160,32,0.15)', anim:'floatA', dur:22 } },
      { cls: 'orb2', style: { width:440, height:440, bottom:-60, left:-80, color:'rgba(128,0,32,0.10)',   anim:'floatB', dur:28 } },
      { cls: 'orb3', style: { width:300, height:300, top:'35%', left:'35%',color:'rgba(196,149,106,0.12)',anim:'floatC', dur:34 } },
      { cls: 'orb4', style: { width:200, height:200, top:'60%', right:'10%',color:'rgba(244,160,32,0.10)',anim:'floatB', dur:18, rev:true } },
    ],
    minimal: [
      { cls: 'orb1', style: { width:400, height:400, top:-100, right:-60, color:'rgba(244,160,32,0.12)', anim:'floatA', dur:24 } },
      { cls: 'orb2', style: { width:280, height:280, bottom:40, left:-40, color:'rgba(128,0,32,0.08)',   anim:'floatB', dur:30 } },
    ],
  };

  const orbs = configs[variant] || configs.default;

  return (
    <>
      <style>{`
        @keyframes floatA {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(40px,-50px) scale(1.08); }
          66%      { transform: translate(-20px,30px) scale(0.95); }
        }
        @keyframes floatB {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-35px,-40px) scale(1.1); }
          70%      { transform: translate(30px,20px) scale(0.92); }
        }
        @keyframes floatC {
          0%,100% { transform: translate(0,0) scale(1) rotate(0deg); }
          50%      { transform: translate(60px,-30px) scale(1.15) rotate(8deg); }
        }
        .lbg-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(128,0,32,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(128,0,32,0.022) 1px, transparent 1px);
          background-size: 64px 64px;
        }
      `}</style>
      <div className="lbg-grid" aria-hidden="true" />
      {orbs.map((orb, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'fixed',
            borderRadius: '50%',
            filter: 'blur(72px)',
            pointerEvents: 'none',
            zIndex: 0,
            background: `radial-gradient(circle, ${orb.style.color} 0%, transparent 72%)`,
            width:  orb.style.width,
            height: orb.style.height,
            top:    orb.style.top    ?? 'unset',
            bottom: orb.style.bottom ?? 'unset',
            left:   orb.style.left   ?? 'unset',
            right:  orb.style.right  ?? 'unset',
            animation: `${orb.style.anim} ${orb.style.dur}s ease-in-out infinite${orb.style.rev ? ' reverse' : ''}`,
            willChange: 'transform',
          }}
        />
      ))}
    </>
  );
}
