import { useState } from 'react';
import { Plus, Trash2, Check, Minus, ShoppingCart } from 'lucide-react';
import { List, ListItem } from '../stores/store';
import { api } from '../utils/api';
import styles from './ShoppingListView.module.css';

interface ShoppingListViewProps {
  list: List;
  onUpdate: (list: List) => void;
  onToggleItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export default function ShoppingListView({
  list,
  onUpdate,
  onToggleItem,
  onRemoveItem,
}: ShoppingListViewProps) {
  const [newItemText, setNewItemText] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    setAdding(true);
    try {
      const result = await api.addListItem(list.list_id, list.household_id, {
        text: newItemText.trim(),
        quantity: newItemQuantity,
        unit: newItemUnit.trim(),
      }) as List;
      onUpdate(result);
      setNewItemText('');
      setNewItemQuantity(1);
      setNewItemUnit('');
      setShowAddForm(false);
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

  // Group by category
  const categorizedItems = uncheckedItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ListItem[]>);

  const categories = Object.keys(categorizedItems).sort();

  return (
    <div className={styles.shoppingList}>
      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <ShoppingCart size={16} />
          <span>{uncheckedItems.length} to buy</span>
        </div>
        {checkedItems.length > 0 && (
          <div className={`${styles.stat} ${styles.statDone}`}>
            <Check size={16} />
            <span>{checkedItems.length} in cart</span>
          </div>
        )}
      </div>

      {/* Quick Add */}
      {!showAddForm ? (
        <button className={styles.quickAddButton} onClick={() => setShowAddForm(true)}>
          <Plus size={20} />
          Add item
        </button>
      ) : (
        <form onSubmit={handleAddItem} className={styles.addForm}>
          <div className={styles.addFormRow}>
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Item name..."
              className={styles.addInput}
              autoFocus
            />
          </div>
          <div className={styles.addFormRow}>
            <div className={styles.quantityControl}>
              <button
                type="button"
                className={styles.quantityButton}
                onClick={() => setNewItemQuantity(Math.max(1, newItemQuantity - 1))}
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className={styles.quantityInput}
                min="1"
              />
              <button
                type="button"
                className={styles.quantityButton}
                onClick={() => setNewItemQuantity(newItemQuantity + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            <input
              type="text"
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              placeholder="Unit (kg, pcs, etc.)"
              className={styles.unitInput}
            />
          </div>
          <div className={styles.addFormActions}>
            <button type="button" className={styles.cancelButton} onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" disabled={adding || !newItemText.trim()} className={styles.submitButton}>
              Add Item
            </button>
          </div>
        </form>
      )}

      {/* Items by category */}
      <div className={styles.itemsList}>
        {categories.map((category) => (
          <div key={category} className={styles.category}>
            {categories.length > 1 && <h3 className={styles.categoryHeader}>{category}</h3>}
            {categorizedItems[category].map((item) => (
              <div key={item.id} className={styles.item}>
                <button className={styles.checkbox} onClick={() => handleToggle(item.id)} />
                <div className={styles.itemContent}>
                  <span className={styles.itemText}>{item.text}</span>
                  {(item.quantity && item.quantity > 1) || item.unit ? (
                    <span className={styles.itemMeta}>
                      {item.quantity || 1} {item.unit}
                    </span>
                  ) : null}
                </div>
                <button className={styles.deleteButton} onClick={() => handleDelete(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ))}

        {/* In Cart */}
        {checkedItems.length > 0 && (
          <div className={styles.completedSection}>
            <h3 className={styles.completedHeader}>
              <Check size={16} />
              In Cart ({checkedItems.length})
            </h3>
            {checkedItems.map((item) => (
              <div key={item.id} className={`${styles.item} ${styles.itemChecked}`}>
                <button
                  className={`${styles.checkbox} ${styles.checkboxChecked}`}
                  onClick={() => handleToggle(item.id)}
                >
                  <Check size={14} />
                </button>
                <div className={styles.itemContent}>
                  <span className={styles.itemText}>{item.text}</span>
                </div>
                <button className={styles.deleteButton} onClick={() => handleDelete(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {list.items.length === 0 && (
          <div className={styles.emptyState}>
            <ShoppingCart size={32} />
            <p>Your shopping list is empty</p>
            <span>Add items to get started</span>
          </div>
        )}
      </div>
    </div>
  );
}
