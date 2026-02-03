import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ShoppingCart, CheckCircle2, FileText, Lock, ChevronRight } from 'lucide-react';
import { useAuthStore, useHouseholdStore, useListsStore, Household, List } from '../stores/store';
import { api } from '../utils/api';
import { isNoteEncrypted } from '../utils/encryptionHelpers';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { households, setHouseholds, setCurrentHousehold } = useHouseholdStore();
  const { lists, setLists } = useListsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get('create') === 'household') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const householdsData = await api.getHouseholds() as Household[];
        setHouseholds(householdsData);

        const allLists: List[] = [];
        for (const household of householdsData) {
          const householdLists = await api.getLists(household.household_id) as List[];
          allLists.push(...householdLists);
        }
        setLists(allLists);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setHouseholds, setLists]);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseholdName.trim()) return;

    setCreating(true);
    try {
      const household = await api.createHousehold(newHouseholdName.trim()) as Household;
      setHouseholds([...households, household]);
      setShowCreateModal(false);
      setNewHouseholdName('');
      navigate(`/household/${household.household_id}`);
    } catch (error) {
      console.error('Failed to create household:', error);
    } finally {
      setCreating(false);
    }
  };

  const getListIcon = (type: string) => {
    switch (type) {
      case 'shopping': return ShoppingCart;
      case 'checklist': return CheckCircle2;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'shopping': return 'var(--color-shopping)';
      case 'checklist': return 'var(--color-checklist)';
      default: return 'var(--color-note)';
    }
  };

  const getHouseholdName = (householdId: string) => {
    return households.find(h => h.household_id === householdId)?.name || '';
  };

  const getHouseholdColor = (name: string) => {
    const colors = ['#e8a8c0', '#88c8a8', '#b898d0', '#e8c070', '#70b8e8', '#e87070'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatRelativeDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // All lists sorted by recent
  const recentLists = [...lists]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <header className={styles.header}>
        <h1 className={styles.greeting}>
          Hi, <span className={styles.userName}>{user?.name?.split(' ')[0] || 'there'}</span>
        </h1>
      </header>

      {/* Households — compact row */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Households</h2>
          <button className={styles.addBtn} onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
          </button>
        </div>

        <div className={styles.householdRow}>
          {households.map((household) => {
            const count = lists.filter(l => l.household_id === household.household_id).length;
            return (
              <button
                key={household.household_id}
                className={styles.householdChip}
                onClick={() => {
                  setCurrentHousehold(household);
                  navigate(`/household/${household.household_id}`);
                }}
              >
                <span
                  className={styles.chipDot}
                  style={{ background: getHouseholdColor(household.name) }}
                />
                <span className={styles.chipName}>{household.name}</span>
                <span className={styles.chipCount}>{count}</span>
                <ChevronRight size={14} className={styles.chipArrow} />
              </button>
            );
          })}
        </div>
      </section>

      {/* All Notes — clean list */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>All Notes</h2>

        {recentLists.length === 0 ? (
          <div className={styles.empty}>
            <p>No notes yet. Pick a household and create one!</p>
          </div>
        ) : (
          <div className={styles.notesList}>
            {recentLists.map((list) => {
              const Icon = getListIcon(list.type);
              const householdName = getHouseholdName(list.household_id);

              return (
                <button
                  key={list.list_id}
                  className={styles.noteRow}
                  onClick={() => navigate(`/list/${list.list_id}?household=${list.household_id}`)}
                >
                  <div className={styles.noteIcon} style={{ color: getTypeColor(list.type) }}>
                    <Icon size={16} />
                  </div>
                  <div className={styles.noteInfo}>
                    <span className={styles.noteTitle}>
                      {list.title}
                      {isNoteEncrypted(list) && (
                        <Lock size={11} className={styles.lockIcon} />
                      )}
                    </span>
                    <span className={styles.noteMeta}>
                      {householdName}
                      {list.type !== 'note' && list.items.length > 0 && (
                        <> · {list.items.filter(i => i.checked).length}/{list.items.length}</>
                      )}
                    </span>
                  </div>
                  <span className={styles.noteTime}>
                    {formatRelativeDate(list.updated_at || list.created_at)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Household Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>New Household</h2>
            <form onSubmit={handleCreateHousehold}>
              <input
                type="text"
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                placeholder="e.g., Home, Work"
                className={styles.modalInput}
                autoFocus
              />
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newHouseholdName.trim()}
                  className={styles.submitButton}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
