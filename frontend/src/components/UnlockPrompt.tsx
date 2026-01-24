/**
 * UnlockPrompt Component
 *
 * Prompts user to enter their encryption password to unlock their keys.
 * Shown when user has encryption set up but keys are not yet unlocked.
 */

import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Unlock } from 'lucide-react';
import { useCryptoStore } from '../stores/cryptoStore';
import styles from './UnlockPrompt.module.css';

interface UnlockPromptProps {
  encryptedPrivateKey: string;
  salt: string;
  publicKey: string;
  onUnlock: () => void;
  onCancel?: () => void;
}

export default function UnlockPrompt({
  encryptedPrivateKey,
  salt,
  publicKey,
  onUnlock,
  onCancel,
}: UnlockPromptProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { unlock } = useCryptoStore();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError('Please enter your encryption password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await unlock(encryptedPrivateKey, salt, password, publicKey);

      if (success) {
        onUnlock();
      } else {
        setError('Incorrect encryption password. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock encryption');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>
          <Lock size={32} />
        </div>

        <h2 className={styles.title}>Unlock Encryption</h2>
        <p className={styles.description}>
          Enter your encryption password to access your encrypted data.
        </p>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Encryption Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your encryption password"
                autoFocus
                className={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.togglePassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.unlockButton}>
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <Unlock size={18} />
                Unlock
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          )}
        </form>

        <p className={styles.hint}>
          This is the password you created when setting up encryption.
          It may be different from your login password.
        </p>
      </div>
    </div>
  );
}
