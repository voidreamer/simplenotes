/**
 * SimpleNotes - End-to-End Encryption Utilities
 *
 * This module provides cryptographic operations using the Web Crypto API.
 * All encryption happens client-side - the server never sees plaintext data.
 *
 * Key Hierarchy:
 * - User Key Pair (RSA-OAEP): Used for wrapping/unwrapping household keys
 * - Household Key (AES-GCM): Symmetric key shared among household members
 * - Content is encrypted with the household key
 */

// ============================================
// Types
// ============================================

export interface EncryptedData {
  ciphertext: string;  // Base64-encoded encrypted data
  iv: string;          // Base64-encoded initialization vector
  version: number;     // Encryption version for future compatibility
}

export interface WrappedKey {
  wrappedKey: string;  // Base64-encoded wrapped key
  algorithm: string;   // Algorithm used for wrapping
}

export interface UserKeyData {
  publicKey: string;           // Base64-encoded public key (SPKI format)
  encryptedPrivateKey: string; // Base64-encoded encrypted private key
  salt: string;                // Base64-encoded salt for key derivation
  version: number;
}

export interface HouseholdKeyData {
  wrappedKeys: Record<string, string>;  // user_id -> Base64 wrapped key
  version: number;
}

// ============================================
// Constants
// ============================================

const ENCRYPTION_VERSION = 1;
const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const RSA_KEY_LENGTH = 2048;

// ============================================
// Utility Functions
// ============================================

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ============================================
// Key Generation
// ============================================

/**
 * Generate an RSA key pair for asymmetric encryption
 * Used for wrapping/unwrapping household symmetric keys
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: RSA_KEY_LENGTH,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    },
    true, // extractable
    ['wrapKey', 'unwrapKey']
  );
}

/**
 * Generate an AES-GCM symmetric key for content encryption
 * This is used as the household key
 */
export async function generateSymmetricKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    true, // extractable (needed for wrapping)
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive an AES key from a password using PBKDF2
 * Used to encrypt the user's private key
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // Import password as key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES key from password
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

// ============================================
// Key Import/Export
// ============================================

/**
 * Export public key to SPKI format (Base64)
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import public key from SPKI format (Base64)
 */
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(publicKeyBase64);
  return await crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['wrapKey']
  );
}

/**
 * Export private key to PKCS8 format (Base64)
 */
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import private key from PKCS8 format (Base64)
 */
export async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(privateKeyBase64);
  return await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['unwrapKey']
  );
}

/**
 * Export symmetric key to raw format (Base64)
 */
export async function exportSymmetricKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Import symmetric key from raw format (Base64)
 */
export async function importSymmetricKey(keyBase64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(keyBase64);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    true, // extractable for re-wrapping
    ['encrypt', 'decrypt']
  );
}

// ============================================
// Key Wrapping (for sharing household keys)
// ============================================

/**
 * Wrap a symmetric key with a public key (RSA-OAEP)
 * Used when adding members to a household
 */
export async function wrapKey(
  keyToWrap: CryptoKey,
  publicKey: CryptoKey
): Promise<string> {
  const wrapped = await crypto.subtle.wrapKey(
    'raw',
    keyToWrap,
    publicKey,
    {
      name: 'RSA-OAEP',
    }
  );
  return arrayBufferToBase64(wrapped);
}

/**
 * Unwrap a symmetric key with a private key (RSA-OAEP)
 * Used when accessing household data
 */
export async function unwrapKey(
  wrappedKeyBase64: string,
  privateKey: CryptoKey
): Promise<CryptoKey> {
  const wrappedKey = base64ToArrayBuffer(wrappedKeyBase64);
  return await crypto.subtle.unwrapKey(
    'raw',
    wrappedKey,
    privateKey,
    {
      name: 'RSA-OAEP',
    },
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    true, // extractable for re-wrapping
    ['encrypt', 'decrypt']
  );
}

// ============================================
// Content Encryption/Decryption
// ============================================

