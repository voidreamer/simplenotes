import { Link, useNavigate } from 'react-router-dom';
import { Home, Settings, LogOut, Menu, X, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore, useHouseholdStore } from '../stores/store';
import { logout } from '../utils/auth';
import ThemeSwitcher from './ThemeSwitcher';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { households, currentHousehold } = useHouseholdStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.menuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/dashboard" className={styles.logo}>
          SimpleNotes
        </Link>
        <div className={styles.headerRight}>
          <ThemeSwitcher />
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/dashboard" className={styles.sidebarLogo}>
            SimpleNotes
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.navItem}>
            <Home size={20} />
            <span>Dashboard</span>
          </Link>

          <div className={styles.navSection}>
            <div className={styles.navSectionHeader}>
              <span>Households</span>
              <button
                className={styles.addButton}
                onClick={() => navigate('/dashboard?create=household')}
              >
                <Plus size={16} />
              </button>
            </div>

            {households.map((household) => (
              <Link
                key={household.household_id}
                to={`/household/${household.household_id}`}
                className={`${styles.navItem} ${
                  currentHousehold?.household_id === household.household_id
                    ? styles.navItemActive
                    : ''
                }`}
              >
                <span className={styles.householdIcon}>
                  {household.name.charAt(0)}
                </span>
                <span>{household.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/settings" className={styles.navItem}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <button onClick={handleLogout} className={styles.navItem}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={styles.main}>{children}</main>
    </div>
  );
}
