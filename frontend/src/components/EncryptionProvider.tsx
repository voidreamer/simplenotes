/**
 * EncryptionProvider Component
 *
 * Wraps protected routes to handle encryption initialization,
 * setup prompt, and unlock flow.
 */

import { useEffect, useState } from 'react';
import { useEncryption } from '../hooks/useEncryption';
import EncryptionSetup from './EncryptionSetup';
import UnlockPrompt from './UnlockPrompt';
import LoadingScreen from './LoadingScreen';

interface EncryptionProviderProps {
  children: React.ReactNode;
}

export default function EncryptionProvider({ children }: EncryptionProviderProps) {
  const {
    isInitialized,
    needsSetup,
    needsUnlock,
    isLoading,
    keyData,
    initializeEncryption,
  } = useEncryption();

  const [showSetup, setShowSetup] = useState(false);
  const [setupSkipped, setSetupSkipped] = useState(false);

  // Initialize encryption on mount
  useEffect(() => {
    initializeEncryption();
  }, [initializeEncryption]);

  // Show setup if needed and not skipped
  useEffect(() => {
    if (needsSetup && !setupSkipped) {
      setShowSetup(true);
    }
  }, [needsSetup, setupSkipped]);

  const handleSetupComplete = () => {
    setShowSetup(false);
  };

  const handleSetupSkip = () => {
    setSetupSkipped(true);
    setShowSetup(false);
  };

  const handleUnlock = () => {
    // Encryption unlocked - continue to app
  };

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Show setup wizard if needed
  if (showSetup && needsSetup) {
    return (
      <EncryptionSetup
        onComplete={handleSetupComplete}
        onSkip={handleSetupSkip}
      />
    );
  }

  // Show unlock prompt if needed
  if (needsUnlock && keyData) {
    return (
      <UnlockPrompt
        encryptedPrivateKey={keyData.encryptedPrivateKey}
        salt={keyData.salt}
        publicKey={keyData.publicKey}
        onUnlock={handleUnlock}
      />
    );
  }

  // Render children (the protected content)
  return <>{children}</>;
}
