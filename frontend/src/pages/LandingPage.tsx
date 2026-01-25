import { Link } from 'react-router-dom';
import { CheckCircle2, ShoppingCart, FileText, Users, Shield, Zap, Layers, ArrowRight, Lock } from 'lucide-react';
import { useAuthStore } from '../stores/store';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: FileText,
      title: 'Notes & Lists',
      description: 'Create notes, checklists, and shopping lists. Everything you need in one place.',
    },
    {
      icon: Users,
      title: 'Household Sharing',
      description: 'Invite family members and collaborate seamlessly in real-time.',
    },
    {
      icon: Shield,
      title: 'End-to-End Encrypted',
      description: 'Your data is encrypted before it leaves your device. Only you can read it.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant sync across all devices. No lag, no waiting.',
    },
  ];

  const pillars = [
    { icon: Layers, label: 'Simple', description: 'No clutter, just what you need' },
    { icon: Zap, label: 'Efficient', description: 'Fast sync, instant updates' },
    { icon: Lock, label: 'Secure', description: 'E2E encrypted by default' },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Layers className={styles.logoIcon} />
            <span>SimpleNotes</span>
          </div>
          <nav className={styles.nav}>
            {isAuthenticated ? (
              <Link to="/dashboard" className={styles.navButton}>
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className={styles.navLink}>
                  Log in
                </Link>
                <Link to="/login?signup=true" className={styles.navButton}>
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Lock size={14} />
            <span>End-to-end encrypted</span>
          </div>
          <h1 className={styles.heroTitle}>
            Simple. Efficient.{' '}
            <span className={styles.highlight}>Secure.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            The minimalist way to organize notes and lists with your household.
            Your data stays private with end-to-end encryption.
          </p>
          <div className={styles.heroActions}>
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className={styles.buttonPrimary}
            >
              Start for Free
              <ArrowRight size={18} />
            </Link>
            <a href="#features" className={styles.buttonSecondary}>
              Learn More
            </a>
          </div>

          {/* Three Pillars */}
          <div className={styles.pillars}>
            {pillars.map((pillar) => (
              <div key={pillar.label} className={styles.pillar}>
                <div className={styles.pillarIcon}>
                  <pillar.icon size={20} />
                </div>
                <div className={styles.pillarText}>
                  <span className={styles.pillarLabel}>{pillar.label}</span>
                  <span className={styles.pillarDesc}>{pillar.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating cards animation */}
        <div className={styles.heroVisual}>
          <div className={styles.floatingCard} style={{ '--delay': '0s' } as React.CSSProperties}>
            <ShoppingCart size={20} />
            <span>Groceries</span>
            <div className={styles.cardItems}>
              <div className={styles.cardItem}>
                <CheckCircle2 size={12} />
                Milk
              </div>
              <div className={styles.cardItem}>
                <CheckCircle2 size={12} />
                Eggs
              </div>
              <div className={`${styles.cardItem} ${styles.checked}`}>
                <CheckCircle2 size={12} />
                Bread
              </div>
            </div>
          </div>
          <div className={styles.floatingCard} style={{ '--delay': '0.5s' } as React.CSSProperties}>
            <Lock size={16} className={styles.encryptedIcon} />
            <FileText size={20} />
            <span>Private Notes</span>
            <div className={styles.cardItems}>
              <div className={styles.cardItemEncrypted}>
                <span className={styles.encrypted}>Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <div className={styles.featuresContent}>
          <h2 className={styles.sectionTitle}>
            Everything you need,{' '}
            <span className={styles.highlight}>nothing you don't</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Focused features for modern households
          </p>

          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <feature.icon size={24} />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className={styles.security}>
        <div className={styles.securityContent}>
          <div className={styles.securityIcon}>
            <Shield size={48} />
          </div>
          <h2 className={styles.securityTitle}>Your privacy, our priority</h2>
          <p className={styles.securityText}>
            All your notes, lists, and attachments are encrypted on your device before
            being stored. We never see your data — only you and the people you share with can.
          </p>
          <div className={styles.securityFeatures}>
            <div className={styles.securityFeature}>
              <Lock size={16} />
              <span>AES-256 encryption</span>
            </div>
            <div className={styles.securityFeature}>
              <Shield size={16} />
              <span>Zero-knowledge architecture</span>
            </div>
            <div className={styles.securityFeature}>
              <Users size={16} />
              <span>Secure household sharing</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Ready to get organized?
          </h2>
          <p className={styles.ctaSubtitle}>
            Free forever. No credit card required.
          </p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className={styles.buttonPrimary}
          >
            Get Started Free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <Layers size={18} />
            <span>SimpleNotes</span>
          </div>
          <p className={styles.footerText}>
            Simple. Efficient. Secure.
          </p>
        </div>
      </footer>
    </div>
  );
}
