import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Reports() {
  const [reports, setReports] = useState([]);
  useEffect(() => {
    api.get('/admin/reports').then(res => setReports(res.data.reports || [])).catch(e=>{});
  }, []);

  const resolve = async (id) => {
    await api.put(`/admin/reports/${id}/resolve`);
    setReports(reports.map(r => r.id === id ? {...r, status: 'resolved'} : r));
  };

  return (
    <div>
      <div className="page-header"><h4>User Reports</h4></div>
      <div className="table-card table-responsive">
        <table className="table mb-0 text-nowrap">
          <thead>
            <tr>
              <th>Reporter</th>
              <th>Reported User</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td>{r.reporter_name}</td>
                <td>{r.reported_name}</td>
                <td>{r.reason}</td>
                <td><span className="badge bg-secondary">{r.status}</span></td>
                <td>
                  {r.status !== 'resolved' && <button className="btn btn-sm btn-outline-success" onClick={()=>resolve(r.id)}>Resolve</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}