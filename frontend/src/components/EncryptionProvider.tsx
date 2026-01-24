/**
 * EncryptionProvider Component
 *
 * Wraps protected routes to handle encryption initialization,
 * setup prompt, and unlock flow.
 * Encryption is optional - the app loads normally while checking encryption status.
 */

import { useEffect, useState } from 'react';
import { useEncryption } from '../hooks/useEncryption';
import EncryptionSetup from './EncryptionSetup';
import UnlockPrompt from './UnlockPrompt';

interface EncryptionProviderProps {
  children: React.ReactNode;
}

export default function EncryptionProvider({ children }: EncryptionProviderProps) {
  const {
    isInitialized,
    needsSetup,
    needsUnlock,
    keyData,
    initializeEncryption,
  } = useEncryption();

  const [showSetup, setShowSetup] = useState(false);
  const [setupSkipped, setSetupSkipped] = useState(false);
  const [encryptionChecked, setEncryptionChecked] = useState(false);

  // Initialize encryption on mount (non-blocking)
  useEffect(() => {
    const checkEncryption = async () => {
      try {
        await initializeEncryption();
      } catch {
        // Encryption check failed - continue without encryption
      } finally {
        setEncryptionChecked(true);
      }
    };
    checkEncryption();
  }, [initializeEncryption]);

  // Show setup if needed and not skipped (only after encryption check completes)
  useEffect(() => {
    if (encryptionChecked && needsSetup && !setupSkipped) {
      setShowSetup(true);
    }
  }, [encryptionChecked, needsSetup, setupSkipped]);

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

  // Wait only for crypto store initialization (synchronous)
  if (!isInitialized) {
    return null;
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
  if (encryptionChecked && needsUnlock && keyData) {
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
