import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock3,
  HandCoins,
  MapPin,
  Package,
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
import heroAsset from '../assets/hero.png';
import './HomePage.css';

const MotionDiv = motion.div;
const MotionImg = motion.img;
const MotionH1 = motion.h1;
const MotionP = motion.p;

const metrics = [
  { value: 1280, suffix: '+', label: 'community requests' },
  { value: 860, suffix: '+', label: 'orders completed' },
  { value: 420, suffix: '+', label: 'trusted lenders' },
  { value: 4.9, suffix: '/5', label: 'average rating', decimals: 1 },
];

const categories = [
  'Cameras',
  'Tools',
  'Books',
  'Audio gear',
  'Event decor',
  'Luggage',
  'Gaming',
  'Lab kits',
  'Projectors',
  'Camping',
];

const reviews = [
  'Borrowed a DSLR for a wedding shoot and returned it the next morning. Smooth, local, affordable.',
  'My drill kit finally earns money instead of gathering dust. Udhaari made lending feel simple.',
  'Posted a request at night and had three offers by breakfast. The map view is genuinely useful.',
  'Needed speakers for a university event. Found them nearby, paid safely, done.',
  'The reviews and wallet flow make it easier to trust people outside my immediate circle.',
  'I listed my camera lens and recovered half its monthly EMI through weekend rentals.',
];

