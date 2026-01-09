import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { List, ListItem } from '../stores/store';
import { api } from '../utils/api';
import styles from './ChecklistView.module.css';

interface ChecklistViewProps {
  list: List;
  onUpdate: (list: List) => void;
  onToggleItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export default function ChecklistView({
  list,
  onUpdate,
  onToggleItem,
  onRemoveItem,
}: ChecklistViewProps) {
  const [newItemText, setNewItemText] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    setAdding(true);
    try {
      const result = await api.addListItem(list.list_id, list.household_id, {
        text: newItemText.trim(),
      }) as List;
      onUpdate(result);
      setNewItemText('');
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (itemId: string) => {
    onToggleItem(itemId);
    try {
      await api.toggleListItem(list.list_id, list.household_id, itemId);
    } catch (error) {
      console.error('Failed to toggle item:', error);
      onToggleItem(itemId); // Revert on error
    }
  };

  const handleDelete = async (itemId: string) => {
    onRemoveItem(itemId);
    try {
      await api.deleteListItem(list.list_id, list.household_id, itemId);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const checkedItems = list.items.filter((i) => i.checked);
  const uncheckedItems = list.items.filter((i) => !i.checked);

  return (
    <div className={styles.checklist}>
      {/* Progress */}
      {list.items.length > 0 && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(checkedItems.length / list.items.length) * 100}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {Math.round((checkedItems.length / list.items.length) * 100)}% complete
          </span>
        </div>
      )}

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className={styles.addForm}>
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add a task..."
          className={styles.addInput}
        />
        <button type="submit" disabled={adding || !newItemText.trim()} className={styles.addButton}>
          <Plus size={20} />
        </button>
      </form>

      {/* Items */}
      <div className={styles.itemsList}>
        {uncheckedItems.map((item) => (
          <div key={item.id} className={styles.item}>
            <button className={styles.checkbox} onClick={() => handleToggle(item.id)} />
            <span className={styles.itemText}>{item.text}</span>
            <button className={styles.deleteButton} onClick={() => handleDelete(item.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {/* Completed items */}
        {checkedItems.length > 0 && (
          <div className={styles.completedSection}>
            <h3 className={styles.completedHeader}>Completed ({checkedItems.length})</h3>
            {checkedItems.map((item) => (
              <div key={item.id} className={`${styles.item} ${styles.itemChecked}`}>
                <button
                  className={`${styles.checkbox} ${styles.checkboxChecked}`}
                  onClick={() => handleToggle(item.id)}
                >
                  <Check size={14} />
                </button>
                <span className={styles.itemText}>{item.text}</span>
                <button className={styles.deleteButton} onClick={() => handleDelete(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {list.items.length === 0 && (
          <div className={styles.emptyState}>
            <p>No tasks yet. Add your first task above!</p>
          </div>
        )}
      </div>
    </div>
  );
}
