import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, Pin, MoreVertical } from 'lucide-react';
import { useListsStore, List, ListItem } from '../stores/store';
import { api } from '../utils/api';
import styles from './ListPage.module.css';

export default function ListPage() {
  const { listId } = useParams();
  const [searchParams] = useSearchParams();
  const householdId = searchParams.get('household') || '';
  const navigate = useNavigate();

  const { currentList, setCurrentList, toggleItem, addItem, removeItem } = useListsStore();
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const loadList = async () => {
      if (!listId || !householdId) return;

      try {
        const list = await api.getList(listId, householdId) as List;
        setCurrentList(list);
      } catch (error) {
        console.error('Failed to load list:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadList();
  }, [listId, householdId, navigate, setCurrentList]);

  const handleToggleItem = async (itemId: string) => {
    if (!listId || !householdId) return;

    toggleItem(listId, itemId);
    try {
      await api.toggleListItem(listId, householdId, itemId);
    } catch (error) {
      console.error('Failed to toggle item:', error);
      toggleItem(listId, itemId); // Revert on error
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !listId || !householdId) return;

    setAdding(true);
    try {
      const result = await api.addListItem(listId, householdId, { text: newItemText.trim() }) as List;
      setCurrentList(result);
      setNewItemText('');
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!listId || !householdId) return;

    removeItem(listId, itemId);
    try {
      await api.deleteListItem(listId, householdId, itemId);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleTogglePin = async () => {
    if (!listId || !householdId || !currentList) return;

    try {
      const updated = await api.updateList(listId, householdId, { pinned: !currentList.pinned }) as List;
      setCurrentList(updated);
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleDeleteList = async () => {
    if (!listId || !householdId) return;
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      await api.deleteList(listId, householdId);
      navigate(`/household/${householdId}`);
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!currentList) {
    return (
      <div className={styles.notFound}>
        <p>List not found</p>
        <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  const checkedItems = currentList.items.filter(i => i.checked);
  const uncheckedItems = currentList.items.filter(i => !i.checked);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={() => navigate(`/household/${householdId}`)} className={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{currentList.title}</h1>
          <p className={styles.meta}>
            {currentList.items.length} item{currentList.items.length !== 1 ? 's' : ''}
            {checkedItems.length > 0 && ` • ${checkedItems.length} done`}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleTogglePin}
            className={`${styles.actionButton} ${currentList.pinned ? styles.pinned : ''}`}
            title={currentList.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={18} />
          </button>
          <button onClick={handleDeleteList} className={styles.actionButton} title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Progress */}
      {currentList.items.length > 0 && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(checkedItems.length / currentList.items.length) * 100}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {Math.round((checkedItems.length / currentList.items.length) * 100)}% complete
          </span>
        </div>
      )}

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className={styles.addForm}>
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder={`Add ${currentList.type === 'shopping' ? 'item' : 'task'}...`}
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
            <button
              className={styles.checkbox}
              onClick={() => handleToggleItem(item.id)}
            />
            <span className={styles.itemText}>{item.text}</span>
            {item.quantity && item.quantity > 1 && (
              <span className={styles.itemQuantity}>x{item.quantity}</span>
            )}
            <button
              className={styles.deleteButton}
              onClick={() => handleDeleteItem(item.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {/* Completed items */}
        {checkedItems.length > 0 && (
          <div className={styles.completedSection}>
            <h3 className={styles.completedHeader}>
              Completed ({checkedItems.length})
            </h3>
            {checkedItems.map((item) => (
              <div key={item.id} className={`${styles.item} ${styles.itemChecked}`}>
                <button
                  className={`${styles.checkbox} ${styles.checkboxChecked}`}
                  onClick={() => handleToggleItem(item.id)}
                >
                  <Check size={14} />
                </button>
                <span className={styles.itemText}>{item.text}</span>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {currentList.items.length === 0 && (
          <div className={styles.emptyState}>
            <p>No items yet. Add your first item above!</p>
          </div>
        )}
      </div>
    </div>
  );
}
