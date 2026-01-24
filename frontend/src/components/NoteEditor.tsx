import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import { List, Attachment } from '../stores/store';
import { encryptedApi } from '../utils/encryptedApi';
import AttachmentUploader from './AttachmentUploader';
import AttachmentList from './AttachmentList';
import styles from './NoteEditor.module.css';

interface NoteEditorProps {
  list: List;
  onUpdate: (list: List) => void;
}

export default function NoteEditor({ list, onUpdate }: NoteEditorProps) {
  const [content, setContent] = useState(list.content || '');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(list.attachments || []);

  // Sync content when list changes externally
  useEffect(() => {
    setContent(list.content || '');
    setHasChanges(false);
  }, [list.list_id, list.content]);

  // Fetch attachments with decrypted filenames
  const fetchAttachments = useCallback(async () => {
    try {
      const decryptedAttachments = await encryptedApi.listAttachments(
        list.list_id,
        list.household_id
      );
      setAttachments(decryptedAttachments as Attachment[]);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  }, [list.list_id, list.household_id]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const saveContent = useCallback(async () => {
    if (!hasChanges) return;

    setSaving(true);
    try {
      const updated = await encryptedApi.updateList(list.list_id, list.household_id, { content });
      onUpdate(updated);
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSaving(false);
    }
  }, [content, hasChanges, list.list_id, list.household_id, onUpdate]);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      saveContent();
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, hasChanges, saveContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Cmd/Ctrl + S
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      saveContent();
    }
  };

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <div className={styles.status}>
          {saving && <span className={styles.saving}>Saving...</span>}
          {!saving && hasChanges && <span className={styles.unsaved}>Unsaved changes</span>}
          {!saving && !hasChanges && lastSaved && (
            <span className={styles.saved}>
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button
          onClick={saveContent}
          disabled={saving || !hasChanges}
          className={styles.saveButton}
          title="Save (Cmd/Ctrl + S)"
        >
          <Save size={16} />
          Save
        </button>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={saveContent}
        placeholder="Start writing your note..."
        className={styles.textarea}
        autoFocus
      />
      <div className={styles.footer}>
        <span className={styles.wordCount}>
          {content.length} characters • {content.split(/\s+/).filter(Boolean).length} words
        </span>
      </div>

      <AttachmentList
        listId={list.list_id}
        householdId={list.household_id}
        attachments={attachments}
        onDelete={fetchAttachments}
      />

      <AttachmentUploader
        listId={list.list_id}
        householdId={list.household_id}
        currentCount={attachments.length}
        onUploadComplete={fetchAttachments}
      />
    </div>
  );
}
