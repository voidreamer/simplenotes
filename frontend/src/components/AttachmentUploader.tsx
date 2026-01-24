import { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, Lock } from 'lucide-react';
import { encryptedApi } from '../utils/encryptedApi';
import { useCryptoStore } from '../stores/cryptoStore';
import styles from './AttachmentUploader.module.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 10;

interface AttachmentUploaderProps {
  listId: string;
  householdId: string;
  currentCount: number;
  onUploadComplete: () => void;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

export default function AttachmentUploader({
  listId,
  householdId,
  currentCount,
  onUploadComplete,
}: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUnlocked = useCryptoStore((state) => state.isUnlocked);
  const householdKeys = useCryptoStore((state) => state.householdKeys);
  const hasKey = householdKeys.has(householdId);
  const encryptionReady = isUnlocked && hasKey;

  // Debug logging - remove after fixing
  console.log('AttachmentUploader debug:', {
    householdId,
    isUnlocked,
    hasKey,
    keysInStore: Array.from(householdKeys.keys()),
    encryptionReady,
  });

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);

    // Validate total count
    if (currentCount + fileArray.length > MAX_ATTACHMENTS) {
      setError(`Maximum ${MAX_ATTACHMENTS} attachments allowed per note`);
      return;
    }

    // Validate file sizes
    const oversized = fileArray.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(`Files over 10MB: ${oversized.map(f => f.name).join(', ')}`);
      return;
    }

    // Start uploading
    const uploadPromises = fileArray.map(async (file) => {
      const uploadId = crypto.randomUUID();

      setUploading(prev => [...prev, {
        id: uploadId,
        name: file.name,
        progress: 0,
      }]);

      try {
        await encryptedApi.uploadAttachment(
          listId,
          householdId,
          file,
          (progress) => {
            setUploading(prev =>
              prev.map(u => u.id === uploadId ? { ...u, progress } : u)
            );
          }
        );

        setUploading(prev => prev.filter(u => u.id !== uploadId));
        return { success: true };
      } catch (err) {
        setUploading(prev =>
          prev.map(u => u.id === uploadId
            ? { ...u, error: err instanceof Error ? err.message : 'Upload failed' }
            : u
          )
        );
        return { success: false };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(r => r.success).length;

    if (successCount > 0) {
      onUploadComplete();
    }
  }, [listId, householdId, currentCount, onUploadComplete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  }, [handleFiles]);

  const removeUpload = useCallback((id: string) => {
    setUploading(prev => prev.filter(u => u.id !== id));
  }, []);

  const remainingSlots = MAX_ATTACHMENTS - currentCount;
  const isMaxed = remainingSlots <= 0;
  const isDisabled = isMaxed || !encryptionReady;

  const getStatusText = () => {
    if (!encryptionReady) return 'Unlock encryption to upload files';
    if (isMaxed) return 'Maximum attachments reached';
    return `Drop files here or click to upload (${remainingSlots} remaining)`;
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${isDisabled ? styles.disabled : ''}`}
        onDragOver={!isDisabled ? handleDragOver : undefined}
        onDragLeave={!isDisabled ? handleDragLeave : undefined}
        onDrop={!isDisabled ? handleDrop : undefined}
        onClick={() => !isDisabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          className={styles.input}
          disabled={isDisabled}
        />
        {!encryptionReady ? <Lock size={24} className={styles.icon} /> : <Upload size={24} className={styles.icon} />}
        <span className={styles.text}>{getStatusText()}</span>
        {encryptionReady && <span className={styles.hint}>Max 10MB per file</span>}
      </div>

      {error && (
        <div className={styles.error}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {uploading.length > 0 && (
        <div className={styles.uploads}>
          {uploading.map(file => (
            <div key={file.id} className={`${styles.uploadItem} ${file.error ? styles.uploadError : ''}`}>
              <div className={styles.uploadInfo}>
                <span className={styles.uploadName}>{file.name}</span>
                {file.error ? (
                  <span className={styles.uploadErrorText}>{file.error}</span>
                ) : (
                  <span className={styles.uploadProgress}>{file.progress}%</span>
                )}
              </div>
              {!file.error && (
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
              {file.error && (
                <button
                  className={styles.removeButton}
                  onClick={() => removeUpload(file.id)}
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
