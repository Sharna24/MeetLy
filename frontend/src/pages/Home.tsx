import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="card">
      <h1>Hi, {user.name?.split(' ')[0] ?? 'there'} 🌸</h1>
      <div className="row">
        {user.avatarUrl && <img className="avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />}
        <div>
          <strong>{user.name}</strong>
          <div className="muted small">{user.email}</div>
        </div>
      </div>
      <ul className="info">
        <li><span>Role</span> {user.role}{user.role === 'faculty' && !user.isVerified ? ' (waiting for admin verification)' : ''}</li>
        <li><span>Department</span> {user.department}</li>
        <li><span>{user.role === 'faculty' ? 'Initial' : 'Student ID'}</span> {user.studentId || '-'}</li>
        <li><span>Bio</span> {user.bio || '-'}</li>
      </ul>
      <p className="muted small">The login works. Next: build the routine and free-time features here.</p>
      <button onClick={logout}>Log out</button>
    </div>
  );
}
