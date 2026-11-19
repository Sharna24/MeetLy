import { useEffect, useState } from 'react';
import { api, errorMessage }from '../../services/api';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);

  const load = async () => {
    const res = await api.get('/admin/dashboard');
    setReports(res.data.reports);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id: string) => {
    await api.patch(`/admin/reports/${id}/resolve`);
    load();
  };

  return (
    <div className="panel">
      <h1>User Reports ({reports.length})</h1>
      <p className="muted">Review submitted reports and mark them resolved.</p>

      {reports.length === 0 ? (
        <div className="soon-box">
          <strong>No reports</strong>
          <p className="muted small">There are no user reports in the queue.</p>
        </div>
      ) : (
        <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr>
              <th>Reporter</th>
              <th>Target</th>
              <th>Category</th>
              <th>Note</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td>{r.reporter?.email}</td>
                <td>{r.target?.email}</td>
                <td>{r.category}</td>
                <td>{r.note || '-'}</td>
                <td>{r.status}</td>
                <td>
                  {r.status === 'open' && (
                    <button type="button" style={{ marginTop: 0 }} onClick={() => resolve(r.id)}>
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}