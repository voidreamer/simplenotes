/**
 * SimpleNotes - Encrypted API Layer
 *
 * Wraps the API client to transparently handle encryption/decryption of list data.
 * Uses the crypto store to get household keys for encryption operations.
 */

import { api } from './api';
import { useCryptoStore } from '../stores/cryptoStore';
import {
  encryptData,
  decryptData,
  decryptListItem,
  encryptFile,
  decryptFile,
  packEncryptedFile,
  unpackEncryptedFile,
  EncryptedData,
  EncryptedListItem,
  DecryptedListItem,
} from './crypto';
import { List, ListItem } from '../stores/store';

// ============================================
// Types
// ============================================

interface EncryptedList {
  list_id: string;
  household_id: string;
  encrypted_title: EncryptedData;
  encrypted_content?: EncryptedData;
  encrypted_items?: EncryptedListItem[];
  type: 'note' | 'checklist' | 'shopping';
  created_by: string;
  created_at: string;
  updated_at: string;
  color: string;
  icon: string;
  pinned: boolean;
  encrypted: true;
}

interface PlainList {
  list_id: string;
  household_id: string;
  title: string;
  content: string;
  items: ListItem[];
  type: 'note' | 'checklist' | 'shopping';
  created_by: string;
  created_at: string;
  updated_at: string;
  color: string;
  icon: string;
  pinned: boolean;
  encrypted?: false;
}

type ApiList = EncryptedList | PlainList;

// ============================================
// Helper Functions
// ============================================

function isEncryptedList(list: ApiList): list is EncryptedList {
  return 'encrypted' in list && list.encrypted === true;
}

async function getHouseholdKey(householdId: string): Promise<CryptoKey | null> {
  const state = useCryptoStore.getState();

  if (!state.isUnlocked) {
    console.warn('Encryption not unlocked');
    return null;
  }

  // Check if we already have the key in memory
  let key = state.getHouseholdKey(householdId);
  if (key) {
    return key;
  }

  // Try to fetch and unwrap the key from the server
  try {
    const response = await api.getHouseholdKey(householdId);
    if (response.has_key && response.wrapped_key) {
      await state.addHouseholdKey(householdId, response.wrapped_key);
      // Get fresh state after adding key
      return useCryptoStore.getState().getHouseholdKey(householdId);
    }
  } catch (error) {
    console.error('Failed to fetch household key:', error);
  }

  return null;
}

// ============================================
// List Item Conversion
// ============================================

function decryptedToListItem(item: DecryptedListItem): ListItem {
  return {
    id: item.id,
    text: item.text,
    checked: item.checked,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    note: item.note,
    added_by: item.added_by,
    created_at: item.created_at,
  };
}

// ============================================
// Encrypted API Class
// ============================================

class EncryptedApiClient {
  /**
   * Check if encryption is available for a household
   */
  async isEncryptionAvailable(householdId: string): Promise<boolean> {
    const key = await getHouseholdKey(householdId);
    return key !== null;
  }

  /**
   * Create a new encrypted list
   */
  async createList(data: {
    household_id: string;
    title: string;
    type: string;
    color?: string;
    icon?: string;
  }): Promise<List> {
    const key = await getHouseholdKey(data.household_id);

    if (key) {
      // Encrypt the title
      const encryptedTitle = await encryptData(data.title, key);

      const response = await api.createList({
        ...data,
        title: JSON.stringify({ encrypted: true, data: encryptedTitle }),
      });

      // Return decrypted version
      return {
        ...(response as PlainList),
        title: data.title,
      };
    }

    // No encryption - create plain list
    return api.createList(data) as Promise<List>;
  }

  /**
   * Get and decrypt a list
   */
  async getList(listId: string, householdId: string): Promise<List> {
    const response = (await api.getList(listId, householdId)) as ApiList;
    const key = await getHouseholdKey(householdId);

    // Check if the list is encrypted
    if (key && this.isListEncrypted(response)) {
      return await this.decryptList(response, key);
    }

    // Try to decrypt inline encrypted fields
    if (key && typeof (response as PlainList).title === 'string') {
      try {
        const titleData = JSON.parse((response as PlainList).title);
        if (titleData.encrypted && titleData.data) {
          const decryptedTitle = await decryptData(titleData.data, key);
          (response as PlainList).title = decryptedTitle;
        }
      } catch {
        // Not encrypted JSON, use as-is
      }

      // Decrypt content if encrypted
      if ((response as PlainList).content) {
        try {
          const contentData = JSON.parse((response as PlainList).content);
          if (contentData.encrypted && contentData.data) {
            const decryptedContent = await decryptData(contentData.data, key);
            (response as PlainList).content = decryptedContent;
          }
        } catch {
          // Not encrypted JSON, use as-is
        }
      }

      // Decrypt items if encrypted
      if ((response as PlainList).items && Array.isArray((response as PlainList).items)) {
        const decryptedItems = await Promise.all(
          (response as PlainList).items.map(async (item) => {
            if (typeof item.text === 'string') {
              try {
                const textData = JSON.parse(item.text);
                if (textData.encrypted && textData.data) {
                  const decryptedText = await decryptData(textData.data, key);
                  return { ...item, text: decryptedText };
                }
              } catch {
                // Not encrypted JSON, use as-is
              }
            }
            return item;
          })
        );
        (response as PlainList).items = decryptedItems;
      }
    }

    return response as List;
  }

