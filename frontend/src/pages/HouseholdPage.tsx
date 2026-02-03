import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, UserPlus, ShoppingCart, CheckCircle2, FileText, ArrowLeft, Trash2, MoreVertical, LogOut, ArrowUpDown, Pencil, UserMinus, Shield, AlertTriangle, Lock } from 'lucide-react';
import { isNoteEncrypted, isEncryptedValue } from '../utils/encryptionHelpers';
import { useHouseholdStore, useListsStore, useAuthStore, Household, List } from '../stores/store';
import { api } from '../utils/api';
import { useShortcutEvent } from '../hooks/useKeyboardShortcuts';
import styles from './HouseholdPage.module.css';

type ListType = 'note' | 'checklist' | 'shopping';

const listTypeConfig = {
  shopping: { icon: ShoppingCart, label: 'Shopping List', description: 'Track items to buy', colorClass: 'colorShopping' },
  checklist: { icon: CheckCircle2, label: 'Checklist', description: 'Tasks and to-dos', colorClass: 'colorChecklist' },
  note: { icon: FileText, label: 'Note', description: 'Quick notes', colorClass: 'colorNote' },
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
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListType, setNewListType] = useState<ListType>('shopping');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name' | 'type'>('updated');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [removingMember, setRemovingMember] = useState(false);

  const householdLists = lists.filter(l => l.household_id === householdId);

  // Sort lists based on selected option
  const sortedLists = [...householdLists].sort((a, b) => {
    switch (sortBy) {
      case 'updated':
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
      case 'created':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'name':
        return a.title.localeCompare(b.title);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

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
    setShowOptionsMenu(false);
    setShowSortMenu(false);
    setEditingName(false);
    setShowRemoveMemberModal(false);
    setSelectedMember(null);
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

  const handleStartEditName = () => {
    if (!isOwner || isPersonal) return;
    setEditingName(true);
    setNameValue(currentHousehold?.name || '');
  };

  const handleSaveName = async () => {
    if (!nameValue.trim() || !householdId || !currentHousehold) {
      setEditingName(false);
      return;
    }

    if (nameValue.trim() === currentHousehold.name) {
      setEditingName(false);
      return;
    }

    try {
      const updated = await api.updateHousehold(householdId, {
        name: nameValue.trim(),
      }) as Household;
      setCurrentHousehold(updated);
    } catch (error) {
      console.error('Failed to update household name:', error);
    } finally {
      setEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditingName(false);
    }
  };

  const handleMemberClick = (member: any) => {
    if (!isOwner) return;
    if (member.user_id === user?.user_id) return;
    setSelectedMember(member);
    setShowRemoveMemberModal(true);
  };

  const handleRemoveMember = async () => {
    if (!householdId || !selectedMember) return;

    setRemovingMember(true);
    try {
      await api.removeMember(householdId, selectedMember.user_id);
      // Refresh household data
      const household = await api.getHousehold(householdId) as Household;
      setCurrentHousehold(household);
      setShowRemoveMemberModal(false);
      setSelectedMember(null);
    } catch (error: any) {
      alert(error.message || 'Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  // Format relative date for display
  const formatRelativeDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Generate consistent color for member based on name
  const getMemberColor = (name: string) => {
    const colors = [
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #6366f1, #4f46e5)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #ec4899, #db2777)',
      'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      'linear-gradient(135deg, #14b8a6, #0d9488)',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get household icon color
  const getHouseholdColor = (name: string) => {
    const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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
        <div className={styles.headerLeft}>
          <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
            <ArrowLeft size={20} />
          </button>
          <div
            className={styles.householdIcon}
            style={{ backgroundColor: getHouseholdColor(currentHousehold?.name || 'H') }}
          >
            {currentHousehold?.name?.charAt(0) || 'H'}
          </div>
          <div className={styles.headerInfo}>
            {editingName ? (
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={handleSaveName}
                className={styles.nameInput}
                autoFocus
              />
            ) : (
              <h1
                className={`${styles.title} ${isOwner && !isPersonal ? styles.titleEditable : ''}`}
                onClick={handleStartEditName}
              >
                {currentHousehold?.name}
                {isOwner && !isPersonal && <Pencil size={14} className={styles.editIcon} />}
              </h1>
            )}
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
            <div className={styles.optionsWrapper}>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className={styles.optionsButton}
              >
                <MoreVertical size={20} />
              </button>
              {showOptionsMenu && (
                <div className={styles.optionsMenu}>
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className={styles.optionsMenuItem}
                  >
                    {isOwner ? <Trash2 size={16} /> : <LogOut size={16} />}
                    {isOwner ? 'Delete Household' : 'Leave Household'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Lists */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Lists</h2>
          {householdLists.length > 0 && (
            <div className={styles.sortWrapper}>
              <button
                className={styles.sortButton}
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown size={14} />
                <span>{sortBy === 'updated' ? 'Recent' : sortBy === 'created' ? 'Created' : sortBy === 'name' ? 'Name' : 'Type'}</span>
              </button>
              {showSortMenu && (
                <div className={styles.sortMenu}>
                  <button
                    className={`${styles.sortOption} ${sortBy === 'updated' ? styles.sortOptionActive : ''}`}
                    onClick={() => { setSortBy('updated'); setShowSortMenu(false); }}
                  >
                    Recently updated
                  </button>
                  <button
                    className={`${styles.sortOption} ${sortBy === 'created' ? styles.sortOptionActive : ''}`}
                    onClick={() => { setSortBy('created'); setShowSortMenu(false); }}
                  >
                    Date created
                  </button>
                  <button
                    className={`${styles.sortOption} ${sortBy === 'name' ? styles.sortOptionActive : ''}`}
                    onClick={() => { setSortBy('name'); setShowSortMenu(false); }}
                  >
                    Name (A-Z)
                  </button>
                  <button
                    className={`${styles.sortOption} ${sortBy === 'type' ? styles.sortOptionActive : ''}`}
                    onClick={() => { setSortBy('type'); setShowSortMenu(false); }}
                  >
                    Type
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.listGrid}>
          {sortedLists.map((list) => {
            const config = listTypeConfig[list.type as ListType] || listTypeConfig.note;
            const checkedCount = list.items.filter(i => i.checked).length;
            const totalCount = list.items.length;
            const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

            const encrypted = isNoteEncrypted(list);
            const displayTitle = isEncryptedValue(list.title) ? 'Encrypted note' : list.title;

            // Generate preview content
            const getPreview = () => {
              if (encrypted) {
                return '🔒 Unlock to view contents';
              }
              if (list.type === 'note') {
                const text = list.content?.replace(/<[^>]*>/g, '') || '';
                if (isEncryptedValue(text)) return '🔒 Unlock to view contents';
                return text.slice(0, 80) + (text.length > 80 ? '...' : '');
              } else {
                const uncheckedItems = list.items.filter(i => !i.checked).slice(0, 3);
                const texts = uncheckedItems.map(i => 
                  isEncryptedValue(i.text) ? '••••' : i.text
                );
                return texts.join(' · ') || 'No items yet';
              }
            };

            const Icon = config.icon;

            return (
              <button
                key={list.list_id}
                className={`${styles.listCard} ${styles[config.colorClass + 'Border']}`}
                onClick={() => navigate(`/list/${list.list_id}?household=${list.household_id}`)}
              >
                <div className={styles.listHeader}>
                  <div className={styles.listTitleRow}>
                    <span className={`${styles.listIcon} ${encrypted ? '' : styles[config.colorClass]}`}>
                      {encrypted ? <Lock size={14} /> : <Icon size={14} />}
                    </span>
                    <h3 className={styles.listTitle}>
                      {displayTitle}
                    </h3>
                  </div>
                  {(list.updated_at || list.created_at) && (
                    <span className={styles.listDate}>
                      {formatRelativeDate(list.updated_at || list.created_at)}
                    </span>
                  )}
                </div>
                <p className={styles.listPreview}>{getPreview()}</p>
                {list.type !== 'note' && totalCount > 0 && (
                  <div className={styles.listFooter}>
                    <span className={styles.listProgress}>{checkedCount}/{totalCount}</span>
                    <div className={styles.progressBar}>
                      <div
                        className={`${styles.progressFill} ${styles[config.colorClass]}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {/* Add new list card */}
          <button
            className={styles.addListCard}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            <span className={styles.addListText}>Add list</span>
          </button>
        </div>
      </section>

      {/* Members - Compact Row */}
      {currentHousehold?.members && currentHousehold.members.length > 0 && (
        <section className={styles.membersSection}>
          <span className={styles.membersLabel}>Members</span>
          <div className={styles.membersRow}>
            {(currentHousehold.members as any[]).slice(0, 5).map((member: any) => {
              const memberId = typeof member === 'object' ? member.user_id : member;
              const memberName = typeof member === 'object' ? member.name : 'Member';
              const isCurrentUser = memberId === user?.user_id;
              const isMemberOwner = memberId === currentHousehold.owner_id;
              const canRemove = isOwner && !isCurrentUser && !isMemberOwner;

              return (
                <div
                  key={memberId}
                  className={`${styles.memberAvatarSmall} ${canRemove ? styles.memberClickable : ''}`}
                  style={{ background: getMemberColor(memberName) }}
                  title={`${memberName}${isMemberOwner ? ' (Owner)' : ''}${canRemove ? ' - Click to manage' : ''}`}
                  onClick={() => canRemove && handleMemberClick(member)}
                >
                  {memberName?.charAt(0) || 'U'}
                  {isMemberOwner && <span className={styles.ownerBadge}><Shield size={8} /></span>}
                </div>
              );
            })}
            {currentHousehold.members.length > 5 && (
              <div className={styles.memberAvatarMore}>
                +{currentHousehold.members.length - 5}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create New List</h2>
            <form onSubmit={handleCreateList}>
              <div className={styles.typeSelector}>
                {Object.entries(listTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`${styles.typeOption} ${newListType === type ? styles.typeOptionActive : ''} ${styles[config.colorClass]}`}
                      onClick={() => setNewListType(type as ListType)}
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
            <h2 className={styles.modalTitle}>Invite to Household</h2>
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
            <h2 className={styles.modalTitle}>{isOwner ? 'Delete Household' : 'Leave Household'}</h2>
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

      {/* Remove Member Modal */}
      {showRemoveMemberModal && selectedMember && (
        <div className={styles.modalOverlay} onClick={() => { setShowRemoveMemberModal(false); setSelectedMember(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.removeMemberHeader}>
              <UserMinus size={24} className={styles.removeMemberIcon} />
              <h2 className={styles.modalTitle}>Remove Member</h2>
            </div>
            <p className={styles.modalSubtitle}>
              Remove <strong>{selectedMember.name}</strong> from this household?
            </p>

            <div className={styles.warningBox}>
              <div className={styles.warningHeader}>
                <AlertTriangle size={18} />
                <span>Important: About Encrypted Data</span>
              </div>
              <p className={styles.warningText}>
                This household uses end-to-end encryption. While <strong>{selectedMember.name}</strong> will
                lose access to future updates, they may retain copies of any data they previously viewed
                or downloaded. This is a limitation of client-side encryption - once data has been
                decrypted on their device, we cannot remotely delete it.
              </p>
              <p className={styles.warningNote}>
                If sensitive information was shared, consider creating a new household with fresh
                encryption keys for maximum security.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => { setShowRemoveMemberModal(false); setSelectedMember(null); }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                disabled={removingMember}
                className={styles.dangerButton}
              >
                {removingMember ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {showOptionsMenu && (
        <div className={styles.optionsBackdrop} onClick={() => setShowOptionsMenu(false)} />
      )}
      {showSortMenu && (
        <div className={styles.optionsBackdrop} onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  );
}
