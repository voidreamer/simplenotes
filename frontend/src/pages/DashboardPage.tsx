import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ShoppingCart, CheckCircle2, FileText, Lock } from 'lucide-react';
import { isNoteEncrypted } from '../utils/encryptionHelpers';
import { useAuthStore, useHouseholdStore, useListsStore, Household, List } from '../stores/store';
import { api } from '../utils/api';
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

        // Load lists for all households
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
      case 'shopping':
        return ShoppingCart;
      case 'checklist':
        return CheckCircle2;
      default:
        return FileText;
    }
  };

  const getListColorClass = (type: string) => {
    switch (type) {
      case 'shopping':
        return styles.colorShopping;
      case 'checklist':
        return styles.colorChecklist;
      default:
        return styles.colorNote;
    }
  };

  const recentLists = lists
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  // Generate consistent color for household based on name
  const getHouseholdColor = (name: string) => {
    const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Welcome Header */}
      <header className={styles.header}>
        <h1 className={styles.greeting}>
          Welcome back, <span className={styles.userName}>{user?.name?.split(' ')[0] || 'there'}</span>
        </h1>
      </header>

      {/* Households Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Households</h2>

        <div className={styles.householdList}>
          {households.map((household) => {
            const householdLists = lists.filter(l => l.household_id === household.household_id);
            return (
              <button
                key={household.household_id}
                className={styles.householdCard}
                onClick={() => {
                  setCurrentHousehold(household);
                  navigate(`/household/${household.household_id}`);
                }}
              >
                <div
                  className={styles.householdIcon}
                  style={{ backgroundColor: getHouseholdColor(household.name) }}
                >
                  {household.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.cardInfo}>
                  <h3>{household.name}</h3>
                  <p>{householdLists.length} list{householdLists.length !== 1 ? 's' : ''} · {household.members?.length || 1} member{(household.members?.length || 1) !== 1 ? 's' : ''}</p>
                </div>
              </button>
            );
          })}

          <button
            className={styles.addHouseholdButton}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            Add Household
          </button>
        </div>
      </section>

      {/* Recent Lists Section */}
      {recentLists.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Lists</h2>

          <div className={styles.recentList}>
            {recentLists.map((list) => {
              const Icon = getListIcon(list.type);
              const colorClass = getListColorClass(list.type);
              const checkedCount = list.items.filter(i => i.checked).length;
              const totalCount = list.items.length;
              const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

              return (
                <button
                  key={list.list_id}
                  className={styles.recentCard}
                  onClick={() => navigate(`/list/${list.list_id}?household=${list.household_id}`)}
                >
                  <div className={styles.recentHeader}>
                    <div className={`${styles.recentIcon} ${colorClass}`}>
                      <Icon size={18} />
                    </div>
                    <div className={styles.recentInfo}>
                      <h3>
                        {list.title}
                        {isNoteEncrypted(list) && (
                          <Lock size={12} style={{ display: 'inline', marginLeft: 6, opacity: 0.5, verticalAlign: 'middle' }} title="Encrypted" />
                        )}
                      </h3>
                      <p>{checkedCount} of {totalCount} items</p>
                    </div>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={`${styles.progressFill} ${colorClass}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Create Household Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create a Household</h2>
            <p className={styles.modalSubtitle}>
              Give your household a name to get started
            </p>
            <form onSubmit={handleCreateHousehold}>
              <input
                type="text"
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                placeholder="e.g., Home, Work, Vacation House"
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
                  {creating ? 'Creating...' : 'Create Household'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
