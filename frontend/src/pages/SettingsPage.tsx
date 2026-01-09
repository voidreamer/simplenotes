import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, LogOut, Palette } from 'lucide-react';
import { useAuthStore } from '../stores/store';
import { useThemeStore, themes, ThemeName } from '../stores/themeStore';
import { logout } from '../utils/auth';
import { api } from '../utils/api';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const updated = await api.updateProfile({ name: name.trim() });
      setUser(updated as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your account and preferences</p>
      </header>

      {/* Profile Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <User size={20} />
          <h2>Profile</h2>
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {user?.picture ? (
                <img src={user.picture} alt={user.name} />
              ) : (
                <span>{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className={styles.avatarInfo}>
              <p className={styles.email}>{user?.email}</p>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || name === user?.name}
            className={styles.saveButton}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Theme Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Palette size={20} />
          <h2>Appearance</h2>
        </div>
        <div className={styles.sectionContent}>
          <p className={styles.themeDescription}>Choose a theme for your app</p>
          <div className={styles.themeGrid}>
            {(Object.keys(themes) as ThemeName[]).map((themeName) => (
              <button
                key={themeName}
                className={`${styles.themeOption} ${theme === themeName ? styles.themeOptionActive : ''}`}
                onClick={() => setTheme(themeName)}
              >
                <span className={styles.themeIcon}>{themes[themeName].icon}</span>
                <span className={styles.themeName}>{themes[themeName].name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Bell size={20} />
          <h2>Notifications</h2>
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.toggleRow}>
            <div>
              <p className={styles.toggleLabel}>Email Notifications</p>
              <p className={styles.toggleDescription}>
                Receive emails when invited to households
              </p>
            </div>
            <input type="checkbox" defaultChecked className={styles.toggle} />
          </div>
          <div className={styles.toggleRow}>
            <div>
              <p className={styles.toggleLabel}>Push Notifications</p>
              <p className={styles.toggleDescription}>
                Get notified when lists are updated
              </p>
            </div>
            <input type="checkbox" className={styles.toggle} />
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Shield size={20} />
          <h2>Account</h2>
        </div>
        <div className={styles.sectionContent}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </section>

      {/* App Info */}
      <div className={styles.appInfo}>
        <p>SimpleNotes v1.0.0</p>
        <p>Made with love for households everywhere</p>
      </div>
    </div>
  );
}
