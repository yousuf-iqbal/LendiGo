import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomeMapWidget from '../components/HomeMapWidget';

const C = {
  saffron: '#F4A020',
  saffronDark: '#E08800',
  saffronPale: '#FFF0CC',
  maroon: '#800020',
  maroonDeep: '#5C0018',
  maroonLight: '#B00030',
  brownLight: '#C4956A',
  cream: '#FDF6EC',
  warmWhite: '#FFF9F0',
  textDark: '#2C1810',
  textMuted: '#6B4C3B',
  textFaint: '#A68070',
  border: 'rgba(128,0,32,0.12)',
};

function StatPill({ value, label }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          
          // Check if value contains "Free" (not a number)
          if (value === 'Free') {
            setCount('Free');
            return;
          }
          
          // Extract number from value (e.g., "500+" -> 500)
          const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
          const suffix = value.includes('+') ? '+' : '';
          
          const duration = 1500;
          const stepTime = 20;
          const steps = duration / stepTime;
          const increment = numericValue / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
              setCount(numericValue + suffix);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current) + suffix);
            }
          }, stepTime);
        }
      },
      { threshold: 0.5 }
    );
    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      ref={elementRef}
      className="reveal"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        background: 'rgba(255, 249, 240, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        minWidth: 130,
        transition: 'all 0.3s ease',
      }}
    >
      <span
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '2.5rem',
          fontWeight: 700,
          background: `linear-gradient(135deg, ${C.maroon}, ${C.saffron})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}
      >
        {count || value}
      </span>
      <span style={{ fontSize: '0.8rem', color: C.textMuted, marginTop: 8, fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

function HowStep({ num, title, desc }) {
  return (
    <div className="reveal" style={{ flex: 1, minWidth: 220 }}>
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${C.saffron}, ${C.maroon})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.6rem',
          fontWeight: 700,
          color: '#fff',
          marginBottom: '1.2rem',
          boxShadow: '0 8px 20px rgba(244,160,32,0.3)',
          transition: 'transform 0.3s ease',
        }}
        className="step-icon"
      >
        {num}
      </div>
      <h3
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.4rem',
          fontWeight: 700,
          color: C.textDark,
          marginBottom: '0.6rem',
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: '0.95rem', color: C.textMuted, lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

function CategoryChip({ label }) {
  return (
    <div
      className="reveal"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.7rem 1.3rem',
        background: 'rgba(255, 249, 240, 0.8)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${C.border}`,
        borderRadius: 999,
        fontSize: '0.9rem',
        fontWeight: 600,
        color: C.textDark,
        transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.saffron;
        e.currentTarget.style.color = '#fff';
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
        e.currentTarget.style.borderColor = C.saffron;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 249, 240, 0.8)';
        e.currentTarget.style.color = C.textDark;
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      {label}
    </div>
  );
}

