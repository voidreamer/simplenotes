import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Settings, UserPlus, ShoppingCart, CheckCircle2, FileText, ArrowLeft, Trash2, MoreVertical, LogOut } from 'lucide-react';
import { useHouseholdStore, useListsStore, useAuthStore, Household, List } from '../stores/store';
import { api } from '../utils/api';
import { useShortcutEvent } from '../hooks/useKeyboardShortcuts';
import styles from './HouseholdPage.module.css';

type ListType = 'note' | 'checklist' | 'shopping';

const listTypeConfig = {
  shopping: { icon: ShoppingCart, color: '#f59e0b', label: 'Shopping List' },
  checklist: { icon: CheckCircle2, color: '#10b981', label: 'Checklist' },
  note: { icon: FileText, color: '#6366f1', label: 'Note' },
};

export default function HouseholdPage() {
  const { householdId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentHousehold, setCurrentHousehold, removeHousehold } = useHouseholdStore();
  const { lists, setLists, addList } = useListsStore();

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListType, setNewListType] = useState<ListType>('shopping');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const householdLists = lists.filter(l => l.household_id === householdId);
  const isOwner = currentHousehold?.owner_id === user?.user_id;
  const isPersonal = currentHousehold?.name === 'Personal' && (currentHousehold?.members?.length || 1) === 1;

  // Keyboard shortcuts
  useShortcutEvent('shortcut:new', useCallback(() => {
    setShowCreateModal(true);
  }, []));

  useShortcutEvent('shortcut:escape', useCallback(() => {
    setShowCreateModal(false);
    setShowInviteModal(false);
    setShowDeleteModal(false);
  }, []));

  useEffect(() => {
    const loadHousehold = async () => {
      if (!householdId) return;

      try {
        const household = await api.getHousehold(householdId) as Household;
        setCurrentHousehold(household);

        const householdLists = await api.getLists(householdId) as List[];
        setLists(householdLists);
      } catch (error) {
        console.error('Failed to load household:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadHousehold();
  }, [householdId, navigate, setCurrentHousehold, setLists]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !householdId) return;

    setCreating(true);
    try {
      const list = await api.createList({
        household_id: householdId,
        title: newListTitle.trim(),
        type: newListType,
      }) as List;
      addList(list);
      setShowCreateModal(false);
      setNewListTitle('');
      navigate(`/list/${list.list_id}?household=${householdId}`);
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !householdId) return;

    setInviting(true);
    try {
      await api.createInvite(householdId, inviteEmail.trim());
      setShowInviteModal(false);
      setInviteEmail('');
      alert('Invitation sent!');
    } catch (error: any) {
      alert(error.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteHousehold = async () => {
    if (!householdId) return;

    setDeleting(true);
    try {
      if (isOwner) {
        await api.deleteHousehold(householdId);
      } else {
        await api.leaveHousehold(householdId);
      }
      removeHousehold(householdId);
      navigate('/dashboard');
    } catch (error: any) {
      alert(error.message || 'Failed to delete/leave household');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.householdIcon}>
            {currentHousehold?.name?.charAt(0) || 'H'}
          </div>
          <div>
            <h1 className={styles.title}>{currentHousehold?.name}</h1>
            <p className={styles.memberCount}>
              {currentHousehold?.members?.length || 1} member{(currentHousehold?.members?.length || 1) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!isPersonal && (
            <button onClick={() => setShowInviteModal(true)} className={styles.inviteButton}>
              <UserPlus size={18} />
              <span>Invite</span>
            </button>
          )}
          {!isPersonal && (
            <button onClick={() => setShowDeleteModal(true)} className={styles.deleteButton}>
              {isOwner ? <Trash2 size={18} /> : <LogOut size={18} />}
            </button>
          )}
        </div>
      </header>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        {Object.entries(listTypeConfig).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={type}
              className={styles.quickAction}
              onClick={() => {
                setNewListType(type as ListType);
                setShowCreateModal(true);
              }}
              style={{ '--accent-color': config.color } as React.CSSProperties}
            >
              <Icon size={24} />
              <span>New {config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Lists */}
      <section className={styles.listsSection}>
        <div className={styles.sectionHeader}>
          <h2>Lists</h2>
          <button onClick={() => setShowCreateModal(true)} className={styles.addButton}>
            <Plus size={18} />
          </button>
        </div>

        {householdLists.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No lists yet. Create one to get started!</p>
          </div>
        ) : (
          <div className={styles.listGrid}>
            {householdLists.map((list) => {
              const config = listTypeConfig[list.type as ListType] || listTypeConfig.note;
              const Icon = config.icon;
              const checkedCount = list.items.filter(i => i.checked).length;
              const totalCount = list.items.length;

              return (
                <button
                  key={list.list_id}
                  className={styles.listCard}
                  onClick={() => navigate(`/list/${list.list_id}?household=${list.household_id}`)}
                >
                  <div className={styles.listCardHeader}>
                    <div className={styles.listIcon} style={{ background: `${config.color}20`, color: config.color }}>
                      <Icon size={20} />
                    </div>
                    {list.pinned && <span className={styles.pinnedBadge}>Pinned</span>}
                  </div>
                  <h3 className={styles.listTitle}>{list.title}</h3>
                  <p className={styles.listMeta}>
                    {totalCount} item{totalCount !== 1 ? 's' : ''}
                    {totalCount > 0 && ` • ${checkedCount} done`}
                  </p>
                  {totalCount > 0 && (
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${(checkedCount / totalCount) * 100}%`, background: config.color }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Members */}
      {currentHousehold?.members && currentHousehold.members.length > 0 && (
        <section className={styles.membersSection}>
          <h2>Members</h2>
          <div className={styles.membersList}>
            {(currentHousehold.members as any[]).map((member: any) => (
              <div key={member.user_id || member} className={styles.memberCard}>
                <div className={styles.memberAvatar}>
                  {typeof member === 'object' ? member.name?.charAt(0) : 'U'}
                </div>
                <div className={styles.memberInfo}>
                  <p className={styles.memberName}>
                    {typeof member === 'object' ? member.name : 'Member'}
                  </p>
                  <p className={styles.memberEmail}>
                    {typeof member === 'object' ? member.email : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Create New List</h2>
            <form onSubmit={handleCreateList}>
              <div className={styles.typeSelector}>
                {Object.entries(listTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`${styles.typeOption} ${newListType === type ? styles.typeOptionActive : ''}`}
                      onClick={() => setNewListType(type as ListType)}
                      style={{ '--type-color': config.color } as React.CSSProperties}
                    >
                      <Icon size={24} />
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="List name..."
                className={styles.modalInput}
                autoFocus
              />
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" disabled={creating || !newListTitle.trim()} className={styles.submitButton}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Invite to Household</h2>
            <p className={styles.modalSubtitle}>
              Enter the email address of the person you want to invite
            </p>
            <form onSubmit={handleInvite}>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
                className={styles.modalInput}
                autoFocus
              />
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowInviteModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" disabled={inviting || !inviteEmail.trim()} className={styles.submitButton}>
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Leave Household Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{isOwner ? 'Delete Household' : 'Leave Household'}</h2>
            <p className={styles.modalSubtitle}>
              {isOwner
                ? 'This will permanently delete this household and all its lists. This action cannot be undone.'
                : 'You will no longer have access to this household and its lists.'}
            </p>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowDeleteModal(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteHousehold}
                disabled={deleting}
                className={styles.dangerButton}
              >
                {deleting ? 'Processing...' : isOwner ? 'Delete Household' : 'Leave Household'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
