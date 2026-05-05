/* ═══════════════════════════════════════════════════════════
   HomePage.jsx  — NEW
   Place at: frontend/src/pages/HomePage.jsx
   Replaces: existing HomePage.jsx + HomePage.css (no longer needed)
   No extra deps needed.
═══════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FloatingBackground from '../components/FloatingBackground';

/* ── Inline styles (design-system tokens) ── */
const C = {
  saffron:     '#F4A020',
  saffronDark: '#E08800',
  saffronPale: '#FFF0CC',
  maroon:      '#800020',
  maroonDeep:  '#5C0018',
  maroonLight: '#B00030',
  brownLight:  '#C4956A',
  cream:       '#FDF6EC',
  warmWhite:   '#FFF9F0',
  textDark:    '#2C1810',
  textMuted:   '#6B4C3B',
  textFaint:   '#A68070',
  border:      'rgba(128,0,32,0.12)',
};

/* ── Small reusable components ─────────────── */
function StatPill({ value, label }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      padding:'1.25rem 2rem',
      background:'rgba(128,0,32,0.05)',
      border:`1px solid ${C.border}`,
      borderRadius:14,
      minWidth:130,
    }}>
      <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:'2.2rem', fontWeight:700, color:C.maroon, lineHeight:1 }}>{value}</span>
      <span style={{ fontSize:'0.8rem', color:C.textMuted, marginTop:4, fontWeight:500 }}>{label}</span>
    </div>
  );
}

function HowStep({ num, title, desc, delay }) {
  return (
    <div className="reveal" style={{ animationDelay:`${delay}s`, flex:1, minWidth:220 }}>
      <div style={{
        width:52, height:52, borderRadius:'50%',
        background:`linear-gradient(135deg, ${C.saffron}, ${C.saffronDark})`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', fontWeight:700,
        color:C.maroonDeep, marginBottom:'1rem',
        boxShadow:`0 4px 16px rgba(244,160,32,0.35)`,
      }}>{num}</div>
      <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.3rem', fontWeight:700, color:C.textDark, marginBottom:'0.4rem' }}>{title}</h3>
      <p style={{ fontSize:'0.95rem', color:C.textMuted, lineHeight:1.65 }}>{desc}</p>
    </div>
  );
}

function CategoryChip({ emoji, label }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'0.6rem 1.1rem',
      background:C.warmWhite,
      border:`1px solid ${C.border}`,
      borderRadius:999,
      fontSize:'0.88rem', fontWeight:600, color:C.textDark,
      transition:'all 0.25s ease',
      cursor:'default',
      whiteSpace:'nowrap',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = C.saffronPale;
      e.currentTarget.style.borderColor = C.saffron;
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(244,160,32,0.20)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = C.warmWhite;
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <span>{emoji}</span> {label}
    </div>
  );
}

