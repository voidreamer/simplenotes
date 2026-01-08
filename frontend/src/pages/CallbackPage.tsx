import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAuthSession } from '../utils/auth';
import LoadingScreen from '../components/LoadingScreen';

export default function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await checkAuthSession();
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return <LoadingScreen />;
}
