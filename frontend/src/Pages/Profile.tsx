import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage } from '../services/api';
import { User } from '../types/user';

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [department, setDepartment] = useState(user?.department ?? '');
  const [studentId, setStudentId] = useState(user?.studentId ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await api.patch<User>('/users/me', { department, studentId, bio });
      setUser(response.data);
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not save your profile'));
    } finally {
      setBusy(false);
    }
  }

  async function deleteProfile() {
    if (!window.confirm('Are you sure you want to permanently delete your profile? This cannot be undone.')) return;

    setError('');
    setBusy(true);
    try {
      await api.delete('/users/me');
      setUser(null);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not delete your profile'));
    } finally {
      setBusy(false);
    }
  }

  function cancelEditing() {
    setDepartment(user?.department ?? '');
    setStudentId(user?.studentId ?? '');
    setBio(user?.bio ?? '');
    setError('');
    setEditing(false);
  }

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
      {editing ? (
        <form onSubmit={saveProfile}>
          <label>Department
            <input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={100} required />
          </label>
          <label>{user.role === 'faculty' ? 'Faculty initial' : 'Student ID'}
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} maxLength={30} />
          </label>
          <label>Bio
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            <button type="button" className="secondary" onClick={cancelEditing} disabled={busy}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <ul className="info">
            <li><span>Role</span> {user.role}{user.role === 'faculty' && !user.isVerified ? ' (waiting for admin verification)' : ''}</li>
            <li><span>Department</span> {user.department}</li>
            <li><span>{user.role === 'faculty' ? 'Initial' : 'Student ID'}</span> {user.studentId || '-'}</li>
            <li><span>Bio</span> {user.bio || '-'}</li>
          </ul>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="button" onClick={() => { setError(''); setEditing(true); }}>Edit profile</button>
            <button type="button" className="danger" onClick={deleteProfile} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete profile'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}