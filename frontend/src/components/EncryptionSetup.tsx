/**
 * EncryptionSetup Component
 *
 * First-time encryption setup wizard for new users.
 * Generates encryption keys and stores them securely.
 */

import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCryptoStore } from '../stores/cryptoStore';
import { validatePassword, isCryptoAvailable } from '../utils/crypto';
import { api } from '../utils/api';
import styles from './EncryptionSetup.module.css';

interface EncryptionSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function EncryptionSetup({ onComplete, onSkip }: EncryptionSetupProps) {
  const [step, setStep] = useState<'intro' | 'password' | 'confirm' | 'complete'>('intro');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setupEncryption } = useCryptoStore();

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;

  const handleSetupEncryption = async () => {
    if (!passwordValidation.valid) {
      setError('Please fix the password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate keys and get data to store
      const keyData = await setupEncryption(password);

      // Store keys on server
      await api.setupUserKeys({
        public_key: keyData.publicKey,
        encrypted_private_key: keyData.encryptedPrivateKey,
        salt: keyData.salt,
        version: keyData.version,
      });

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up encryption');
    } finally {
      setLoading(false);
    }
  };

  if (!isCryptoAvailable()) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconError}>
            <AlertTriangle size={48} />
          </div>
          <h2 className={styles.title}>Encryption Not Available</h2>
          <p className={styles.description}>
            Your browser doesn't support the Web Crypto API required for end-to-end encryption.
            Please use a modern browser like Chrome, Firefox, Safari, or Edge.
          </p>
          {onSkip && (
            <button onClick={onSkip} className={styles.skipButton}>
              Continue Without Encryption
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {step === 'intro' && (
          <>
            <div className={styles.icon}>
              <Shield size={48} />
            </div>
            <h2 className={styles.title}>Set Up End-to-End Encryption</h2>
            <p className={styles.description}>
              Protect your notes and lists with end-to-end encryption.
              Only you and your household members can read your data - not even we can access it.
            </p>

            <div className={styles.features}>
              <div className={styles.feature}>
                <CheckCircle size={20} className={styles.featureIcon} />
                <span>Your data is encrypted before leaving your device</span>
              </div>
              <div className={styles.feature}>
                <CheckCircle size={20} className={styles.featureIcon} />
                <span>Shared securely with household members</span>
              </div>
              <div className={styles.feature}>
                <CheckCircle size={20} className={styles.featureIcon} />
                <span>Zero-knowledge - we can't read your content</span>
              </div>
            </div>

            <div className={styles.warning}>
              <AlertTriangle size={20} />
              <p>
                <strong>Important:</strong> If you forget your encryption password,
                your data cannot be recovered. Please choose a memorable password and store it safely.
              </p>
            </div>

            <button onClick={() => setStep('password')} className={styles.primaryButton}>
              Set Up Encryption
            </button>

            {onSkip && (
              <button onClick={onSkip} className={styles.skipButton}>
                Skip for Now
              </button>
            )}
          </>
        )}

        {step === 'password' && (
          <>
            <div className={styles.icon}>
              <Lock size={48} />
            </div>
            <h2 className={styles.title}>Create Encryption Password</h2>
            <p className={styles.description}>
              This password will be used to protect your encryption keys.
              It can be different from your login password.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Encryption Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
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

              <div className={styles.requirements}>
                <p className={styles.requirementsTitle}>Password requirements:</p>
                <ul className={styles.requirementsList}>
                  <li className={password.length >= 8 ? styles.met : ''}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? styles.met : ''}>
                    One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? styles.met : ''}>
                    One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? styles.met : ''}>
                    One number
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setStep('confirm')}
                disabled={!passwordValidation.valid}
                className={styles.primaryButton}
              >
                Continue
              </button>

              <button onClick={() => setStep('intro')} className={styles.backButton}>
                Back
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className={styles.icon}>
              <Lock size={48} />
            </div>
            <h2 className={styles.title}>Confirm Your Password</h2>
            <p className={styles.description}>
              Please enter your encryption password again to confirm.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.togglePassword}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {confirmPassword && !passwordsMatch && (
                <p className={styles.mismatch}>Passwords do not match</p>
              )}

              <button
                onClick={handleSetupEncryption}
                disabled={loading || !passwordsMatch}
                className={styles.primaryButton}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  'Complete Setup'
                )}
              </button>

              <button
                onClick={() => setStep('password')}
                disabled={loading}
                className={styles.backButton}
              >
                Back
              </button>
            </div>
          </>
        )}

        {step === 'complete' && (
          <>
            <div className={styles.iconSuccess}>
              <CheckCircle size={48} />
            </div>
            <h2 className={styles.title}>Encryption Enabled!</h2>
            <p className={styles.description}>
              Your account is now protected with end-to-end encryption.
              All your notes and lists will be encrypted automatically.
            </p>

            <div className={styles.reminder}>
              <p>
                <strong>Remember:</strong> Keep your encryption password safe.
                You'll need it when signing in on new devices.
              </p>
            </div>

            <button onClick={onComplete} className={styles.primaryButton}>
              Get Started
            </button>
          </>
        )}
      </div>
    </div>
  );
}
