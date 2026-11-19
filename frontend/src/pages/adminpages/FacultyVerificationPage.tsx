import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../services/api';

export default function FacultyVerificationPage() {
  const [faculty, setFaculty] = useState<any[]>([]);

  const load = async () => {
    const res = await api.get('/admin/dashboard');
    setFaculty(res.data.pendingFaculty);
  };

  useEffect(() => { load(); }, []);

  const verify = async (id: string) => {
    await api.patch(`/admin/faculty/${id}/verify`);
    load();
  };

  return (
    <div className="panel">
      <h1>Faculty Verification ({faculty.length})</h1>
      <p className="muted">Approve pending faculty accounts so they can access Meetly.</p>

      {faculty.length === 0 ? (
        <div className="soon-box">
          <strong>All caught up</strong>
          <p className="muted small">No unverified faculty accounts right now.</p>
        </div>
      ) : (
        <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map((f) => (
              <tr key={f.id}>
                <td>{f.name || '-'}</td>
                <td>{f.email}</td>
                <td>{f.department || '-'}</td>
                <td>
                  <button type="button" style={{ marginTop: 0 }} onClick={() => verify(f.id)}>
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}