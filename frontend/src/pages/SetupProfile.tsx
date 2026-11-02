import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage } from '../services/api';
import { User } from '../types/user';

export default function SetupProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(user?.department ?? '');
  const [studentId, setStudentId] = useState(user?.studentId ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const idLabel = user?.role === 'faculty' ? 'Faculty initial' : 'Student ID';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const r = await api.patch<User>('/users/me', { department, studentId, bio });
      setUser(r.data);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err, 'Could not save your profile'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h1>Complete your profile</h1>
      <div className="row">
        {user?.avatarUrl && <img className="avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />}
        <div>
          <strong>{user?.name}</strong>
          <div className="muted small">{user?.email}</div>
        </div>
      </div>

      <label>Department
        <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. CSE" required />
      </label>
      <label>{idLabel}
        <input value={studentId} onChange={(e) => setStudentId(e.target.value)} />
      </label>
      <label>Bio (optional)
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} />
      </label>

      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save and continue'}</button>
    </form>
  );
}
