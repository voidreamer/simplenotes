import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import styles from './KeyboardShortcutsModal.module.css';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Keyboard Shortcuts</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.content}>
          {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
            <div key={index} className={styles.shortcutRow}>
              <div className={styles.keys}>
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className={styles.key}>{key}</kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className={styles.plus}>+</span>
                    )}
                  </span>
                ))}
              </div>
              <span className={styles.description}>{shortcut.description}</span>
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <p>Press <kbd className={styles.key}>?</kbd> anytime to show this help</p>
        </div>
      </div>
    </div>
  );
}