const stackCards = [
  {
    eyebrow: 'Step 01',
    title: 'Post the need before you buy the thing.',
    copy: 'A request captures what you need, when you need it, where pickup works, and what budget feels fair.',
    metric: '58 sec',
    metricLabel: 'average post time',
    icon: UploadCloud,
    cta: 'Post a request',
    href: '/post-request',
  },
  {
    eyebrow: 'Step 02',
    title: 'Watch nearby offers stack into real choices.',
    copy: 'Compare lenders by price, distance, rating, and item details without turning your inbox into a negotiation maze.',
    metric: '3.4x',
    metricLabel: 'more options locally',
    icon: Search,
    cta: 'Browse listings',
    href: '/browse',
  },
  {
    eyebrow: 'Step 03',
    title: 'Borrow with a wallet trail and visible trust.',
    copy: 'Bookings, payments, reviews, and return status keep both sides clear from handoff to return.',
    metric: '4.9',
    metricLabel: 'community rating',
    icon: ShieldCheck,
    cta: 'View requests',
    href: '/requests',
  },
  {
    eyebrow: 'Step 04',
    title: 'Turn idle assets into neighborhood utility.',
    copy: 'Every completed order teaches the market what your area can share next: cameras, drills, projectors, books, and more.',
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
  return (
    <div className={`landing-loader ${leaving ? 'landing-loader--leaving' : ''}`} aria-label="Loading Lendigo">
      <div className="loader-word">
        <span>L</span><span>e</span><span>n</span><span>d</span><span>i</span><span>g</span><span>o</span>
      </div>
      <svg className="loader-stroke" viewBox="0 0 360 52" aria-hidden="true">
        <path d="M16 31 C 82 5, 126 48, 182 24 S 286 4, 344 28" />
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
    <div className="hero-cinematic" aria-label="Animated lending marketplace illustration">
      <div className="hero-cinematic__wind hero-cinematic__wind--one" />
      <div className="hero-cinematic__wind hero-cinematic__wind--two" />
      <div className="hero-cinematic__wind hero-cinematic__wind--three" />

      <div className="hero-portal">
        <div className="hero-portal__ring" />
        <div className="hero-portal__inner-light" />
        <MotionImg
          src={heroAsset}
          alt=""
          className="hero-portal__core"
          animate={{ y: [0, -16, 0], rotate: [0, 1.8, 0] }}
          transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="hero-handoff">
          <div className="hero-handoff__hand hero-handoff__hand--left" />
          <div className="hero-handoff__item">
            <Package size={24} />
          </div>
          <div className="hero-handoff__hand hero-handoff__hand--right" />
        </div>
      </div>

      <div className="hero-orbit-item hero-orbit-item--camera"><Camera size={20} /></div>
      <div className="hero-orbit-item hero-orbit-item--tool"><Wrench size={20} /></div>
      <div className="hero-orbit-item hero-orbit-item--package"><PackageCheck size={20} /></div>
      <div className="hero-scene-floor" />

      <MotionDiv className="hero-float-card hero-float-card--request" animate={{ y: [0, -13, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}>
        <Clock3 size={19} />
        <div>
          <strong>New request</strong>
          <span>Projector needed tonight</span>
        </div>
      </MotionDiv>

      <MotionDiv className="hero-float-card hero-float-card--match" animate={{ y: [0, 12, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}>
        <MapPin size={19} />
        <div>
          <strong>Nearby match</strong>
          <span>1.2 km from Gulberg</span>
        </div>
      </MotionDiv>

      <MotionDiv className="hero-float-card hero-float-card--trust" animate={{ y: [0, -10, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}>
        <BadgeCheck size={19} />
        <div>
          <strong>Verified lender</strong>
          <span>4.9 rating</span>
        </div>
      </MotionDiv>
    </div>
  );
}

function ScrollStackSection() {
  return (
    <section className="scroll-stack-section">
      <div className="scroll-stack-heading">
        <p className="section-kicker reveal">Scroll stack story</p>
        <h2 className="section-title reveal">Every exchange becomes a little card of trust.</h2>
        <p className="section-lede reveal">
          The story stacks as you scroll: need, match, booking, return. It makes the product feel clear without slowing the page down.
        </p>
      </div>

      <div className="scroll-stack">
        {stackCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <article className="scroll-stack-card" style={{ '--stack-top': `${104 + index * 18}px`, '--stack-index': index }} key={card.title}>
              <div className="scroll-stack-card__media">
                <div className="stack-icon">
                  <Icon size={34} />
                </div>
                <div className="stack-flow-line" />
                <div className="stack-mini-card stack-mini-card--one">
                  <CheckCircle2 size={17} />
                  <span>Clear terms</span>
                </div>
                <div className="stack-mini-card stack-mini-card--two">
                  <UsersRound size={17} />
                  <span>Local trust</span>
                </div>
              </div>

              <div className="scroll-stack-card__copy">
                <span>{card.eyebrow}</span>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
                <Link className="scroll-stack-card__cta" to={card.href}>
                  {card.cta} <ArrowRight size={16} />
                </Link>
              </div>

              <div className="scroll-stack-card__metric">
                <strong>{card.metric}</strong>
                <small>{card.metricLabel}</small>
              </div>
            </article>
          );
        })}
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
    const exitTimer = window.setTimeout(() => setIntroLeaving(true), 5600);
    const removeTimer = window.setTimeout(() => setShowIntro(false), 6350);
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
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="landing-hero__content">
          <MotionDiv
            className="landing-pill liquid-glass"
            initial={{ opacity: 0, y: 28, filter: 'blur(18px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Sparkles size={15} />
            Pakistan's neighborhood lending network
          </MotionDiv>

          <MotionH1
            initial={{ opacity: 0, y: 38, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            Lend what rests.
            <span>Borrow what moves.</span>
          </MotionH1>

          <MotionP
            initial={{ opacity: 0, y: 32, filter: 'blur(16px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.85, delay: 0.42 }}
          >
            A cinematic local marketplace where unused cameras, tools, books, and gear become useful again through trusted short-term borrowing.
          </MotionP>

          <MotionDiv
            className="landing-hero__actions"
            initial={{ opacity: 0, y: 24, filter: 'blur(14px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.8, delay: 0.55 }}
          >
            {isLoggedIn ? (
              <>
                <button className="landing-btn landing-btn--primary" onClick={() => navigate('/browse')} type="button">
                  Browse listings <ArrowRight size={18} />
                </button>
                <button className="landing-btn landing-btn--glass liquid-glass" onClick={() => navigate('/post-request')} type="button">
                  Post a request
                </button>
              </>
            ) : (
              <>
                <Link className="landing-btn landing-btn--primary" to="/auth">
                  Start lending <ArrowRight size={18} />
                </Link>
                <Link className="landing-btn landing-btn--glass liquid-glass" to="/browse">
                  Explore listings
                </Link>
              </>
            )}
          </MotionDiv>

          <MotionDiv
            className="hero-proof-row"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.72 }}
          >
            <span><Camera size={16} /> cameras</span>
            <span><Wrench size={16} /> tools</span>
            <span><ShieldCheck size={16} /> verified handoffs</span>
          </MotionDiv>
        </div>

        <MotionDiv
          className="landing-hero__visual"
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(18px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0)' }}
          transition={{ duration: 0.95, delay: 0.36 }}
        >
          <HeroIllustration />
        </MotionDiv>
      </section>

      <section className="metric-section">
        <div className="metric-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      <ScrollStackSection />

      <section className="category-section">
        <p className="section-kicker reveal">Popular right now</p>
        <h2 className="section-title reveal">Requests move fastest when they feel specific.</h2>
        <div className="category-ribbon reveal">
          {categories.concat(categories).map((category, index) => (
            <Link to={`/browse?category=${encodeURIComponent(category)}`} key={`${category}-${index}`}>
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="review-section">
        <div className="review-section__header">
          <p className="section-kicker reveal">Social proof</p>
          <h2 className="section-title reveal">The best listings start with trust.</h2>
        </div>
        <div className="review-marquee" aria-label="Community reviews">
          <div className="review-track">
            {reviews.concat(reviews).map((review, index) => (
              <article className="review-card" key={`${review}-${index}`}>
                <div>
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} size={16} fill="currentColor" />
                  ))}
                </div>
                <p>{review}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta reveal">
        <h2>Ready to put your unused things to work?</h2>
        <p>List an asset, answer a request, or browse what your city is already sharing.</p>
        {isLoggedIn ? (
          <button className="landing-btn landing-btn--primary" onClick={() => navigate('/my-assets/add')} type="button">
            List an asset <ArrowRight size={18} />
          </button>
        ) : (
          <Link className="landing-btn landing-btn--primary" to="/auth">
            Create free account <ArrowRight size={18} />
          </Link>
        )}
      </section>
    </main>
  );
}