  /**
   * Get and decrypt lists for a household
   */
  async getLists(householdId: string): Promise<List[]> {
    const response = (await api.getLists(householdId)) as ApiList[];
    const key = await getHouseholdKey(householdId);

    if (!key) {
      return response as List[];
    }

    // Decrypt each list's title
    const decryptedLists = await Promise.all(
      response.map(async (list) => {
        if (typeof (list as PlainList).title === 'string') {
          try {
            const titleData = JSON.parse((list as PlainList).title);
            if (titleData.encrypted && titleData.data) {
              const decryptedTitle = await decryptData(titleData.data, key);
              return { ...list, title: decryptedTitle } as List;
            }
          } catch {
            // Not encrypted JSON, use as-is
          }
        }
        return list as List;
      })
    );

    return decryptedLists;
  }

  /**
   * Update a list with encryption
   */
  async updateList(
    listId: string,
    householdId: string,
    data: {
      title?: string;
      items?: ListItem[];
      content?: string;
      color?: string;
      icon?: string;
      pinned?: boolean;
    }
  ): Promise<List> {
    const key = await getHouseholdKey(householdId);
    const updateData: Record<string, unknown> = { ...data };

    if (key) {
      // Encrypt title if provided
      if (data.title !== undefined) {
        const encryptedTitle = await encryptData(data.title, key);
        updateData.title = JSON.stringify({ encrypted: true, data: encryptedTitle });
      }

      // Encrypt content if provided
      if (data.content !== undefined) {
        const encryptedContent = await encryptData(data.content, key);
        updateData.content = JSON.stringify({ encrypted: true, data: encryptedContent });
      }

      // Encrypt items if provided
      if (data.items !== undefined) {
        const encryptedItems = await Promise.all(
          data.items.map(async (item) => {
            const encryptedText = await encryptData(item.text, key);
            return {
              ...item,
              text: JSON.stringify({ encrypted: true, data: encryptedText }),
            };
          })
        );
        updateData.items = encryptedItems;
      }
    }

    const response = await api.updateList(listId, householdId, updateData as Parameters<typeof api.updateList>[2]);

    // Return with original (decrypted) values
    return {
      ...(response as List),
      title: data.title ?? (response as List).title,
      content: data.content ?? (response as List).content,
      items: data.items ?? (response as List).items,
    };
  }

  /**
   * Add an encrypted item to a list
   */
  async addListItem(
    listId: string,
    householdId: string,
    data: { text: string; quantity?: number; unit?: string; category?: string }
  ): Promise<List> {
    const key = await getHouseholdKey(householdId);
    const itemData = { ...data };

    if (key) {
      const encryptedText = await encryptData(data.text, key);
      itemData.text = JSON.stringify({ encrypted: true, data: encryptedText });
    }

    await api.addListItem(listId, householdId, itemData);

    // Decrypt the response
    return this.getList(listId, householdId);
  }

  /**
   * Update an encrypted item
   */
  async updateListItem(
    listId: string,
    householdId: string,
    itemId: string,
    data: { text?: string; quantity?: number; unit?: string; category?: string; note?: string }
  ): Promise<unknown> {
    const key = await getHouseholdKey(householdId);
    const updateData = { ...data };

    if (key && data.text !== undefined) {
      const encryptedText = await encryptData(data.text, key);
      updateData.text = JSON.stringify({ encrypted: true, data: encryptedText });
    }

    if (key && data.note !== undefined) {
      const encryptedNote = await encryptData(data.note, key);
      updateData.note = JSON.stringify({ encrypted: true, data: encryptedNote });
    }

    return api.updateListItem(listId, householdId, itemId, updateData);
  }

  // ============================================
  // Passthrough methods (no encryption needed)
  // ============================================

  deleteList(listId: string, householdId: string) {
    return api.deleteList(listId, householdId);
  }

  toggleListItem(listId: string, householdId: string, itemId: string) {
    return api.toggleListItem(listId, householdId, itemId);
  }

  deleteListItem(listId: string, householdId: string, itemId: string) {
    return api.deleteListItem(listId, householdId, itemId);
  }

  // ============================================
  // Attachment methods with encryption
  // ============================================

