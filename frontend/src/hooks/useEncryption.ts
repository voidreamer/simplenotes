/**
 * useEncryption Hook
 *
 * Provides encryption state management and utilities for components.
 * Handles initialization, setup detection, and unlock flow.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useCryptoStore } from '../stores/cryptoStore';
import { useAuthStore } from '../stores/store';
import { api } from '../utils/api';

interface EncryptionState {
  isInitialized: boolean;
  isUnlocked: boolean;
  hasEncryptionSetup: boolean;
  needsSetup: boolean;
  needsUnlock: boolean;
  isLoading: boolean;
  error: string | null;
  keyData: {
    encryptedPrivateKey: string;
    salt: string;
    publicKey: string;
  } | null;
}

interface UseEncryptionReturn extends EncryptionState {
  initializeEncryption: () => Promise<void>;
  lockEncryption: () => void;
  clearError: () => void;
}

export function useEncryption(): UseEncryptionReturn {
  const { isAuthenticated } = useAuthStore();
  const {
    isInitialized,
    isUnlocked,
    hasEncryptionSetup,
    isLoading,
    error,
    initialize,
    setHasEncryptionSetup,
    lock,
    clearError,
  } = useCryptoStore();

  const [keyData, setKeyData] = useState<EncryptionState['keyData']>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Use ref to track if we've already initialized (prevents infinite loops)
  const hasInitialized = useRef(false);

  // Initialize crypto store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Check encryption status when authenticated - runs only once
  const initializeEncryption = useCallback(async () => {
    // Prevent multiple calls
    if (!isAuthenticated || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    setLocalLoading(true);

    try {
      const status = await api.getUserKeyStatus();
      setHasEncryptionSetup(status.has_encryption_setup);

      if (status.has_encryption_setup) {
        // Fetch key data for unlock prompt
        const keys = await api.getUserKeys();
        setKeyData({
          encryptedPrivateKey: keys.encrypted_private_key,
          salt: keys.salt,
          publicKey: keys.public_key,
        });
      }
    } catch {
      // User may not have keys yet - that's okay
      setHasEncryptionSetup(false);
      setKeyData(null);
    } finally {
      setLocalLoading(false);
    }
  }, [isAuthenticated, setHasEncryptionSetup]);

  // Calculate derived states
  const needsSetup = isInitialized && isAuthenticated && !hasEncryptionSetup;
  const needsUnlock = isInitialized && isAuthenticated && hasEncryptionSetup && !isUnlocked;

  return {
    isInitialized,
    isUnlocked,
    hasEncryptionSetup,
    needsSetup,
    needsUnlock,
    isLoading: isLoading || localLoading,
    error,
    keyData,
    initializeEncryption,
    lockEncryption: lock,
    clearError,
  };
}

/**
 * Hook to get household encryption key status
 */
export function useHouseholdEncryption(householdId: string | null) {
  const { isUnlocked, getHouseholdKey, addHouseholdKey } = useCryptoStore();
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!householdId || !isUnlocked) {
      setHasKey(false);
      return;
    }

    // Check if we already have the key
    const existingKey = getHouseholdKey(householdId);
    if (existingKey) {
      setHasKey(true);
      return;
    }

    // Try to fetch and load the key
    const loadKey = async () => {
      setIsLoading(true);
      try {
        const response = await api.getHouseholdKey(householdId);
        if (response.has_key && response.wrapped_key) {
          await addHouseholdKey(householdId, response.wrapped_key);
          setHasKey(true);
        } else {
          setHasKey(false);
        }
      } catch (err) {
        console.error('Failed to load household key:', err);
        setHasKey(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadKey();
  }, [householdId, isUnlocked, getHouseholdKey, addHouseholdKey]);

  return { hasKey, isLoading };
}
