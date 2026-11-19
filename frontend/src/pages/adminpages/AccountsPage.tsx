import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../services/api';

export default function AccountsPage() {
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    const res = await api.get('/admin/dashboard');
    setUsers(res.data.users);
  };

  useEffect(() => { load(); }, []);

  const toggleSuspend = async (u: any) => {
    const url =
      u.status === 'suspended'
        ? `/admin/users/${u.id}/restore`
        : `/admin/users/${u.id}/suspend`;
    await api.patch(url);
    load();
  };

  return (
    <div className="panel">
      <h1>Manage Accounts ({users.length})</h1>
      <p className="muted">Suspend or restore student and faculty accounts.</p>

      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Verified</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name || '-'}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.role === 'faculty' ? (u.isVerified ? 'Yes' : 'No') : '-'}</td>
              <td>{u.status}</td>
              <td>
                {u.role !== 'admin' && (
                  <button
                    type="button"
                    className={u.status === 'suspended' ? 'secondary' : 'danger'}
                    style={{ marginTop: 0 }}
                    onClick={() => toggleSuspend(u)}
                  >
                    {u.status === 'suspended' ? 'Restore' : 'Suspend'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}