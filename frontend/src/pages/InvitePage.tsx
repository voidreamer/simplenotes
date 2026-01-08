import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, X, Sparkles } from 'lucide-react';
import { useAuthStore } from '../stores/store';
import { api } from '../utils/api';
import styles from './InvitePage.module.css';

interface InviteDetails {
  invite_id: string;
  household_name: string;
  inviter_name: string;
  status: string;
}

export default function InvitePage() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      if (!inviteId) return;

      try {
        const inviteData = await api.getInviteDetails(inviteId) as InviteDetails;
        setInvite(inviteData);
      } catch (err: any) {
        setError(err.message || 'Invite not found or expired');
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [inviteId]);

  const handleAccept = async () => {
    if (!inviteId) return;

    setAccepting(true);
    setError('');

    try {
      await api.acceptInvite(inviteId);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>
            <X size={48} />
          </div>
          <h1>Invite Not Found</h1>
          <p>{error}</p>
          <Link to="/" className={styles.button}>
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon}>
            <Check size={48} />
          </div>
          <h1>Welcome to {invite?.household_name}!</h1>
          <p>Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Sparkles size={32} />
          <span>SimpleNotes</span>
        </div>

        <h1 className={styles.title}>You're Invited!</h1>

        <div className={styles.inviteInfo}>
          <p className={styles.inviterName}>{invite?.inviter_name}</p>
          <p className={styles.inviteText}>
            has invited you to join
          </p>
          <p className={styles.householdName}>{invite?.household_name}</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {isAuthenticated ? (
          <div className={styles.actions}>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className={styles.acceptButton}
            >
              {accepting ? 'Joining...' : 'Accept Invite'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className={styles.declineButton}
            >
              Decline
            </button>
          </div>
        ) : (
          <div className={styles.authPrompt}>
            <p>Sign in to accept this invitation</p>
            <Link
              to={`/login?redirect=/invite/${inviteId}`}
              className={styles.loginButton}
            >
              Sign In
            </Link>
            <p className={styles.signupPrompt}>
              Don't have an account?{' '}
              <Link to={`/login?signup=true&redirect=/invite/${inviteId}`}>
                Sign up
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
