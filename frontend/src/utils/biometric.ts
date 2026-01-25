/**
 * Biometric Authentication Utilities
 *
 * Uses Capacitor's native biometric capabilities when running as a native app.
 * Falls back gracefully on web where biometrics aren't available.
 *
 * This allows users to unlock their encryption with Face ID / Touch ID
 * instead of typing their password every time.
 *
 * NOTE: To enable biometrics, install the Capacitor plugin:
 *   npm install capacitor-native-biometric
 *   npx cap sync
 */

// Types for the Capacitor plugins (will be available when plugins are installed)
interface BiometricResult {
  isAvailable: boolean;
  biometryType?: 'touchId' | 'faceId' | 'fingerprintAuthentication' | 'irisAuthentication';
}

interface NativeBiometricPlugin {
  isAvailable(): Promise<BiometricResult>;
  verifyIdentity(options: { reason: string; title?: string; subtitle?: string }): Promise<void>;
  setCredentials(options: { username: string; password: string; server: string }): Promise<void>;
  getCredentials(options: { server: string }): Promise<{ username: string; password: string }>;
  deleteCredentials(options: { server: string }): Promise<void>;
}

// Capacitor global type
interface CapacitorGlobal {
  Plugins?: {
    NativeBiometric?: NativeBiometricPlugin;
  };
  isNativePlatform?: () => boolean;
}

// Constants
const CREDENTIAL_SERVER = 'simplenotes-encryption';
const CREDENTIAL_USERNAME = 'encryption-password';

// Get Capacitor from window (available at runtime when running as native app)
function getCapacitor(): CapacitorGlobal | null {
  if (typeof window !== 'undefined' && 'Capacitor' in window) {
    return (window as unknown as { Capacitor: CapacitorGlobal }).Capacitor;
  }
  return null;
}

// Check if we're running in Capacitor native app
function isCapacitorNative(): boolean {
  const capacitor = getCapacitor();
  return capacitor?.isNativePlatform?.() ?? false;
}

// Get the NativeBiometric plugin if available
function getNativeBiometric(): NativeBiometricPlugin | null {
  if (!isCapacitorNative()) {
    return null;
  }

  const capacitor = getCapacitor();
  const plugin = capacitor?.Plugins?.NativeBiometric;

  if (!plugin) {
    console.log('NativeBiometric plugin not installed');
    return null;
  }

  return plugin;
}

/**
 * Check if biometric authentication is available on this device
 */
export async function isBiometricAvailable(): Promise<{ available: boolean; type?: string }> {
  const biometric = getNativeBiometric();

  if (!biometric) {
    return { available: false };
  }

  try {
    const result = await biometric.isAvailable();
    return {
      available: result.isAvailable,
      type: result.biometryType,
    };
  } catch {
    return { available: false };
  }
}

/**
 * Get a human-readable name for the biometric type
 */
export function getBiometricName(type?: string): string {
  switch (type) {
    case 'faceId':
      return 'Face ID';
    case 'touchId':
      return 'Touch ID';
    case 'fingerprintAuthentication':
      return 'Fingerprint';
    case 'irisAuthentication':
      return 'Iris';
    default:
      return 'Biometric';
  }
}

/**
 * Save the encryption password for biometric unlock
 * This stores the password securely in the device's keychain/keystore
 */
export async function savePasswordForBiometric(password: string): Promise<boolean> {
  const biometric = getNativeBiometric();

  if (!biometric) {
    console.log('Biometric not available - password not saved');
    return false;
  }

  try {
    // Verify biometric is available
    const { isAvailable } = await biometric.isAvailable();
    if (!isAvailable) {
      return false;
    }

    // Store credentials securely
    await biometric.setCredentials({
      username: CREDENTIAL_USERNAME,
      password: password,
      server: CREDENTIAL_SERVER,
    });

    console.log('Encryption password saved for biometric unlock');
    return true;
  } catch (error) {
    console.error('Failed to save password for biometric:', error);
    return false;
  }
}

/**
 * Retrieve the encryption password using biometric authentication
 * User will be prompted for Face ID / Touch ID
 */
export async function getPasswordWithBiometric(): Promise<string | null> {
  const biometric = getNativeBiometric();

  if (!biometric) {
    return null;
  }

  try {
    // Verify identity with biometric
    await biometric.verifyIdentity({
      reason: 'Unlock your encrypted notes',
      title: 'Unlock Encryption',
      subtitle: 'Use biometric to access your notes',
    });

    // Get the stored credentials
    const credentials = await biometric.getCredentials({
      server: CREDENTIAL_SERVER,
    });

    return credentials.password;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return null;
  }
}

/**
 * Check if we have a saved password for biometric unlock
 */
export async function hasSavedBiometricPassword(): Promise<boolean> {
  const biometric = getNativeBiometric();

  if (!biometric) {
    return false;
  }

  try {
    const credentials = await biometric.getCredentials({
      server: CREDENTIAL_SERVER,
    });
    return !!credentials.password;
  } catch {
    // No credentials saved
    return false;
  }
}

/**
 * Remove the saved biometric password
 */
export async function removeBiometricPassword(): Promise<boolean> {
  const biometric = getNativeBiometric();

  if (!biometric) {
    return false;
  }

  try {
    await biometric.deleteCredentials({
      server: CREDENTIAL_SERVER,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Biometric status for UI display
 */
export interface BiometricStatus {
  isAvailable: boolean;
  isEnabled: boolean;
  biometryType?: string;
  biometryName: string;
}

export async function getBiometricStatus(): Promise<BiometricStatus> {
  const availability = await isBiometricAvailable();
  const hasSaved = availability.available ? await hasSavedBiometricPassword() : false;

  return {
    isAvailable: availability.available,
    isEnabled: hasSaved,
    biometryType: availability.type,
    biometryName: getBiometricName(availability.type),
  };
}