/* ── Main Component ────────────────────────── */
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setHeroVisible(true), 80);

    observerRef.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observerRef.current.observe(el));

    return () => { clearTimeout(t); observerRef.current?.disconnect(); };
  }, []);

  return (
    <div style={{ background:C.cream, minHeight:'100vh', overflowX:'hidden', position:'relative', fontFamily:"'Outfit', system-ui, sans-serif" }}>
      <FloatingBackground variant="hero" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500&family=Outfit:wght@300;400;500;600;700;800&display=swap');

        .reveal { opacity:0; transform:translateY(28px); transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1); }
        .reveal.visible { opacity:1; transform:translateY(0); }

        .hero-letter {
          display:inline-block;
          cursor:default;
          transition: color 0.25s ease, transform 0.25s cubic-bezier(.34,1.56,.64,1);
        }
        .hero-letter:hover {
          color: #F4A020 !important;
          transform: translateY(-10px) rotate(-4deg) scale(1.08);
        }

        .cta-primary {
          background: #800020;
          color: #fff;
          padding: 0.85rem 2.2rem;
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 20px rgba(128,0,32,0.30);
          transition: all 0.28s cubic-bezier(.4,0,.2,1);
        }
        .cta-primary:hover {
          background: #B00030;
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(128,0,32,0.40);
        }
        .cta-primary:active { transform: translateY(-1px); }

        .cta-outline {
          background: transparent;
          color: #2C1810;
          padding: 0.85rem 2rem;
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          border: 2px solid rgba(128,0,32,0.22);
          cursor: pointer;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.28s cubic-bezier(.4,0,.2,1);
        }
        .cta-outline:hover {
          border-color: #800020;
          background: rgba(128,0,32,0.06);
          transform: translateY(-2px);
        }

        .testimonial-card {
          background: #FFF9F0;
          border: 1px solid rgba(128,0,32,0.10);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }
        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(128,0,32,0.12);
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 68px !important; }
          .hero-tagline { font-size: 1.3rem !important; }
          .stats-row { flex-wrap: wrap !important; }
          .how-grid { flex-direction: column !important; }
          .cta-row { flex-direction: column !important; align-items: stretch !important; }
          .cta-row a, .cta-row button { text-align: center !important; justify-content: center !important; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, minHeight:'88vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'120px 2rem 80px' }}>
        <div style={{ textAlign:'center', maxWidth:860 }}>

          {/* Eyebrow */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(244,160,32,0.12)', border:'1px solid rgba(244,160,32,0.30)',
            borderRadius:999, padding:'6px 16px', marginBottom:'2rem',
            fontSize:'0.82rem', fontWeight:600, color:C.maroon,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
            transition:'opacity 0.5s ease, transform 0.5s ease',
          }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:C.saffron, display:'inline-block' }} />
            Pakistan's Community Lending Platform
          </div>

          {/* Big title */}
          <h1
            className="hero-title"
            style={{
              fontFamily:'Cormorant Garamond, Georgia, serif',
              fontSize:110,
              fontWeight:700,
              letterSpacing:'-0.04em',
              lineHeight:0.92,
              color:C.textDark,
              marginBottom:'1.6rem',
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(32px)',
              transition:'opacity 0.65s ease 0.1s, transform 0.65s ease 0.1s',
            }}
          >
            {'Lendigo'.split('').map((l, i) => (
              <span key={i} className="hero-letter" style={{ color: i === 0 ? C.maroon : C.textDark, transitionDelay:`${i * 0.04}s` }}>{l}</span>
            ))}
          </h1>

          {/* Tagline */}
          <p
            className="hero-tagline"
            style={{
              fontFamily:'Cormorant Garamond, serif',
              fontSize:'1.7rem',
              fontStyle:'italic',
              color:C.textMuted,
              marginBottom:'1rem',
              fontWeight:500,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
              transition:'opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s',
            }}
          >
            Borrow what you need. Lend what you have.
          </p>

          <p style={{
            fontSize:'1.05rem',
            color:C.textMuted,
            lineHeight:1.7,
            maxWidth:520,
            margin:'0 auto 2.8rem',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
            transition:'opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s',
          }}>
            Need a drill for one afternoon? Forgot a camera for the weekend?
            Your neighbourhood has it — no purchase needed.
          </p>

          {/* CTA buttons */}
          <div
            className="cta-row"
            style={{
              display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:'4rem',
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(14px)',
              transition:'opacity 0.6s ease 0.45s, transform 0.6s ease 0.45s',
            }}
          >
            <Link to="/signup" className="cta-primary">
              Start Lending & Borrowing
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link to="/browse" className="cta-outline">Explore Listings</Link>
          </div>

          {/* Stats */}
          <div
            className="stats-row"
            style={{
              display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap',
              opacity: heroVisible ? 1 : 0,
              transition:'opacity 0.6s ease 0.55s',
            }}
          >
            <StatPill value="500+" label="Assets Listed" />
            <StatPill value="1.2k+" label="Successful Loans" />
            <StatPill value="4.9★" label="Avg Rating" />
            <StatPill value="Free" label="To Join" />
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'4rem 2rem', background:'rgba(128,0,32,0.03)', borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <p className="reveal" style={{ fontSize:'0.78rem', fontWeight:700, color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'1.2rem', textAlign:'center' }}>
            Popular Categories
          </p>
          <div className="reveal delay-1" style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
            {[
              ['📷','Cameras'],['🔧','Tools'],['📚','Books'],['🎸','Instruments'],
              ['🧳','Luggage'],['💻','Electronics'],['🏕️','Camping Gear'],['🎮','Gaming'],
              ['🪴','Garden'],['🧵','Craft Supplies'],['🔬','Lab Equipment'],['🎪','Event Items'],
            ].map(([e,l]) => <CategoryChip key={l} emoji={e} label={l} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'6rem 2rem' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2.6rem', fontWeight:700, color:C.textDark, letterSpacing:'-0.02em' }}>
              How Lendigo Works
            </h2>
            <p style={{ fontSize:'1rem', color:C.textMuted, marginTop:8 }}>
              Three simple steps from need to borrow
            </p>
          </div>
          <div className="how-grid" style={{ display:'flex', gap:'3rem', alignItems:'flex-start', flexWrap:'wrap' }}>
            <HowStep num="01" title="Post your request" desc="Tell the community what you need, when you need it, and your budget. Takes under a minute." delay={0} />
            <div style={{ width:1, alignSelf:'stretch', background:`linear-gradient(transparent, ${C.border}, transparent)`, minWidth:1, display:'flex' }} />
            <HowStep num="02" title="Receive offers" desc="Lenders in your city respond with their items and proposed prices. Compare and choose the best fit." delay={0.12} />
            <div style={{ width:1, alignSelf:'stretch', background:`linear-gradient(transparent, ${C.border}, transparent)`, minWidth:1, display:'flex' }} />
            <HowStep num="03" title="Meet & exchange" desc="Confirm the booking, pay securely through your wallet, meet up, use the item, and leave a review." delay={0.24} />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'4rem 2rem 6rem', background:'rgba(128,0,32,0.03)', borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <h2 className="reveal" style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2.2rem', fontWeight:700, color:C.textDark, letterSpacing:'-0.02em', textAlign:'center', marginBottom:'2.5rem' }}>
            What the community says
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'1.25rem' }}>
            {[
              { name:'Hamza R.', city:'Lahore', text:'Borrowed a DSLR for my cousin\'s wedding. Saved me Rs. 15,000 and the lender was super helpful.', stars:5 },
              { name:'Sana M.', city:'Karachi', text:'Listed my drill kit and it\'s been rented 6 times already. Pocket money without doing much!', stars:5 },
              { name:'Ali K.', city:'Islamabad', text:'The whole process — request, offer, payment — is smooth. Feels very trustworthy.', stars:5 },
            ].map((t, i) => (
              <div key={i} className={`testimonial-card reveal delay-${i+1}`}>
                <div style={{ display:'flex', gap:3, marginBottom:'0.75rem' }}>
                  {Array.from({length:t.stars}).map((_,s) => (
                    <span key={s} style={{ color:C.saffron, fontSize:'0.9rem' }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize:'0.95rem', color:C.textDark, lineHeight:1.65, marginBottom:'1rem', fontStyle:'italic' }}>"{t.text}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg, ${C.saffron}, ${C.maroon})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'0.9rem' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight:700, fontSize:'0.88rem', color:C.textDark, margin:0 }}>{t.name}</p>
                    <p style={{ fontSize:'0.78rem', color:C.textFaint, margin:0 }}>{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'7rem 2rem 9rem', textAlign:'center' }}>
        <div className="reveal" style={{ maxWidth:620, margin:'0 auto' }}>
          {/* Decorative line */}
          <div style={{ display:'flex', alignItems:'center', gap:16, justifyContent:'center', marginBottom:'2rem' }}>
            <div style={{ flex:1, height:1, background:`linear-gradient(to right, transparent, ${C.border})` }} />
            <div style={{ width:8, height:8, borderRadius:'50%', background:C.saffron }} />
            <div style={{ flex:1, height:1, background:`linear-gradient(to left, transparent, ${C.border})` }} />
          </div>

          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'3rem', fontWeight:700, color:C.textDark, letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:'1.2rem' }}>
            Ready to start<br /><em style={{ color:C.maroon }}>sharing</em>?
          </h2>
          <p style={{ fontSize:'1.05rem', color:C.textMuted, lineHeight:1.7, marginBottom:'2.5rem' }}>
            Join thousands of Pakistanis already lending and borrowing within their communities.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/signup" className="cta-primary">
              Create Free Account
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link to="/requests" className="cta-outline">View Open Requests</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
