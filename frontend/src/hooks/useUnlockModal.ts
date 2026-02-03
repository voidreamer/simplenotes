/**
 * useUnlockModal Hook
 * 
 * Provides a way to trigger the encryption unlock modal on-demand.
 * Used when a user tries to access an encrypted note or encrypt a note.
 */

import { create } from 'zustand';

interface UnlockModalState {
  isOpen: boolean;
  onSuccess: (() => void) | null;
  open: (onSuccess?: () => void) => void;
  close: () => void;
  resolve: () => void;
}

export const useUnlockModal = create<UnlockModalState>((set, get) => ({
  isOpen: false,
  onSuccess: null,
  
  open: (onSuccess?: () => void) => {
    set({ isOpen: true, onSuccess: onSuccess || null });
  },
  
  close: () => {
    set({ isOpen: false, onSuccess: null });
  },
  
  resolve: () => {
    const { onSuccess } = get();
    if (onSuccess) onSuccess();
    set({ isOpen: false, onSuccess: null });
  },
}));

/**
 * Request encryption unlock. Returns a promise that resolves when unlocked.
 * If already unlocked, resolves immediately.
 */
export function requestUnlock(): Promise<void> {
  const { useCryptoStore } = require('../stores/cryptoStore');
  const cryptoState = useCryptoStore.getState();
  
  if (cryptoState.isUnlocked) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      useUnlockModal.getState().close();
      reject(new Error('Unlock cancelled'));
    }, 120000); // 2 min timeout
    
    useUnlockModal.getState().open(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
