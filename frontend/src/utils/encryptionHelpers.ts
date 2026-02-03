/**
 * Encryption helper utilities for per-note encryption.
 * Detects encrypted content and provides unlock flow.
 */

/**
 * Check if a string value contains encrypted data.
 * Encrypted values are stored as JSON: {"encrypted": true, "data": {...}}
 */
export function isEncryptedValue(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false;
  try {
    const parsed = JSON.parse(value);
    return parsed?.encrypted === true && parsed?.data != null;
  } catch {
    return false;
  }
}

/**
 * Check if a list/note has any encrypted content.
 * Checks title, content, and items.
 */
export function isNoteEncrypted(list: {
  title?: string;
  content?: string;
  items?: Array<{ text?: string }>;
}): boolean {
  if (isEncryptedValue(list.title)) return true;
  if (isEncryptedValue(list.content)) return true;
  if (list.items?.some(item => isEncryptedValue(item.text))) return true;
  return false;
}
