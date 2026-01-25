/**
 * EncryptionBanner Component
 *
 * Shows a warning banner when encryption is not set up.
 * Provides a link to set up encryption.
 */

import { useState } from 'react';
import { ShieldOff, Shield, X, ChevronRight } from 'lucide-react';
import { useCryptoStore } from '../stores/cryptoStore';
import styles from './EncryptionBanner.module.css';

interface EncryptionBannerProps {
  onSetupClick: () => void;
}

export default function EncryptionBanner({ onSetupClick }: EncryptionBannerProps) {
  const { hasEncryptionSetup, isUnlocked } = useCryptoStore();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if encryption is set up and unlocked, or if dismissed
  if ((hasEncryptionSetup && isUnlocked) || dismissed) {
    return null;
  }

  // Show locked state if encryption is set up but not unlocked
  if (hasEncryptionSetup && !isUnlocked) {
    return (
      <div className={`${styles.banner} ${styles.locked}`}>
        <div className={styles.content}>
          <Shield size={18} className={styles.icon} />
          <span className={styles.text}>
            <strong>Encryption locked</strong> - Enter your password to decrypt your data
          </span>
        </div>
      </div>
    );
  }

  // Show warning if encryption is not set up
  return (
    <div className={`${styles.banner} ${styles.warning}`}>
      <div className={styles.content}>
        <ShieldOff size={18} className={styles.icon} />
        <span className={styles.text}>
          <strong>Your data is not encrypted</strong> - Set up end-to-end encryption to protect your notes
        </span>
      </div>
      <div className={styles.actions}>
        <button onClick={onSetupClick} className={styles.setupButton}>
          Set Up Encryption
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className={styles.dismissButton}
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
