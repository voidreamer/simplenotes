import { useState, useCallback, useEffect } from 'react';
import {
  Download,
  Trash2,
  File,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  Loader2,
} from 'lucide-react';
import { encryptedApi } from '../utils/encryptedApi';
import { Attachment } from '../stores/store';
import styles from './AttachmentList.module.css';

interface AttachmentListProps {
  listId: string;
  householdId: string;
  attachments: Attachment[];
  onDelete: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
    return FileText;
  }
  return File;
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

interface ThumbnailState {
  [id: string]: {
    loading: boolean;
    url?: string;
    error?: boolean;
  };
}

export default function AttachmentList({
  listId,
  householdId,
  attachments,
  onDelete,
}: AttachmentListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<ThumbnailState>({});

  // Load thumbnails for images
  useEffect(() => {
    attachments.forEach(async (att) => {
      if (isImageType(att.mime_type) && !thumbnails[att.id]) {
        setThumbnails(prev => ({
          ...prev,
          [att.id]: { loading: true },
        }));

        try {
          const { blob } = await encryptedApi.downloadAttachment(listId, householdId, att.id);
          const url = URL.createObjectURL(blob);
          setThumbnails(prev => ({
            ...prev,
            [att.id]: { loading: false, url },
          }));
        } catch {
          setThumbnails(prev => ({
            ...prev,
            [att.id]: { loading: false, error: true },
          }));
        }
      }
    });

    // Cleanup blob URLs on unmount
    return () => {
      Object.values(thumbnails).forEach(t => {
        if (t.url) URL.revokeObjectURL(t.url);
      });
    };
  }, [attachments, listId, householdId]);

  const handleDownload = useCallback(async (attachment: Attachment) => {
    setDownloading(attachment.id);
    try {
      const { blob, filename } = await encryptedApi.downloadAttachment(
        listId,
        householdId,
        attachment.id
      );

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    } finally {
      setDownloading(null);
    }
  }, [listId, householdId]);

  const handleDelete = useCallback(async (attachment: Attachment) => {
    if (confirmDelete !== attachment.id) {
      setConfirmDelete(attachment.id);
      return;
    }

    setDeleting(attachment.id);
    setConfirmDelete(null);
    try {
      await encryptedApi.deleteAttachment(listId, householdId, attachment.id);
      // Revoke thumbnail URL if exists
      if (thumbnails[attachment.id]?.url) {
        URL.revokeObjectURL(thumbnails[attachment.id].url!);
      }
      onDelete();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete file');
    } finally {
      setDeleting(null);
    }
  }, [listId, householdId, confirmDelete, onDelete, thumbnails]);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Attachments ({attachments.length})</h4>
      <div className={styles.grid}>
        {attachments.map(attachment => {
          const FileIcon = getFileIcon(attachment.mime_type);
          const isImage = isImageType(attachment.mime_type);
          const thumbnail = thumbnails[attachment.id];

          return (
            <div key={attachment.id} className={styles.card}>
              <div className={styles.preview}>
                {isImage && thumbnail?.url ? (
                  <img
                    src={thumbnail.url}
                    alt={attachment.filename}
                    className={styles.thumbnail}
                  />
                ) : isImage && thumbnail?.loading ? (
                  <Loader2 size={32} className={styles.loading} />
                ) : (
                  <FileIcon size={32} className={styles.fileIcon} />
                )}
              </div>
              <div className={styles.info}>
                <span className={styles.filename} title={attachment.filename}>
                  {attachment.filename}
                </span>
                <span className={styles.size}>{formatFileSize(attachment.size)}</span>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.actionButton}
                  onClick={() => handleDownload(attachment)}
                  disabled={downloading === attachment.id}
                  title="Download"
                >
                  {downloading === attachment.id ? (
                    <Loader2 size={16} className={styles.loading} />
                  ) : (
                    <Download size={16} />
                  )}
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deleteButton} ${
                    confirmDelete === attachment.id ? styles.confirm : ''
                  }`}
                  onClick={() => handleDelete(attachment)}
                  disabled={deleting === attachment.id}
                  title={confirmDelete === attachment.id ? 'Click again to confirm' : 'Delete'}
                >
                  {deleting === attachment.id ? (
                    <Loader2 size={16} className={styles.loading} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