  /**
   * Upload an encrypted attachment
   * Encrypts both the file content and filename before upload
   */
  async uploadAttachment(
    listId: string,
    householdId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    id: string;
    filename: string;
    size: number;
    mime_type: string;
  }> {
    const { isUnlocked } = useCryptoStore.getState();
    if (!isUnlocked) {
      throw new Error('Please unlock encryption first');
    }

    const key = await getHouseholdKey(householdId);
    if (!key) {
      throw new Error('Household encryption key not available. Please refresh the page.');
    }

    // Encrypt the filename
    const encryptedFilename = await encryptData(file.name, key);
    const encryptedFilenameStr = JSON.stringify(encryptedFilename);

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();

    // Encrypt file content
    const encryptedFile = await encryptFile(fileData, key);
    const packedData = packEncryptedFile(encryptedFile);

    // Request upload URL
    const { upload_url, attachment_id } = await api.getAttachmentUploadUrl(
      listId,
      householdId,
      {
        filename: encryptedFilenameStr,
        size: packedData.byteLength,
        mime_type: file.type || 'application/octet-stream',
      }
    );

    // Upload to S3
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      body: packedData,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to storage');
    }

    if (onProgress) {
      onProgress(100);
    }

    // Confirm upload
    await api.confirmAttachmentUpload(listId, householdId, attachment_id);

    return {
      id: attachment_id,
      filename: file.name,
      size: file.size,
      mime_type: file.type || 'application/octet-stream',
    };
  }

  /**
   * Download and decrypt an attachment
   * Returns the decrypted file as a Blob
   */
  async downloadAttachment(
    listId: string,
    householdId: string,
    attachmentId: string
  ): Promise<{ blob: Blob; filename: string; mimeType: string }> {
    const key = await getHouseholdKey(householdId);
    if (!key) {
      throw new Error('Encryption key not available');
    }

    // Get download URL and metadata
    const { download_url, attachment } = await api.getAttachmentDownloadUrl(
      listId,
      householdId,
      attachmentId
    );

    // Download encrypted file from S3
    const downloadResponse = await fetch(download_url);
    if (!downloadResponse.ok) {
      throw new Error('Failed to download file from storage');
    }

    const encryptedData = await downloadResponse.arrayBuffer();

    // Unpack and decrypt
    const unpackedData = unpackEncryptedFile(encryptedData);
    const decryptedData = await decryptFile(unpackedData, key);

    // Decrypt filename
    let filename = 'attachment';
    try {
      const filenameData = JSON.parse(attachment.filename);
      if (filenameData.ciphertext && filenameData.iv) {
        filename = await decryptData(filenameData, key);
      }
    } catch {
      filename = attachment.filename;
    }

    const blob = new Blob([decryptedData], { type: attachment.mime_type });

    return {
      blob,
      filename,
      mimeType: attachment.mime_type,
    };
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(listId: string, householdId: string, attachmentId: string) {
    return api.deleteAttachment(listId, householdId, attachmentId);
  }

  /**
   * List attachments with decrypted filenames
   */
  async listAttachments(
    listId: string,
    householdId: string
  ): Promise<Array<{
    id: string;
    filename: string;
    size: number;
    mime_type: string;
    uploaded_by: string;
    created_at: string;
  }>> {
    const key = await getHouseholdKey(householdId);
    const attachments = await api.listAttachments(listId, householdId);

    if (!key) {
      return attachments;
    }

    // Decrypt filenames
    return Promise.all(
      attachments.map(async (att) => {
        let filename = att.filename;
        try {
          const filenameData = JSON.parse(att.filename);
          if (filenameData.ciphertext && filenameData.iv) {
            filename = await decryptData(filenameData, key);
          }
        } catch {
          // Keep original filename if not encrypted
        }
        return { ...att, filename };
      })
    );
  }

  // ============================================
  // Private helpers
  // ============================================

  private isListEncrypted(list: ApiList): list is EncryptedList {
    return isEncryptedList(list);
  }

  private async decryptList(list: EncryptedList, key: CryptoKey): Promise<List> {
    const title = await decryptData(list.encrypted_title, key);

    const content = list.encrypted_content
      ? await decryptData(list.encrypted_content, key)
      : '';

    const items = list.encrypted_items
      ? await Promise.all(
          list.encrypted_items.map(async (item) => {
            const decrypted = await decryptListItem(item, key);
            return decryptedToListItem(decrypted);
          })
        )
      : [];

    return {
      list_id: list.list_id,
      household_id: list.household_id,
      title,
      content,
      items,
      type: list.type,
      created_by: list.created_by,
      created_at: list.created_at,
      updated_at: list.updated_at,
      color: list.color,
      icon: list.icon,
      pinned: list.pinned,
    };
  }
}

export const encryptedApi = new EncryptedApiClient();
