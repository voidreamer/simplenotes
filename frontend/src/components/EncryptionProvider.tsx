/**
 * EncryptionProvider Component
 *
 * Initializes encryption silently in the background.
 * Does NOT block the UI — encryption unlock happens on-demand
 * when a user accesses an encrypted note or tries to encrypt one.
 */

import { useEffect, useState } from 'react';
import { useEncryption } from '../hooks/useEncryption';
import { useUnlockModal } from '../hooks/useUnlockModal';
import UnlockPrompt from './UnlockPrompt';

interface EncryptionProviderProps {
  children: React.ReactNode;
}

export default function EncryptionProvider({ children }: EncryptionProviderProps) {
  const {
    initializeEncryption,
    keyData,
  } = useEncryption();

  const { isOpen, close, resolve } = useUnlockModal();

  // Initialize encryption silently on mount (non-blocking)
  useEffect(() => {
    initializeEncryption().catch(() => {
      // Encryption check failed - continue without encryption
    });
  }, [initializeEncryption]);

  return (
    <>
      {children}
      
      {/* On-demand unlock modal */}
      {isOpen && keyData && (
        <UnlockPrompt
          encryptedPrivateKey={keyData.encryptedPrivateKey}
          salt={keyData.salt}
          publicKey={keyData.publicKey}
          onUnlock={resolve}
          onCancel={close}
        />
      )}
    </>
  );
}
