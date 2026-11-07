import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="panel">
      <h1>Your profile</h1>
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
      <p className="muted small">Editing your profile comes in a later step.</p>
    </div>
  );
}