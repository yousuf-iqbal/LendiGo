import { Link } from 'react-router-dom';
export default function HomePage() {
  return (
    <div style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.hero}>
          <div style={styles.badge} className="badge-open">Beta</div>
          <h1 style={styles.title}>
            Share & Borrow
            <span className="text-gradient"> Anything</span>
          </h1>
          <h1 style={styles.title}>
            With Your Community
          </h1>
          <p style={styles.subtitle}>
            Udhaari connects people who need items with those who have them.
            Borrow tools, electronics, and more - for free or for a small fee.
          </p>
          <div style={styles.buttons}>
            <Link to="/signup" className="btn-primary" style={styles.primaryBtn}>
              Get Started
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <Link to="/browse" className="btn-secondary" style={styles.secondaryBtn}>
              Browse Items
            </Link>
          </div>
        </div>
        <div className="grid grid-3" style={styles.features}>
          <div className="card" style={styles.featureCard}>
            <div style={styles.featureIcon}>🔍</div>
            <h3 style={styles.featureTitle}>Find What You Need</h3>
            <p style={styles.featureDesc}>Search thousands of items available for borrowing in your area</p>
          </div>
          <div className="card" style={styles.featureCard}>
            <div style={styles.featureIcon}>🤝</div>
            <h3 style={styles.featureTitle}>Trusted Community</h3>
            <p style={styles.featureDesc}>Connect with verified users and build your reputation</p>
          </div>
          <div className="card" style={styles.featureCard}>
            <div style={styles.featureIcon}>💰</div>
            <h3 style={styles.featureTitle}>Earn or Save</h3>
            <p style={styles.featureDesc}>Lend items to earn extra income or borrow to save money</p>
          </div>
        </div>
      </div>
    </div>
  );
}
const styles = {
  page: {
    minHeight: 'calc(100vh - 70px)',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 100%)',
  },
  container: {
    padding: '60px 24px',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '80px',
  },
  badge: {
    display: 'inline-block',
    marginBottom: '20px',
  },
  title: {
    fontSize: '56px',
    fontWeight: 800,
    fontFamily: "'Syne', sans-serif",
    marginBottom: '16px',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '18px',
    color: '#a1a1aa',
    maxWidth: '600px',
    margin: '24px auto',
    lineHeight: '1.6',
  },
  buttons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '32px',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  features: {
    marginTop: '40px',
  },
  featureCard: {
    textAlign: 'center',
    padding: '32px',
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '12px',
    color: 'white',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#a1a1aa',
    lineHeight: '1.5',
  }
};
