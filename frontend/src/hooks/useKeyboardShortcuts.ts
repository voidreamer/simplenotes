import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts?: ShortcutConfig[];
}

// Global shortcuts that work across the app
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, shortcuts = [] } = options;
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Check custom shortcuts first
      for (const shortcut of shortcuts) {
        const ctrlOrMeta = shortcut.ctrl || shortcut.meta;
        const isCtrlOrMetaPressed = event.ctrlKey || event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (ctrlOrMeta ? isCtrlOrMetaPressed : !isCtrlOrMetaPressed) &&
          shiftMatches
        ) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }

      // Skip global shortcuts if in input field (unless it's Escape)
      if (isInputField && event.key !== 'Escape') return;

      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      // Global shortcuts
      switch (true) {
        // ⌘/Ctrl + D: Go to Dashboard
        case isCtrlOrMeta && event.key.toLowerCase() === 'd':
          event.preventDefault();
          navigate('/dashboard');
          break;

        // ⌘/Ctrl + ,: Go to Settings
        case isCtrlOrMeta && event.key === ',':
          event.preventDefault();
          navigate('/settings');
          break;

        // ⌘/Ctrl + N: Create new (context-aware)
        case isCtrlOrMeta && event.key.toLowerCase() === 'n':
          event.preventDefault();
          // If on dashboard, create household
          if (location.pathname === '/dashboard') {
            navigate('/dashboard?create=household');
          }
          // If on household page, trigger create list modal
          // This will be handled by the component itself
          window.dispatchEvent(new CustomEvent('shortcut:new'));
          break;

        // Escape: Close modals, go back
        case event.key === 'Escape':
          window.dispatchEvent(new CustomEvent('shortcut:escape'));
          break;

        // ?: Show keyboard shortcuts help
        case event.key === '?' && event.shiftKey:
          event.preventDefault();
          window.dispatchEvent(new CustomEvent('shortcut:help'));
          break;
      }
    },
    [enabled, shortcuts, navigate, location.pathname]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Hook for components to listen to shortcut events
export function useShortcutEvent(
  eventName: 'shortcut:new' | 'shortcut:escape' | 'shortcut:help',
  handler: () => void
) {
  useEffect(() => {
    const listener = () => handler();
    window.addEventListener(eventName, listener);
    return () => window.removeEventListener(eventName, listener);
  }, [eventName, handler]);
}

// Keyboard shortcuts reference
export const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', 'D'], description: 'Go to Dashboard' },
  { keys: ['⌘', ','], description: 'Open Settings' },
  { keys: ['⌘', 'N'], description: 'Create New' },
  { keys: ['⌘', 'Enter'], description: 'Save / Submit' },
  { keys: ['Esc'], description: 'Close / Cancel' },
  { keys: ['?'], description: 'Show Shortcuts' },
];
