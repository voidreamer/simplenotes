/**
 * SimpleNotes - Crypto Store
 *
 * Manages encryption keys and state using Zustand.
 * Keys are stored in memory only - they are cleared on logout or page refresh.
 * The encrypted private key is stored on the server and decrypted with user's password.
 */

import { create } from 'zustand';
import {
  createUserKeys,
  decryptUserPrivateKey,
  createHouseholdKey,
  unwrapKey,
  wrapKeyForMember,
  isCryptoAvailable,
  UserKeyData,
} from '../utils/crypto';

// ============================================
// Types
// ============================================

export interface CryptoState {
  // State
  isInitialized: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  hasEncryptionSetup: boolean;

  // Keys (in-memory only, never persisted)
  privateKey: CryptoKey | null;
  publicKey: CryptoKey | null;
  householdKeys: Map<string, CryptoKey>; // household_id -> decrypted key

  // Actions
  initialize: () => void;
  setupEncryption: (password: string) => Promise<UserKeyData>;
  unlock: (
    encryptedPrivateKey: string,
    salt: string,
    password: string,
    publicKeyBase64: string
  ) => Promise<boolean>;
  lock: () => void;
  setHasEncryptionSetup: (hasSetup: boolean) => void;

  // Household key management
  addHouseholdKey: (householdId: string, wrappedKey: string) => Promise<void>;
  getHouseholdKey: (householdId: string) => CryptoKey | null;
  createNewHouseholdKey: () => Promise<{ householdKey: CryptoKey; wrappedKey: string } | null>;
  wrapKeyForNewMember: (householdId: string, memberPublicKey: string) => Promise<string | null>;
  clearHouseholdKey: (householdId: string) => void;

  // Utility
  clearError: () => void;
  reset: () => void;
}

// ============================================
// Store
// ============================================

export const useCryptoStore = create<CryptoState>((set, get) => ({
  // Initial state
  isInitialized: false,
  isUnlocked: false,
  isLoading: false,
  error: null,
  hasEncryptionSetup: false,
  privateKey: null,
  publicKey: null,
  householdKeys: new Map(),

  /**
   * Initialize the crypto store
   * Checks if Web Crypto API is available
   */
  initialize: () => {
    if (!isCryptoAvailable()) {
      set({
        isInitialized: true,
        error: 'Web Crypto API is not available. Encryption features are disabled.',
      });
      return;
    }
    set({ isInitialized: true });
  },

  /**
   * Set up encryption for a new user
   * Generates key pair and returns data to store on server
   */
  setupEncryption: async (password: string): Promise<UserKeyData> => {
    set({ isLoading: true, error: null });

    try {
      const { keyPair, keyData } = await createUserKeys(password);

      set({
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
        isUnlocked: true,
        hasEncryptionSetup: true,
        isLoading: false,
      });

      return keyData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set up encryption';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Unlock encryption with user's password
   * Decrypts the private key stored on the server
   */
  unlock: async (
    encryptedPrivateKey: string,
    salt: string,
    password: string,
    publicKeyBase64: string
  ): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      // Decrypt private key
      const privateKey = await decryptUserPrivateKey(encryptedPrivateKey, salt, password);

      // Import public key
      const { importPublicKey } = await import('../utils/crypto');
      const publicKey = await importPublicKey(publicKeyBase64);

      set({
        privateKey,
        publicKey,
        isUnlocked: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.includes('decrypt')
            ? 'Incorrect encryption password'
            : error.message
          : 'Failed to unlock encryption';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  /**
   * Lock encryption (clear keys from memory)
   */
  lock: () => {
    set({
      privateKey: null,
      publicKey: null,
      householdKeys: new Map(),
      isUnlocked: false,
    });
  },

  /**
   * Set whether user has encryption set up
   */
  setHasEncryptionSetup: (hasSetup: boolean) => {
    set({ hasEncryptionSetup: hasSetup });
  },

  /**
   * Add a household key (unwrap it using private key)
   */
  addHouseholdKey: async (householdId: string, wrappedKey: string) => {
    const { privateKey, householdKeys } = get();

    if (!privateKey) {
      set({ error: 'Encryption is locked. Please unlock first.' });
      return;
    }

    try {
      const householdKey = await unwrapKey(wrappedKey, privateKey);
      const newKeys = new Map(householdKeys);
      newKeys.set(householdId, householdKey);
      set({ householdKeys: newKeys });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decrypt household key';
      set({ error: message });
      throw error;
    }
  },

  /**
   * Get a household key from memory
   */
  getHouseholdKey: (householdId: string): CryptoKey | null => {
    return get().householdKeys.get(householdId) || null;
  },

  /**
   * Create a new household key for a new household
   */
  createNewHouseholdKey: async () => {
    const { publicKey } = get();

    if (!publicKey) {
      set({ error: 'Encryption is locked. Please unlock first.' });
      return null;
    }

    try {
      const result = await createHouseholdKey(publicKey);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create household key';
      set({ error: message });
      return null;
    }
  },

  /**
   * Wrap the household key for a new member
   */
  wrapKeyForNewMember: async (householdId: string, memberPublicKey: string) => {
    const householdKey = get().householdKeys.get(householdId);

    if (!householdKey) {
      set({ error: 'Household key not found. Please reload the household.' });
      return null;
    }

    try {
      const wrappedKey = await wrapKeyForMember(householdKey, memberPublicKey);
      return wrappedKey;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to wrap key for member';
      set({ error: message });
      return null;
    }
  },

  /**
   * Clear a specific household key from memory
   */
  clearHouseholdKey: (householdId: string) => {
    const newKeys = new Map(get().householdKeys);
    newKeys.delete(householdId);
    set({ householdKeys: newKeys });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset all crypto state (on logout)
   */
  reset: () => {
    set({
      isUnlocked: false,
      isLoading: false,
      error: null,
      hasEncryptionSetup: false,
      privateKey: null,
      publicKey: null,
      householdKeys: new Map(),
    });
  },
}));

// ============================================
// Selectors (for performance optimization)
// ============================================

export const selectIsEncryptionReady = (state: CryptoState) =>
  state.isInitialized && state.isUnlocked;

export const selectNeedsEncryptionSetup = (state: CryptoState) =>
  state.isInitialized && !state.hasEncryptionSetup;

export const selectNeedsUnlock = (state: CryptoState) =>
  state.isInitialized && state.hasEncryptionSetup && !state.isUnlocked;
