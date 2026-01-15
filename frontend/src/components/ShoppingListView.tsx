import { useState, useCallback } from 'react';
import { Plus, Trash2, Check, Minus, ShoppingCart, GripVertical, Pencil } from 'lucide-react';
import { List, ListItem } from '../stores/store';
import { api } from '../utils/api';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ text: '', quantity: 1, unit: '' });

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

  const handleStartEdit = (item: ListItem) => {
    setEditingItemId(item.id);
    setEditingData({
      text: item.text,
      quantity: item.quantity || 1,
      unit: item.unit || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingData.text.trim() || !editingItemId) {
      setEditingItemId(null);
      return;
    }

    try {
      const result = await api.updateListItem(
        list.list_id,
        list.household_id,
        editingItemId,
        {
          text: editingData.text.trim(),
          quantity: editingData.quantity,
          unit: editingData.unit.trim(),
        }
      ) as List;
      onUpdate(result);
    } catch (error) {
      console.error('Failed to update item:', error);
    } finally {
      setEditingItemId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const checkedItems = list.items.filter((i) => i.checked);
  const uncheckedItems = list.items.filter((i) => !i.checked);

  // Drag and drop for unchecked items
  const handleReorder = useCallback(async (newItems: ListItem[]) => {
    const reorderedList: List = {
      ...list,
      items: [...newItems, ...checkedItems],
    };
    onUpdate(reorderedList);
  }, [list, checkedItems, onUpdate]);

  const { getDragHandleProps, getItemClassName } = useDragAndDrop({
    items: uncheckedItems,
    onReorder: handleReorder,
    idKey: 'id',
  });

  // Group by category (for display only, drag works on flat list)
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
        {(() => {
          let flatIndex = 0;
          return categories.map((category) => (
            <div key={category} className={styles.category}>
              {categories.length > 1 && <h3 className={styles.categoryHeader}>{category}</h3>}
              {categorizedItems[category].map((item) => {
                const currentIndex = flatIndex++;
                const isEditing = editingItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className={getItemClassName(currentIndex, styles.item)}
                    {...(isEditing ? {} : getDragHandleProps(currentIndex))}
                  >
                    {isEditing ? (
                      <div className={styles.editForm}>
                        <input
                          type="text"
                          value={editingData.text}
                          onChange={(e) => setEditingData({ ...editingData, text: e.target.value })}
                          className={styles.editInput}
                          autoFocus
                          placeholder="Item name..."
                        />
                        <div className={styles.editRow}>
                          <div className={styles.quantityControl}>
                            <button
                              type="button"
                              className={styles.quantityButton}
                              onClick={() => setEditingData({ ...editingData, quantity: Math.max(1, editingData.quantity - 1) })}
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              value={editingData.quantity}
                              onChange={(e) => setEditingData({ ...editingData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                              className={styles.quantityInput}
                              min="1"
                            />
                            <button
                              type="button"
                              className={styles.quantityButton}
                              onClick={() => setEditingData({ ...editingData, quantity: editingData.quantity + 1 })}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={editingData.unit}
                            onChange={(e) => setEditingData({ ...editingData, unit: e.target.value })}
                            placeholder="Unit"
                            className={styles.editUnitInput}
                          />
                        </div>
                        <div className={styles.editActions}>
                          <button type="button" className={styles.cancelButton} onClick={handleCancelEdit}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={styles.submitButton}
                            onClick={handleSaveEdit}
                            disabled={!editingData.text.trim()}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.dragHandle}>
                          <GripVertical size={16} />
                        </div>
                        <button className={styles.checkbox} onClick={() => handleToggle(item.id)} />
                        <div className={styles.itemContent} onDoubleClick={() => handleStartEdit(item)}>
                          <span className={styles.itemText}>{item.text}</span>
                          {(item.quantity && item.quantity > 1) || item.unit ? (
                            <span className={styles.itemMeta}>
                              {item.quantity || 1} {item.unit}
                            </span>
                          ) : null}
                        </div>
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
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ));
        })()}

        {/* In Cart */}
        {checkedItems.length > 0 && (
          <div className={styles.completedSection}>
            <h3 className={styles.completedHeader}>
              <Check size={16} />
              In Cart ({checkedItems.length})
            </h3>
            {checkedItems.map((item) => {
              const isEditing = editingItemId === item.id;
              return (
                <div key={item.id} className={`${styles.item} ${styles.itemChecked}`}>
                  {isEditing ? (
                    <div className={styles.editForm}>
                      <input
                        type="text"
                        value={editingData.text}
                        onChange={(e) => setEditingData({ ...editingData, text: e.target.value })}
                        className={styles.editInput}
                        autoFocus
                        placeholder="Item name..."
                      />
                      <div className={styles.editRow}>
                        <div className={styles.quantityControl}>
                          <button
                            type="button"
                            className={styles.quantityButton}
                            onClick={() => setEditingData({ ...editingData, quantity: Math.max(1, editingData.quantity - 1) })}
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            value={editingData.quantity}
                            onChange={(e) => setEditingData({ ...editingData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            className={styles.quantityInput}
                            min="1"
                          />
                          <button
                            type="button"
                            className={styles.quantityButton}
                            onClick={() => setEditingData({ ...editingData, quantity: editingData.quantity + 1 })}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={editingData.unit}
                          onChange={(e) => setEditingData({ ...editingData, unit: e.target.value })}
                          placeholder="Unit"
                          className={styles.editUnitInput}
                        />
                      </div>
                      <div className={styles.editActions}>
                        <button type="button" className={styles.cancelButton} onClick={handleCancelEdit}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={styles.submitButton}
                          onClick={handleSaveEdit}
                          disabled={!editingData.text.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className={`${styles.checkbox} ${styles.checkboxChecked}`}
                        onClick={() => handleToggle(item.id)}
                      >
                        <Check size={14} />
                      </button>
                      <div className={styles.itemContent} onDoubleClick={() => handleStartEdit(item)}>
                        <span className={styles.itemText}>{item.text}</span>
                      </div>
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
                    </>
                  )}
                </div>
              );
            })}
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
