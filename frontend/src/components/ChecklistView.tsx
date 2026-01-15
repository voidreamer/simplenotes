import { useState, useCallback } from 'react';
import { Plus, Trash2, Check, GripVertical, Pencil } from 'lucide-react';
import { List, ListItem } from '../stores/store';
import { api } from '../utils/api';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

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

  const handleStartEdit = (item: ListItem) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!editingText.trim()) {
      setEditingItemId(null);
      return;
    }

    // Find the original item to check if text changed
    const originalItem = list.items.find(i => i.id === itemId);
    if (originalItem && editingText.trim() === originalItem.text) {
      setEditingItemId(null);
      return;
    }

    try {
      const result = await api.updateListItem(
        list.list_id,
        list.household_id,
        itemId,
        { text: editingText.trim() }
      ) as List;
      onUpdate(result);
    } catch (error) {
      console.error('Failed to update item:', error);
    } finally {
      setEditingItemId(null);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(itemId);
    } else if (e.key === 'Escape') {
      setEditingItemId(null);
    }
  };

  const checkedItems = list.items.filter((i) => i.checked);
  const uncheckedItems = list.items.filter((i) => !i.checked);

  // Drag and drop for unchecked items
  const handleReorder = useCallback(async (newItems: ListItem[]) => {
    // Combine reordered unchecked items with checked items
    const reorderedList: List = {
      ...list,
      items: [...newItems, ...checkedItems],
    };
    onUpdate(reorderedList);

    // TODO: Persist order to backend when API supports it
  }, [list, checkedItems, onUpdate]);

  const { getDragHandleProps, getItemClassName } = useDragAndDrop({
    items: uncheckedItems,
    onReorder: handleReorder,
    idKey: 'id',
  });

  return (
    <div className={styles.checklist}>
      {/* Progress */}
      {list.items.length > 0 && (
        <div className={styles.progress}>
          <div className={`${styles.progressBar} ${checkedItems.length === list.items.length ? styles.progressComplete : ''}`}>
            <div
              className={styles.progressFill}
              style={{ width: `${(checkedItems.length / list.items.length) * 100}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {checkedItems.length === list.items.length ? 'Complete!' : `${Math.round((checkedItems.length / list.items.length) * 100)}%`}
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
        {uncheckedItems.map((item, index) => (
          <div
            key={item.id}
            className={getItemClassName(index, styles.item)}
            {...getDragHandleProps(index)}
          >
            <div className={styles.dragHandle}>
              <GripVertical size={16} />
            </div>
            <button className={styles.checkbox} onClick={() => handleToggle(item.id)} />
            {editingItemId === item.id ? (
              <input
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                onBlur={() => handleSaveEdit(item.id)}
                className={styles.itemInput}
                autoFocus
              />
            ) : (
              <span
                className={styles.itemText}
                onDoubleClick={() => handleStartEdit(item)}
              >
                {item.text}
              </span>
            )}
            <div className={styles.itemActions}>
              <button
                className={styles.editButton}
                onClick={() => handleStartEdit(item)}
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => handleDelete(item.id)}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
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
                {editingItemId === item.id ? (
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                    onBlur={() => handleSaveEdit(item.id)}
                    className={styles.itemInput}
                    autoFocus
                  />
                ) : (
                  <span
                    className={styles.itemText}
                    onDoubleClick={() => handleStartEdit(item)}
                  >
                    {item.text}
                  </span>
                )}
                <div className={styles.itemActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleStartEdit(item)}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
