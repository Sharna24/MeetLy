import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminNav = [
    { path: '/admin/verification', icon: '✅', label: 'Verify Faculty' },
    { path: '/admin/reports', icon: '🚩', label: 'Reports' },
    { path: '/admin/accounts', icon: '📋', label: 'Accounts' },
  ];

  return (
    <div className="shell">
      <aside
        className="sidebar"
        style={{
          width: sidebarOpen ? 240 : 72,
          transition: 'width 0.2s ease',
          transform: 'none',
          position: 'sticky',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {sidebarOpen && <div className="brand">🛡️ Admin</div>}
          <button
            type="button"
            className="secondary"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{ padding: '6px 10px', margin: '0 auto' }}
          >
            {sidebarOpen ? '◀' : '☰'}
          </button>
        </div>

        <nav className="nav">
          {adminNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="user-box" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          {sidebarOpen && user && (
            <div className="user-text" style={{ marginBottom: 6 }}>
              <strong>{user.name || 'Admin'}</strong>
              <div className="muted small">{user.email}</div>
            </div>
          )}
          <button
            type="button"
            className="danger"
            onClick={handleLogout}
            style={{ width: '100%', marginTop: 0 }}
          >
            {sidebarOpen ? 'Log out' : '🚪'}
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}