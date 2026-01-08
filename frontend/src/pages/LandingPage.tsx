import { Link } from 'react-router-dom';
import { CheckCircle2, ShoppingCart, FileText, Users, Sparkles, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/store';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: ShoppingCart,
      title: 'Shopping Lists',
      description: 'Never forget an item. Share lists with your household in real-time.',
      color: '#f59e0b',
    },
    {
      icon: CheckCircle2,
      title: 'Checklists',
      description: 'Track tasks and to-dos. Check off items as you complete them.',
      color: '#10b981',
    },
    {
      icon: FileText,
      title: 'Notes',
      description: 'Quick notes and reminders for you and your family.',
      color: '#6366f1',
    },
    {
      icon: Users,
      title: 'Household Sharing',
      description: 'Invite family members and collaborate in real-time.',
      color: '#f093fb',
    },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Sparkles className={styles.logoIcon} />
            <span>SimpleNotes</span>
          </div>
          <nav className={styles.nav}>
            {isAuthenticated ? (
              <Link to="/dashboard" className={styles.ctaButton}>
                Go to Dashboard
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/login" className={styles.loginLink}>
                  Login
                </Link>
                <Link to="/login?signup=true" className={styles.ctaButton}>
                  Get Started
                  <ArrowRight size={18} />
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
            <Sparkles size={14} />
            <span>Free forever for households</span>
          </div>
          <h1 className={styles.heroTitle}>
            Organize your life,{' '}
            <span className={styles.gradient}>together</span>
          </h1>
          <p className={styles.heroSubtitle}>
            The simplest way to share shopping lists, checklists, and notes
            with your household. Stay organized as a family.
          </p>
          <div className={styles.heroActions}>
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className={styles.primaryButton}
            >
              Start for Free
              <ArrowRight size={20} />
            </Link>
            <a href="#features" className={styles.secondaryButton}>
              See Features
            </a>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>Free</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNumber}>Real-time</span>
              <span className={styles.statLabel}>Sync</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNumber}>Unlimited</span>
              <span className={styles.statLabel}>Lists</span>
            </div>
          </div>
        </div>

        {/* Floating cards animation */}
        <div className={styles.heroVisual}>
          <div className={styles.floatingCard} style={{ '--delay': '0s' } as any}>
            <ShoppingCart size={24} />
            <span>Groceries</span>
            <div className={styles.cardItems}>
              <div className={styles.cardItem}>Milk</div>
              <div className={styles.cardItem}>Eggs</div>
              <div className={styles.cardItem}>Bread</div>
            </div>
          </div>
          <div className={styles.floatingCard} style={{ '--delay': '0.5s' } as any}>
            <CheckCircle2 size={24} />
            <span>Weekend Tasks</span>
            <div className={styles.cardItems}>
              <div className={`${styles.cardItem} ${styles.checked}`}>Clean garage</div>
              <div className={styles.cardItem}>Fix fence</div>
            </div>
          </div>
          <div className={styles.floatingCard} style={{ '--delay': '1s' } as any}>
            <FileText size={24} />
            <span>Notes</span>
            <div className={styles.cardItems}>
              <div className={styles.cardItem}>Call plumber</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <div className={styles.featuresContent}>
          <h2 className={styles.sectionTitle}>
            Everything you need to stay{' '}
            <span className={styles.gradient}>organized</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Simple, powerful features designed for modern households
          </p>

          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <div
                  className={styles.featureIcon}
                  style={{ background: `${feature.color}20`, color: feature.color }}
                >
                  <feature.icon size={28} />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
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
            Join thousands of households already using SimpleNotes
          </p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className={styles.ctaButtonLarge}
          >
            Get Started Free
            <ArrowRight size={24} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <Sparkles size={20} />
            <span>SimpleNotes</span>
          </div>
          <p className={styles.footerText}>
            Made with love for families everywhere
          </p>
        </div>
      </footer>
    </div>
  );
}
