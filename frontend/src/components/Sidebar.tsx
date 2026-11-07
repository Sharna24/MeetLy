import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { navItems } from '../routes/navItems';

interface Props {
  open: boolean;          // is the menu open? (only matters on phones)
  onNavigate: () => void; // called when a link is clicked, so the phone menu can close
}

export default function Sidebar({ open, onNavigate }: Props) {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">🌸 Meetly</div>

      <nav className="nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}   // "/" should only be active on the home page itself
            onClick={onNavigate}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="user-box">
        {user?.avatarUrl && <img className="avatar small-avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />}
        <div className="user-text">
          <strong>{user?.name}</strong>
          <div className="muted small">{user?.role}</div>
        </div>
      </div>
      <button className="secondary" onClick={logout}>Log out</button>
    </aside>
  );
}