/**
 * Encrypt data using AES-GCM
 * Returns the ciphertext and IV as Base64 strings
 */
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedData> {
  const iv = generateRandomBytes(12); // 96 bits for GCM
  const encodedData = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    encodedData
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    version: ENCRYPTION_VERSION,
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(
  encrypted: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
  const iv = base64ToArrayBuffer(encrypted.iv);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ============================================
// User Key Management
// ============================================

/**
 * Create encrypted user keys from a password
 * Returns data to be stored on the server
 */
export async function createUserKeys(
  password: string
): Promise<{ keyPair: CryptoKeyPair; keyData: UserKeyData }> {
  // Generate RSA key pair
  const keyPair = await generateKeyPair();

  // Generate salt for password derivation
  const salt = generateRandomBytes(32);

  // Derive encryption key from password
  const derivedKey = await deriveKeyFromPassword(password, salt);

  // Export private key
  const privateKeyExport = await exportPrivateKey(keyPair.privateKey);

  // Encrypt private key with derived key
  const encryptedPrivateKey = await encryptData(privateKeyExport, derivedKey);

  // Export public key
  const publicKey = await exportPublicKey(keyPair.publicKey);

  return {
    keyPair,
    keyData: {
      publicKey,
      encryptedPrivateKey: JSON.stringify(encryptedPrivateKey),
      salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
      version: ENCRYPTION_VERSION,
    },
  };
}

/**
 * Decrypt user's private key using their password
 */
export async function decryptUserPrivateKey(
  encryptedPrivateKeyJson: string,
  salt: string,
  password: string
): Promise<CryptoKey> {
  // Parse encrypted private key
  const encryptedPrivateKey: EncryptedData = JSON.parse(encryptedPrivateKeyJson);

  // Derive key from password
  const saltBytes = new Uint8Array(base64ToArrayBuffer(salt));
  const derivedKey = await deriveKeyFromPassword(password, saltBytes);

  // Decrypt private key
  const privateKeyBase64 = await decryptData(encryptedPrivateKey, derivedKey);

  // Import private key
  return await importPrivateKey(privateKeyBase64);
}

// ============================================
// Household Key Management
// ============================================

/**
 * Create a new household key and wrap it for the owner
 */
export async function createHouseholdKey(
  ownerPublicKey: CryptoKey
): Promise<{ householdKey: CryptoKey; wrappedKey: string }> {
  const householdKey = await generateSymmetricKey();
  const wrappedKey = await wrapKey(householdKey, ownerPublicKey);

  return { householdKey, wrappedKey };
}

/**
 * Add a new member to household by wrapping the key for them
 */
export async function wrapKeyForMember(
  householdKey: CryptoKey,
  memberPublicKeyBase64: string
): Promise<string> {
  const memberPublicKey = await importPublicKey(memberPublicKeyBase64);
  return await wrapKey(householdKey, memberPublicKey);
}

// ============================================
// List Encryption Helpers
// ============================================

export interface EncryptedListItem {
  id: string;
  encryptedText: EncryptedData;
  checked: boolean;
  quantity?: number;
  unit?: string;
  category?: string;
  encryptedNote?: EncryptedData;
  added_by?: string;
  created_at?: string;
}

export interface DecryptedListItem {
  id: string;
  text: string;
  checked: boolean;
  quantity?: number;
  unit?: string;
  category?: string;
  note?: string;
  added_by?: string;
  created_at?: string;
}

/**
 * Encrypt a list item
 */
export async function encryptListItem(
  item: DecryptedListItem,
  householdKey: CryptoKey
): Promise<EncryptedListItem> {
  const encryptedText = await encryptData(item.text, householdKey);
  const encryptedNote = item.note
    ? await encryptData(item.note, householdKey)
    : undefined;

  return {
    id: item.id,
    encryptedText,
    checked: item.checked,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    encryptedNote,
    added_by: item.added_by,
    created_at: item.created_at,
  };
}

/**
 * Decrypt a list item
 */
export async function decryptListItem(
  item: EncryptedListItem,
  householdKey: CryptoKey
): Promise<DecryptedListItem> {
  const text = await decryptData(item.encryptedText, householdKey);
  const note = item.encryptedNote
    ? await decryptData(item.encryptedNote, householdKey)
    : undefined;

  return {
    id: item.id,
    text,
    checked: item.checked,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    note,
    added_by: item.added_by,
    created_at: item.created_at,
  };
}

/**
 * Encrypt list content (title, content, items)
 */
export async function encryptListContent(
  data: {
    title: string;
    content?: string;
    items?: DecryptedListItem[];
  },
  householdKey: CryptoKey
): Promise<{
  encryptedTitle: EncryptedData;
  encryptedContent?: EncryptedData;
  encryptedItems?: EncryptedListItem[];
}> {
  const encryptedTitle = await encryptData(data.title, householdKey);

  const encryptedContent = data.content
    ? await encryptData(data.content, householdKey)
    : undefined;

  const encryptedItems = data.items
    ? await Promise.all(data.items.map(item => encryptListItem(item, householdKey)))
    : undefined;

  return {
    encryptedTitle,
    encryptedContent,
    encryptedItems,
  };
}

/**
 * Decrypt list content
 */
export async function decryptListContent(
  data: {
    encryptedTitle: EncryptedData;
    encryptedContent?: EncryptedData;
    encryptedItems?: EncryptedListItem[];
  },
  householdKey: CryptoKey
): Promise<{
  title: string;
  content?: string;
  items?: DecryptedListItem[];
}> {
  const title = await decryptData(data.encryptedTitle, householdKey);

  const content = data.encryptedContent
    ? await decryptData(data.encryptedContent, householdKey)
    : undefined;

  const items = data.encryptedItems
    ? await Promise.all(data.encryptedItems.map(item => decryptListItem(item, householdKey)))
    : undefined;

  return {
    title,
    content,
    items,
  };
}

// ============================================
// Validation
// ============================================

/**
 * Check if Web Crypto API is available
 */
export function isCryptoAvailable(): boolean {
  return !!(
    typeof crypto !== 'undefined' &&
    crypto.subtle &&
    typeof crypto.subtle.generateKey === 'function'
  );
}

/**
 * Validate encryption password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
