/**
 * UnlockPrompt Component
 *
 * Prompts user to enter their encryption password to unlock their keys.
 * Supports biometric unlock (Face ID / Touch ID) on native apps via Capacitor.
 */

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Unlock, Fingerprint } from 'lucide-react';
import { useCryptoStore } from '../stores/cryptoStore';
import {
  getBiometricStatus,
  getPasswordWithBiometric,
  savePasswordForBiometric,
  BiometricStatus,
} from '../utils/biometric';
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
  const [saveBiometric, setSaveBiometric] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);

  const { unlock } = useCryptoStore();

  // Check biometric availability on mount
  useEffect(() => {
    getBiometricStatus().then(setBiometricStatus);
  }, []);

  // Try biometric unlock automatically if enabled
  useEffect(() => {
    if (biometricStatus?.isEnabled) {
      handleBiometricUnlock();
    }
  }, [biometricStatus?.isEnabled]);

  const handleBiometricUnlock = async () => {
    if (!biometricStatus?.isAvailable) return;

    setLoading(true);
    setError('');

    try {
      const biometricPassword = await getPasswordWithBiometric();
      if (biometricPassword) {
        const success = await unlock(encryptedPrivateKey, salt, biometricPassword, publicKey);
        if (success) {
          onUnlock();
          return;
        }
      }
      // Biometric failed or no password saved - fall back to manual entry
      setError('Biometric unlock failed. Please enter your password.');
    } catch (err) {
      setError('Biometric unlock failed. Please enter your password.');
    } finally {
      setLoading(false);
    }
  };

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
        // Save password for biometric if user opted in
        if (saveBiometric && biometricStatus?.isAvailable) {
          await savePasswordForBiometric(password);
        }
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

        {/* Biometric button - show if available and enabled */}
        {biometricStatus?.isAvailable && biometricStatus?.isEnabled && (
          <button
            type="button"
            onClick={handleBiometricUnlock}
            disabled={loading}
            className={styles.biometricButton}
          >
            <Fingerprint size={24} />
            <span>Unlock with {biometricStatus.biometryName}</span>
          </button>
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
                autoFocus={!biometricStatus?.isEnabled}
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

          {/* Option to enable biometric for next time */}
          {biometricStatus?.isAvailable && !biometricStatus?.isEnabled && (
            <label className={styles.biometricCheckbox}>
              <input
                type="checkbox"
                checked={saveBiometric}
                onChange={(e) => setSaveBiometric(e.target.checked)}
              />
              <Fingerprint size={18} />
              <span>Enable {biometricStatus.biometryName} for faster unlock</span>
            </label>
          )}

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
