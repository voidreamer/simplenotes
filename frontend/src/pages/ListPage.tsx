import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, FileText, CheckSquare, ShoppingCart, Pencil } from 'lucide-react';
import { useListsStore, List } from '../stores/store';
import { api } from '../utils/api';
import NoteEditor from '../components/NoteEditor';
import ChecklistView from '../components/ChecklistView';
import ShoppingListView from '../components/ShoppingListView';
import styles from './ListPage.module.css';

export default function ListPage() {
  const { listId } = useParams();
  const [searchParams] = useSearchParams();
  const householdId = searchParams.get('household') || '';
  const navigate = useNavigate();

  const { currentList, setCurrentList, toggleItem, removeItem, updateList } = useListsStore();
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

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

  const handleToggleItem = (itemId: string) => {
    if (!listId) return;
    toggleItem(listId, itemId);
  };

  const handleRemoveItem = (itemId: string) => {
    if (!listId) return;
    removeItem(listId, itemId);
  };

  const handleUpdateList = (updated: List) => {
    setCurrentList(updated);
    if (listId && householdId) {
      updateList(listId, householdId, updated);
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

  const handleStartEditTitle = () => {
    setEditingTitle(true);
    setTitleValue(currentList?.title || '');
  };

  const handleSaveTitle = async () => {
    if (!titleValue.trim() || !listId || !householdId || !currentList) {
      setEditingTitle(false);
      return;
    }

    if (titleValue.trim() === currentList.title) {
      setEditingTitle(false);
      return;
    }

    try {
      const updated = await api.updateList(listId, householdId, {
        title: titleValue.trim(),
      }) as List;
      setCurrentList(updated);
      updateList(listId, householdId, updated);
    } catch (error) {
      console.error('Failed to update title:', error);
    } finally {
      setEditingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditingTitle(false);
    }
  };

  const getTypeIcon = () => {
    switch (currentList?.type) {
      case 'note':
        return <FileText size={16} />;
      case 'checklist':
        return <CheckSquare size={16} />;
      case 'shopping':
        return <ShoppingCart size={16} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - show time
      return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
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

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={() => navigate(`/household/${householdId}`)} className={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.headerInfo}>
          {editingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleSaveTitle}
              className={styles.titleInput}
              autoFocus
            />
          ) : (
            <h1 className={styles.titleEditable} onClick={handleStartEditTitle}>
              {currentList.title}
              <Pencil size={16} className={styles.editIcon} />
            </h1>
          )}
          <div className={styles.meta}>
            <span className={styles.typeLabel}>
              {getTypeIcon()}
            </span>
            <span className={styles.separator}>·</span>
            <span className={styles.date}>
              {currentList.updated_at
                ? `Updated ${formatDate(currentList.updated_at)}`
                : currentList.created_at
                  ? `Created ${formatDate(currentList.created_at)}`
                  : ''}
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleDeleteList} className={styles.actionButton} title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Content based on type */}
      <div className={styles.content}>
        {currentList.type === 'note' && (
          <NoteEditor list={currentList} onUpdate={handleUpdateList} />
        )}
        {currentList.type === 'checklist' && (
          <ChecklistView
            list={currentList}
            onUpdate={handleUpdateList}
            onToggleItem={handleToggleItem}
            onRemoveItem={handleRemoveItem}
          />
        )}
        {currentList.type === 'shopping' && (
          <ShoppingListView
            list={currentList}
            onUpdate={handleUpdateList}
            onToggleItem={handleToggleItem}
            onRemoveItem={handleRemoveItem}
          />
        )}
      </div>
    </div>
  );
}
