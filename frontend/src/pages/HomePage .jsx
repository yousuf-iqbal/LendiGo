import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.target.classList.add('visible')),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home">
      {/* Animated background */}
      <div className="home__bg">
        <div className="home__orb home__orb--1" />
        <div className="home__orb home__orb--2" />
        <div className="home__orb home__orb--3" />
        <div className="home__grid" />
      </div>

      {/* Hero */}
      <section className="home__hero" ref={heroRef}>
        <div className="home__hero-inner">
          <p className="home__eyebrow reveal">Community lending, reimagined</p>

          <h1 className="home__headline reveal">
            <span className="home__headline-line">Borrow what</span>
            <span className="home__headline-line home__headline-line--accent">you need.</span>
            <span className="home__headline-line">Lend what</span>
            <span className="home__headline-line home__headline-line--accent">you have.</span>
          </h1>

          <p className="home__desc reveal">
            Forgot something for an exam? Need a drill for one afternoon?
            Post a request — your community gets notified instantly.
          </p>

          <div className="home__cta reveal">
            <Link to="/signup" className="home__btn home__btn--primary">
              Join Udhaari
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <Link to="/login" className="home__btn home__btn--ghost">
              Sign in
            </Link>
          </div>

          <div className="home__ticker reveal">
            <div className="home__ticker-track">
              {['Calculator', 'DSLR Camera', 'Screwdriver Set', 'Projector', 'Textbook', 'Extension Cord', 'Tent', 'Bicycle', 'Laptop Charger', 'Board Game',
                'Calculator', 'DSLR Camera', 'Screwdriver Set', 'Projector', 'Textbook', 'Extension Cord', 'Tent', 'Bicycle', 'Laptop Charger', 'Board Game'].map((item, i) => (
                <span key={i} className="home__ticker-item">{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Floating cards */}
        <div className="home__float-cards">
          <div className="home__float-card home__float-card--1 reveal">
            <div className="home__float-card-dot" />
            <span>Calculator needed</span>
            <span className="home__float-card-time">2 min ago</span>
          </div>
          <div className="home__float-card home__float-card--2 reveal">
            <div className="home__float-card-dot home__float-card-dot--green" />
            <span>Offer accepted</span>
            <span className="home__float-card-time">just now</span>
          </div>
          <div className="home__float-card home__float-card--3 reveal">
            <div className="home__float-card-dot home__float-card-dot--amber" />
            <span>Projector available</span>
            <span className="home__float-card-time">5 min ago</span>
          </div>
        </div>
      </section>

      {/* How it works — minimal */}
      <section className="home__how reveal">
        <div className="home__how-inner">
          <div className="home__how-step">
            <span className="home__how-num">01</span>
            <p>Post what you need or list what you have</p>
          </div>
          <div className="home__how-divider" />
          <div className="home__how-step">
            <span className="home__how-num">02</span>
            <p>Community members respond with offers</p>
          </div>
          <div className="home__how-divider" />
          <div className="home__how-step">
            <span className="home__how-num">03</span>
            <p>Meet, exchange, and leave a review</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="home__bottom reveal">
        <h2 className="home__bottom-title">
          Forgot a calculator<br/>for your exam?
        </h2>
        <p className="home__bottom-sub">
          Upload a request right now. We'll let people know you need it —<br/>
          and if anyone has it, they can give it to you free or for a small fee.
        </p>
        <Link to="/signup" className="home__btn home__btn--primary">
          Post a Request
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </section>
    </div>
  );
}
