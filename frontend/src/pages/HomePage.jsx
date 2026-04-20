import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
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
      {/* Animated background - clean */}
      <div className="home__bg">
        <div className="home__orb home__orb--1" />
        <div className="home__orb home__orb--2" />
      </div>

      {/* Hero Section */}
      <section className="home__hero" ref={heroRef}>
        <div className="home__hero-inner">
          
          {/* Big Animated Udhaari Logo */}
          <div className="home__logo-container reveal">
            <h1 className="home__logo-main">
              <span className="home__logo-letter">U</span>
              <span className="home__logo-letter">d</span>
              <span className="home__logo-letter">h</span>
              <span className="home__logo-letter">a</span>
              <span className="home__logo-letter">a</span>
              <span className="home__logo-letter">r</span>
              <span className="home__logo-letter">i</span>
            </h1>
          </div>

          <p className="home__tagline reveal">
            Borrow what you need. Lend what you have.
          </p>

          <p className="home__desc reveal">
            Forgot a calculator for an exam? Need a drill for one afternoon?
            Your community is here to help.
          </p>

          <div className="home__cta reveal">
            <Link to="/signup" className="home__btn home__btn--primary">
              Join Udhaari
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <Link to="/login" className="home__btn home__btn--ghost">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
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
          Ready to start sharing?
        </h2>
        <p className="home__bottom-sub">
          Post a request or list an item. Your community is waiting.
        </p>
        <Link to="/signup" className="home__btn home__btn--primary">
          Get Started
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </section>
    </div>
  );
}
