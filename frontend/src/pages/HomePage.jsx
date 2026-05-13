import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LottieRaw from 'lottie-react';
const Lottie = LottieRaw?.default ?? LottieRaw;
import handshakeAnimation from '../assets/Handshake between two people.json';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock3,
  HandCoins,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const MotionDiv = motion.div;
const MotionH1 = motion.h1;
const MotionP = motion.p;

const metrics = [
  { value: 1280, suffix: '+', label: 'people begging for stuff' },
  { value: 860, suffix: '+', label: 'actual successful trades' },
  { value: 420, suffix: '+', label: 'trustworthy neighbors' },
  { value: 4.9, suffix: '/5', label: 'community vibes', decimals: 1 },
];

const categories = [
  'Cameras', 'Tools', 'Books', 'Audio gear', 'Event decor',
  'Luggage', 'Gaming', 'Lab kits', 'Projectors', 'Camping',
];

const reviews = [
  'Borrowed a DSLR for a wedding shoot. No "dude where\'s my camera" drama. Actually got it back. Wild.',
  'My drill finally pays taxes. It was just sitting there judging me. Now I\'m judging people who don\'t use Udhaari.',
  'Found a projector 1.2km away at 3am. Showed up. Paid. Left. No scams. My mom was shocked.',
  'Needed a sound system for a rave. Got it. Used it. Returned it. All my friends are now on Udhaari.',
  'I didn\'t expect to trust strangers this easily. But the 4.9 rating and reviews hit different.',
  'Made half my camera\'s monthly EMI by just... renting it on weekends. Where has Udhaari been all my life?',
];

const stackCards = [
  {
    eyebrow: 'Step 01',
    title: 'Cry for help (tastefully).',
    copy: 'Tell us what you need without committing your paycheck. We\'ll find it locally before your mom asks "why are you buying that?"',
    metric: '58 sec',
    metricLabel: 'average post time',
    icon: UploadCloud,
    cta: 'Post a request',
    href: '/post-request',
  },
  {
    eyebrow: 'Step 02',
    title: 'Watch offers flood in (for once).',
    copy: 'Stop your inbox from becoming a dumpster fire. Compare prices, ratings, and how far people are willing to drive.',
    metric: '3.4x',
    metricLabel: 'more options locally',
    icon: Search,
    cta: 'Browse listings',
    href: '/browse',
  },
  {
    eyebrow: 'Step 03',
    title: 'Borrow with receipts (literally).',
    copy: 'Payments tracked, items returned, trust earned. It\'s boring but it works. Your stuff will actually come back.',
    metric: '4.9',
    metricLabel: 'community rating',
    icon: ShieldCheck,
    cta: 'View requests',
    href: '/requests',
  },
  {
    eyebrow: 'Step 04',
    title: 'Rent your dust collectors.',
    copy: 'That projector sitting in your cupboard? It can pay its own EMI. Cameras, tools, speakers... everything becomes money.',
    metric: '860+',
    metricLabel: 'completed orders',
    icon: HandCoins,
    cta: 'List an asset',
    href: '/my-assets/add',
  },
];

function useCountUp(target, active, decimals = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let frameId;
    const start = performance.now();
    const duration = 1800;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((target * eased).toFixed(decimals)));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, decimals, target]);
  return value;
}

function LoadingIntro({ leaving }) {
  const letters = 'Lendigo'.split('');
  return (
    <div className={`landing-loader ${leaving ? 'landing-loader--leaving' : ''}`} aria-label="Loading Lendigo">
      <div className="loader-letter-container">
        {letters.map((letter, index) => (
          <span
            key={index}
            className="loader-letter"
            style={{ '--letter-index': index }}
          >
            {letter}
          </span>
        ))}
      </div>
      <svg
        className="loader-flourish-svg"
        viewBox="0 0 420 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="flourishGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#800020" />
            <stop offset="50%" stopColor="#f4a020" />
            <stop offset="100%" stopColor="#800020" />
          </linearGradient>
        </defs>
        <path
          className="loader-flourish-path-alt"
          d="M8 28 C 60 8, 120 40, 180 22 C 230 8, 270 36, 320 20 C 355 10, 385 30, 412 18"
        />
      </svg>
    </div>
  );
}

