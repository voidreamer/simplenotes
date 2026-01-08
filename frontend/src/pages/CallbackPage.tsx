import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAuthSession } from '../utils/auth';
import { useAuthStore } from '../stores/store';
import LoadingScreen from '../components/LoadingScreen';

export default function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Give Amplify a moment to process the OAuth response
        await new Promise(resolve => setTimeout(resolve, 500));

        const success = await checkAuthSession();
        if (success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError('Failed to authenticate. Please try again.');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setError(error.message || 'Authentication failed');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    };

    // If already authenticated, go to dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    handleCallback();
  }, [navigate, isAuthenticated]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0f0f23',
        color: '#ff6b6b'
      }}>
        <p>{error}</p>
        <p style={{ color: '#888', fontSize: '14px' }}>Redirecting to login...</p>
      </div>
    );
  }

  return <LoadingScreen />;
}