function TestimonialCard({ name, city, text }) {
  return (
    <div
      className="reveal"
      style={{
        background: 'rgba(255, 249, 240, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        padding: '1.75rem',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(128,0,32,0.15)';
        e.currentTarget.style.borderColor = C.saffron;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={C.saffron}
            stroke="none"
          >
            <polygon points="12 17.27 18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21 12 17.27" />
          </svg>
        ))}
      </div>
      <p
        style={{
          fontSize: '0.95rem',
          color: C.textDark,
          lineHeight: 1.65,
          marginBottom: '1.25rem',
          fontStyle: 'italic',
        }}
      >
        "{text}"
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.saffron}, ${C.maroon})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.1rem',
          }}
        >
          {name[0]}
        </div>
        <div>
          <p style={{ fontWeight: 700, color: C.textDark, margin: 0 }}>{name}</p>
          <p style={{ fontSize: '0.8rem', color: C.textFaint, margin: 0 }}>{city}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mapRequests, setMapRequests] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('udhaari_user') || 'null');
    } catch {
      return null;
    }
  })();
  const isLoggedIn = !!(user || storedUser);

  useEffect(() => {
    const fetchRequestsWithLocation = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/requests');
        const data = await response.json();
        const requestsWithLocation = data.filter((r) => r.lat && r.lng);
        setMapRequests(requestsWithLocation);
      } catch (err) {
        console.error('Failed to fetch requests for map:', err);
      }
    };
    fetchRequestsWithLocation();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        position: 'relative',
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      {/* Animated Gradient Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            #FFF9F0 0%, 
            #FDF6EC 25%, 
            #F5E6D3 50%, 
            #EDD6C0 75%, 
            #E5C6AD 100%)`,
          transition: 'background 0.3s ease',
          zIndex: -2,
        }}
      />

      {/* Animated Floating Orbs */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: -1,
        }}
      >
        <div
          className="orb orb-1"
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            background: `radial-gradient(circle, ${C.saffron}15, transparent)`,
            borderRadius: '50%',
            top: '-100px',
            left: '-100px',
            animation: 'floatOrb 20s ease-in-out infinite',
          }}
        />
        <div
          className="orb orb-2"
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            background: `radial-gradient(circle, ${C.maroon}10, transparent)`,
            borderRadius: '50%',
            bottom: '-200px',
            right: '-100px',
            animation: 'floatOrb 25s ease-in-out infinite reverse',
          }}
        />
        <div
          className="orb orb-3"
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${C.brownLight}15, transparent)`,
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            animation: 'floatOrb 18s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500&family=Outfit:wght@300;400;500;600;700;800&display=swap');

        .reveal {
          opacity: 0;
          transform: translateY(40px) scale(0.95);
          transition: opacity 0.7s cubic-bezier(0.2, 0.9, 0.4, 1.1), 
                      transform 0.7s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        
        .reveal.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(50px, -50px) scale(1.1) rotate(120deg); }
          66% { transform: translate(-30px, 40px) scale(0.9) rotate(240deg); }
        }

        .hero-letter {
          display: inline-block;
          cursor: default;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .hero-letter:hover {
          color: #F4A020 !important;
          transform: translateY(-8px) rotate(-2deg) scale(1.1);
          text-shadow: 0 10px 20px rgba(128,0,32,0.2);
        }

        .step-icon:hover {
          transform: translateY(-5px) scale(1.05) rotate(5deg) !important;
        }

        .cta-primary {
          background: linear-gradient(135deg, #800020, #5C0018);
          color: #fff;
          padding: 0.9rem 2.5rem;
          border-radius: 50px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 20px rgba(128,0,32,0.35);
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          position: relative;
          overflow: hidden;
        }
        
        .cta-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(244,160,32,0.3), transparent);
          transition: left 0.5s ease;
        }
        
        .cta-primary:hover::before {
          left: 100%;
        }
        
        .cta-primary:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 8px 30px rgba(244,160,32,0.4);
        }

        .cta-outline {
          background: transparent;
          color: #2C1810;
          padding: 0.85rem 2.2rem;
          border-radius: 50px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          border: 2px solid rgba(128,0,32,0.25);
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        
        .cta-outline:hover {
          border-color: #800020;
          background: rgba(128,0,32,0.08);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(128,0,32,0.1);
        }

        @keyframes pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(244,160,32,0.6); }
          70% { box-shadow: 0 0 0 10px rgba(244,160,32,0); }
          100% { box-shadow: 0 0 0 0 rgba(244,160,32,0); }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 68px !important; }
          .stats-row, .cta-row { flex-wrap: wrap !important; }
          .how-grid { flex-direction: column !important; }
        }
      `}</style>

      {/* HERO SECTION */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 2rem 80px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 900 }}>
          <div
            className="reveal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(244,160,32,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(244,160,32,0.3)',
              borderRadius: 999,
              padding: '8px 20px',
              marginBottom: '2rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: C.maroon,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: C.saffron,
                display: 'inline-block',
                animation: 'pulse-dot 1.5s infinite',
              }}
            />
            Pakistan's Community Lending Platform
          </div>

          <h1
            className="hero-title"
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 120,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 0.92,
              marginBottom: '1.8rem',
            }}
          >
            {'Lendigo'.split('').map((l, i) => (
              <span
                key={i}
                className="hero-letter"
                style={{
                  color: i === 0 ? C.maroon : C.textDark,
                  display: 'inline-block',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {l}
              </span>
            ))}
          </h1>

          <p
            className="reveal"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.8rem',
              fontStyle: 'italic',
              color: C.textMuted,
              marginBottom: '1rem',
              fontWeight: 500,
            }}
          >
            Borrow what you need. Lend what you have.
          </p>

          <p
            className="reveal"
            style={{
              fontSize: '1.1rem',
              color: C.textMuted,
              lineHeight: 1.7,
              maxWidth: 560,
              margin: '0 auto 2.5rem',
            }}
          >
            Need a drill for one afternoon? A camera for the weekend? Your neighbourhood has it — no
            purchase needed.
          </p>

          <div className="reveal cta-row" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
            {isLoggedIn ? (
              <>
                <button onClick={() => navigate('/browse')} className="cta-primary">
                  Browse Listings
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <button onClick={() => navigate('/post-request')} className="cta-outline">
                  Post a Request
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="cta-primary">
                  Start Lending & Borrowing
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/browse" className="cta-outline">
                  Explore Listings
                </Link>
              </>
            )}
          </div>

          <div className="stats-row" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <StatPill value="500+" label="Assets Listed" />
            <StatPill value="1.2k+" label="Successful Loans" />
            <StatPill value="4.9" label="Avg Rating" />
            <StatPill value="Free" label="To Join" />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '5rem 2rem',
          background: 'rgba(128,0,32,0.03)',
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p
            className="reveal"
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: C.textFaint,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            Popular Categories
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {[
              'Cameras',
              'Tools',
              'Books',
              'Instruments',
              'Luggage',
              'Electronics',
              'Camping Gear',
              'Gaming',
              'Garden',
              'Craft Supplies',
              'Lab Equipment',
              'Event Items',
            ].map((label) => (
              <CategoryChip key={label} label={label} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: 'relative', zIndex: 1, padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '3rem',
                fontWeight: 700,
                color: C.textDark,
                letterSpacing: '-0.02em',
              }}
            >
              How Lendigo Works
            </h2>
            <p style={{ fontSize: '1.1rem', color: C.textMuted, marginTop: 12 }}>
              Three simple steps from need to borrow
            </p>
          </div>
          <div
            className="how-grid"
            style={{ display: 'flex', gap: '4rem', alignItems: 'flex-start', flexWrap: 'wrap' }}
          >
            <HowStep num="01" title="Post your request" desc="Tell the community what you need, when you need it, and your budget. Takes under a minute." />
            <div
              style={{
                width: 1,
                alignSelf: 'stretch',
                background: `linear-gradient(transparent, ${C.border}, transparent)`,
                minWidth: 1,
              }}
            />
            <HowStep num="02" title="Receive offers" desc="Lenders in your city respond with their items and proposed prices. Compare and choose the best fit." />
            <div
              style={{
                width: 1,
                alignSelf: 'stretch',
                background: `linear-gradient(transparent, ${C.border}, transparent)`,
                minWidth: 1,
              }}
            />
            <HowStep num="03" title="Meet & exchange" desc="Confirm the booking, pay securely through your wallet, meet up, use the item, and leave a review." />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '5rem 2rem 7rem',
          background: 'rgba(128,0,32,0.03)',
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2
            className="reveal"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: C.textDark,
              letterSpacing: '-0.02em',
              textAlign: 'center',
              marginBottom: '3rem',
            }}
          >
            What the community says
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            <TestimonialCard
              name="Hamza R."
              city="Lahore"
              text="Borrowed a DSLR for my cousin's wedding. Saved me Rs. 15,000 and the lender was super helpful."
            />
            <TestimonialCard
              name="Sana M."
              city="Karachi"
              text="Listed my drill kit and it's been rented 6 times already. Pocket money without doing much!"
            />
            <TestimonialCard
              name="Ali K."
              city="Islamabad"
              text="The whole process — request, offer, payment — is smooth. Feels very trustworthy."
            />
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '5rem 2rem 8rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              justifyContent: 'center',
              marginBottom: '2.5rem',
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(to right, transparent, ${C.border})`,
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: C.saffron,
                animation: 'pulse-dot 1.5s infinite',
              }}
            />
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(to left, transparent, ${C.border})`,
              }}
            />
          </div>
          {isLoggedIn ? (
            <>
              <h2
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '3rem',
                  fontWeight: 700,
                  color: C.textDark,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                  marginBottom: '1.2rem',
                }}
              >
                What will you
                <br />
                <em style={{ color: C.maroon }}>lend today</em>?
              </h2>
              <p
                style={{
                  fontSize: '1.1rem',
                  color: C.textMuted,
                  lineHeight: 1.7,
                  marginBottom: '2.5rem',
                }}
              >
                Your community is active right now. List an asset or post a new request.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/my-assets/add')} className="cta-primary">
                  List an Asset
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <button onClick={() => navigate('/requests')} className="cta-outline">
                  Browse Requests
                </button>
              </div>
            </>
          ) : (
            <>
              <h2
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '3rem',
                  fontWeight: 700,
                  color: C.textDark,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                  marginBottom: '1.2rem',
                }}
              >
                Ready to start
                <br />
                <em style={{ color: C.maroon }}>sharing</em>?
              </h2>
              <p
                style={{
                  fontSize: '1.1rem',
                  color: C.textMuted,
                  lineHeight: 1.7,
                  marginBottom: '2.5rem',
                }}
              >
                Join thousands of Pakistanis already lending and borrowing within their communities.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/auth" className="cta-primary">
                  Create Free Account
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/requests" className="cta-outline">
                  View Open Requests
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* MAP WIDGET */}
      <HomeMapWidget requests={mapRequests} />
    </div>
  );
}