function MetricCard({ metric }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const count = useCountUp(metric.value, active, metric.decimals || 0);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setActive(true);
    }, { threshold: 0.45 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const display = metric.decimals ? count.toFixed(metric.decimals) : Math.round(count).toLocaleString();
  return (
    <div ref={ref} className="landing-metric reveal">
      <strong>{display}{metric.suffix}</strong>
      <span>{metric.label}</span>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="hero-blob-scene" aria-label="Lending marketplace illustration">
      <svg className="hero-blob-svg" viewBox="0 0 500 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="blobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde8c8" />
            <stop offset="45%" stopColor="#f4a020" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#800020" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="blobGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#800020" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#5c0018" />
          </linearGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f4a020" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f4a020" stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <ellipse cx="270" cy="265" rx="200" ry="200" fill="url(#glowGrad)" />
        <path
          d="M260 42 C330 30, 420 80, 440 160 C462 248, 430 340, 370 390 C308 442, 200 450, 140 400 C76 348, 62 250, 82 168 C102 82, 188 56, 260 42 Z"
          fill="url(#blobGrad)"
          className="hero-blob-main"
        />
        <path
          d="M265 88 C316 78, 388 118, 404 188 C420 260, 398 332, 352 370 C304 410, 224 416, 178 376 C130 334, 122 258, 140 192 C158 124, 214 100, 265 88 Z"
          fill="none"
          stroke="rgba(128,0,32,0.14)"
          strokeWidth="1.5"
          className="hero-blob-ring"
        />
      </svg>
      <div className="hero-asset-mosaic">
        <div className="mosaic-item mosaic-item--camera"><Camera size={26} /><span>Camera</span></div>
        <div className="mosaic-item mosaic-item--tools"><Wrench size={26} /><span>Tools</span></div>
        <div className="mosaic-item mosaic-item--package"><PackageCheck size={26} /><span>Gear</span></div>
        <div className="mosaic-item mosaic-item--center">
          <HandCoins size={34} />
          <span>Borrow<br />locally</span>
        </div>
        <div className="mosaic-item mosaic-item--map"><MapPin size={26} /><span>Nearby</span></div>
        <div className="mosaic-item mosaic-item--star"><Star size={26} fill="currentColor" /><span>Trusted</span></div>
      </div>

      <MotionDiv className="hero-float-card hero-float-card--request" animate={{ y: [0, -11, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}>
        <Clock3 size={17} />
        <div><strong>New request</strong><span>Projector needed tonight</span></div>
      </MotionDiv>

      <MotionDiv className="hero-float-card hero-float-card--match" animate={{ y: [0, 10, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}>
        <MapPin size={17} />
        <div><strong>Nearby match</strong><span>1.2 km from Gulberg</span></div>
      </MotionDiv>

      <MotionDiv className="hero-float-card hero-float-card--trust" animate={{ y: [0, -8, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}>
        <BadgeCheck size={17} />
        <div><strong>Verified lender</strong><span>4.9 rating</span></div>
      </MotionDiv>
    </div>
  );
}

// Remove the entire ScrollStackSection function and replace with:

function QuickActionsSection() {
  return (
    <section className="quick-actions-section">
      <div className="quick-actions-container">
        <div className="action-card">
          <h3>Broke but need stuff?</h3>
          <p>Browse listings or cry for help online</p>
          <Link className="action-btn action-btn--primary" to="/browse">
            Find it nearby <ArrowRight size={18} />
          </Link>
        </div>
        
        <div className="action-card">
          <h3>Rich but space poor?</h3>
          <p>Rent out that thing you forgot you own</p>
          <Link className="action-btn action-btn--secondary" to="/my-assets/add">
            Make it work <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showIntro, setShowIntro] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('udhaari_user') || 'null');
    } catch {
      return null;
    }
  }, []);
  const isLoggedIn = !!(user || storedUser);
  useEffect(() => {
    const exitTimer = window.setTimeout(() => setIntroLeaving(true), 1800);
    const removeTimer = window.setTimeout(() => setShowIntro(false), 2500);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <main className="landing-page">
      {showIntro && <LoadingIntro leaving={introLeaving} />}
      <section className="landing-hero">
        <div className="hero-wind-field" aria-hidden="true">
          <span /><span /><span /><span />
        </div>

        <div className="landing-hero__content">
          <MotionDiv className="landing-pill liquid-glass" initial={{ opacity: 0, y: 28, filter: 'blur(18px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0)' }} transition={{ duration: 0.8, delay: 0.2 }}>
            <Sparkles size={15} /> Where your weird neighbor becomes your best friend
          </MotionDiv>

          <MotionH1 initial={{ opacity: 0, y: 38, filter: 'blur(20px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0)' }} transition={{ duration: 0.9, delay: 0.3 }}>
            Lend what rests.<span>Borrow what moves.</span>
          </MotionH1>

          <MotionP initial={{ opacity: 0, y: 32, filter: 'blur(16px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0)' }} transition={{ duration: 0.85, delay: 0.42 }}>
            Why buy a projector you\'ll use twice when your neighbor has one? Borrow locally, save big, stop the wasteful flex.
          </MotionP>

          <MotionDiv className="landing-hero__actions" initial={{ opacity: 0, y: 24, filter: 'blur(14px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0)' }} transition={{ duration: 0.8, delay: 0.55 }}>
            {isLoggedIn ? (
              <>
                <button className="landing-btn landing-btn--primary" onClick={() => navigate('/browse')} type="button">Find stuff nearby  <ArrowRight size={18} /></button>
                <button className="landing-btn landing-btn--glass liquid-glass" onClick={() => navigate('/post-request')} type="button">Ask the internet</button>
              </>
            ) : (
              <>
                <Link className="landing-btn landing-btn--primary" to="/auth">Join the flex  <ArrowRight size={18} /></Link>
                <Link className="landing-btn landing-btn--glass liquid-glass" to="/browse">Stalk listings</Link>
              </>
            )}
          </MotionDiv>

          <MotionDiv className="hero-proof-row" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.72 }}>
            <span><Camera size={16} /> cameras</span>
            <span><Wrench size={16} /> tools</span>
            <span><ShieldCheck size={16} /> verified handoffs</span>
          </MotionDiv>
        </div>

        <MotionDiv className="landing-hero__visual" initial={{ opacity: 0, scale: 0.96, filter: 'blur(18px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0)' }} transition={{ duration: 0.95, delay: 0.36 }}>
          <div className="hero-lottie-wrap">
            <Lottie animationData={handshakeAnimation} loop autoplay style={{ width: '100%', height: '100%' }} />
          </div>
        </MotionDiv>
      </section>

      <section className="metric-section">
        <div className="metric-grid">
          {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
        </div>
      </section>

      <QuickActionsSection />

      <section className="category-section">
        <p className="section-kicker reveal">What are people actually borrowing</p>
        <h2 className="section-title reveal">Stop guessing. Search what everyone else needed last week.</h2>
        <div className="category-ribbon-wrap reveal">
          <div className="category-ribbon-track">
            {categories.concat(categories).concat(categories).map((category, index) => (
              <Link to={`/browse?category=${encodeURIComponent(category)}`} key={`${category}-${index}`} className="category-pill">{category}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="review-section">
        <div className="review-section__header">
          <p className="section-kicker reveal">People actually came back</p>
          <h2 className="section-title reveal">No scams. No drama. Just neighbors being neighbors.</h2>
        </div>
        <div className="review-marquee" aria-label="Community reviews">
          <div className="review-track">
            {reviews.concat(reviews).map((review, index) => (
              <article className="review-card" key={`${review}-${index}`}>
                <div>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}</div>
                <p>{review}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta reveal">
        <h2>Your IKEA shelf deserves better than collecting dust.</h2>
        <p>Either borrow smarter or stop pretending you\'ll use that cake maker.</p>
        {isLoggedIn ? (
          <button className="landing-btn landing-btn--primary" onClick={() => navigate('/my-assets/add')} type="button">List an asset  <ArrowRight size={18} /></button>
        ) : (
          <Link className="landing-btn landing-btn--primary" to="/auth">Create free account  <ArrowRight size={18} /></Link>
        )}
      </section>
    </main>
  );
}