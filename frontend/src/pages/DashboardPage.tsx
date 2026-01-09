import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Home as HomeIcon, ShoppingCart, CheckCircle2, FileText, Users, Sparkles, User } from 'lucide-react';
import { useAuthStore, useHouseholdStore, useListsStore, Household, List } from '../stores/store';
import { api } from '../utils/api';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { households, setHouseholds, setCurrentHousehold } = useHouseholdStore();
  const { lists, setLists, setLoading: setListsLoading } = useListsStore();

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

  const getListColor = (type: string) => {
    switch (type) {
      case 'shopping':
        return '#f59e0b';
      case 'checklist':
        return '#10b981';
      default:
        return '#6366f1';
    }
  };

  const recentLists = lists
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  // Separate personal and shared households
  const personalHouseholds = households.filter(
    (h) => h.name === 'Personal' && (h.members?.length || 1) === 1
  );
  const sharedHouseholds = households.filter(
    (h) => h.name !== 'Personal' || (h.members?.length || 1) > 1
  );

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
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Welcome back, <span className={styles.gradient}>{user?.name?.split(' ')[0] || 'there'}</span>
          </h1>
          <p className={styles.subtitle}>Here's what's happening with your lists</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className={styles.createButton}>
          <Plus size={20} />
          New Household
        </button>
      </header>

      {/* Quick Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <HomeIcon size={24} />
          </div>
          <div>
            <p className={styles.statValue}>{households.length}</p>
            <p className={styles.statLabel}>Households</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <FileText size={24} />
          </div>
          <div>
            <p className={styles.statValue}>{lists.length}</p>
            <p className={styles.statLabel}>Lists</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className={styles.statValue}>
              {lists.reduce((acc, list) => acc + list.items.filter(i => i.checked).length, 0)}
            </p>
            <p className={styles.statLabel}>Items Done</p>
          </div>
        </div>
      </div>

      {/* Personal Lists */}
      {personalHouseholds.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <User size={20} />
              Personal
            </h2>
          </div>
          <div className={styles.householdGrid}>
            {personalHouseholds.map((household) => (
              <button
                key={household.household_id}
                className={`${styles.householdCard} ${styles.personalCard}`}
                onClick={() => {
                  setCurrentHousehold(household);
                  navigate(`/household/${household.household_id}`);
                }}
              >
                <div className={styles.householdIcon} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <User size={20} />
                </div>
                <div className={styles.householdInfo}>
                  <h3>My Lists</h3>
                  <p>
                    {lists.filter(l => l.household_id === household.household_id).length} list
                    {lists.filter(l => l.household_id === household.household_id).length !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Shared Households */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Users size={20} />
            Shared Households
          </h2>
        </div>

        {sharedHouseholds.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Sparkles size={48} />
            </div>
            <h3>Create a shared household</h3>
            <p>Households let you share lists with family members</p>
            <button onClick={() => setShowCreateModal(true)} className={styles.emptyButton}>
              <Plus size={20} />
              Create Household
            </button>
          </div>
        ) : (
          <div className={styles.householdGrid}>
            {sharedHouseholds.map((household) => (
              <button
                key={household.household_id}
                className={styles.householdCard}
                onClick={() => {
                  setCurrentHousehold(household);
                  navigate(`/household/${household.household_id}`);
                }}
              >
                <div className={styles.householdIcon}>
                  {household.name.charAt(0)}
                </div>
                <div className={styles.householdInfo}>
                  <h3>{household.name}</h3>
                  <p>
                    <Users size={14} />
                    {household.members?.length || 1} member{(household.members?.length || 1) !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            ))}
            <button
              className={`${styles.householdCard} ${styles.addCard}`}
              onClick={() => setShowCreateModal(true)}
            >
              <div className={styles.householdIcon}>
                <Plus size={20} />
              </div>
              <div className={styles.householdInfo}>
                <h3>Add Household</h3>
                <p>Create a new shared space</p>
              </div>
            </button>
          </div>
        )}
      </section>

      {/* Recent Lists */}
      {recentLists.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Lists</h2>
          </div>

          <div className={styles.listGrid}>
            {recentLists.map((list) => {
              const Icon = getListIcon(list.type);
              const color = getListColor(list.type);
              const checkedCount = list.items.filter(i => i.checked).length;
              const totalCount = list.items.length;

              return (
                <button
                  key={list.list_id}
                  className={styles.listCard}
                  onClick={() => navigate(`/list/${list.list_id}?household=${list.household_id}`)}
                >
                  <div className={styles.listHeader}>
                    <div className={styles.listIcon} style={{ background: `${color}20`, color }}>
                      <Icon size={20} />
                    </div>
                    <span className={styles.listType}>{list.type}</span>
                  </div>
                  <h3 className={styles.listTitle}>{list.title}</h3>
                  {totalCount > 0 && (
                    <div className={styles.listProgress}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${(checkedCount / totalCount) * 100}%`,
                            background: color,
                          }}
                        />
                      </div>
                      <span className={styles.progressText}>
                        {checkedCount}/{totalCount}
                      </span>
                    </div>
                  )}
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
