import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  enableDemoMode,
  isConfigured,
} from '../utils/auth';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSignup = searchParams.get('signup') === 'true';

  const [mode, setMode] = useState<'login' | 'signup' | 'confirm'>(
    isSignup ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        await registerWithEmail(email, password, name);
        setMode('confirm');
      } else {
        await loginWithEmail(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    enableDemoMode();
    navigate('/dashboard');
  };

  const authConfigured = isConfigured();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Left side - branding */}
        <div className={styles.branding}>
          <Link to="/" className={styles.logo}>
            <Sparkles size={32} />
            <span>SimpleNotes</span>
          </Link>
          <h1 className={styles.brandTitle}>
            Organize your life,{' '}
            <span className={styles.gradient}>together</span>
          </h1>
          <p className={styles.brandSubtitle}>
            Share shopping lists, checklists, and notes with your household.
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureCheck}>&#10003;</div>
              <span>Real-time sync across devices</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureCheck}>&#10003;</div>
              <span>Invite family members easily</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureCheck}>&#10003;</div>
              <span>Works offline, syncs when online</span>
            </div>
          </div>
        </div>

        {/* Right side - form */}
        <div className={styles.formContainer}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>
              {mode === 'signup'
                ? 'Create your account'
                : mode === 'confirm'
                ? 'Verify your email'
                : 'Welcome back'}
            </h2>
            <p className={styles.formSubtitle}>
              {mode === 'signup'
                ? 'Start organizing with your household'
                : mode === 'confirm'
                ? 'Check your email for a verification link'
                : 'Sign in to continue'}
            </p>

            {error && <div className={styles.error}>{error}</div>}

            {mode === 'confirm' ? (
              <div className={styles.confirmMessage}>
                <p>
                  We've sent a verification link to <strong>{email}</strong>.
                </p>
                <p>Please check your email and click the link to verify your account.</p>
                <button
                  onClick={() => setMode('login')}
                  className={styles.linkButton}
                >
                  Back to login
                </button>
              </div>
            ) : (
              <>
                {/* Google Login */}
                {authConfigured && (
                  <>
                    <button
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className={styles.googleButton}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </button>

                    <div className={styles.divider}>
                      <span>or</span>
                    </div>
                  </>
                )}

                {/* Email form */}
                <form onSubmit={handleEmailLogin} className={styles.form}>
                  {mode === 'signup' && (
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Name</label>
                      <div className={styles.inputWrapper}>
                        <User size={18} className={styles.inputIcon} />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          required
                          className={styles.input}
                        />
                      </div>
                    </div>
                  )}

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Email</label>
                    <div className={styles.inputWrapper}>
                      <Mail size={18} className={styles.inputIcon} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Password</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={18} className={styles.inputIcon} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.submitButton}
                  >
                    {loading ? (
                      <span className={styles.spinner} />
                    ) : (
                      <>
                        {mode === 'signup' ? 'Create Account' : 'Sign In'}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <p className={styles.toggleMode}>
                  {mode === 'signup' ? (
                    <>
                      Already have an account?{' '}
                      <button
                        onClick={() => setMode('login')}
                        className={styles.linkButton}
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{' '}
                      <button
                        onClick={() => setMode('signup')}
                        className={styles.linkButton}
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </p>

                {/* Demo mode for development */}
                {!authConfigured && (
                  <div className={styles.demoSection}>
                    <div className={styles.divider}>
                      <span>or</span>
                    </div>
                    <button onClick={handleDemoMode} className={styles.demoButton}>
                      Try Demo Mode
                    </button>
                    <p className={styles.demoNote}>
                      Auth not configured. Use demo mode for testing.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
