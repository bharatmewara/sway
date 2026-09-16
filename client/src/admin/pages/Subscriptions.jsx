import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api.get('/admin/subscriptions').then(r => setSubs(r.data?.subscriptions || [])).catch(() => {});
    api.get('/premium/plans').then(r => setPlans(r.data.plans)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header"><h4>Subscriptions</h4></div>

      <div className="row g-3 mb-4">
        {plans.map(p => (
          <div key={p.id} className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 p-3">
              <h5 className="fw-bold mb-1">{p.name}</h5>
              <p className="text-muted mb-1 text-capitalize">{p.billing_period}</p>
              <h3 className="text-danger fw-bold mb-0">₹{p.price_inr}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead className="table-light">
              <tr><th>User</th><th>Plan</th><th>Status</th><th>Started</th><th>Expires</th></tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id}>
                  <td>{s.username}</td>
                  <td>{s.plan_name}</td>
                  <td><span className={`badge bg-${s.status === 'active' ? 'success' : 'secondary'}`}>{s.status}</span></td>
                  <td>{new Date(s.started_at).toLocaleDateString()}</td>
                  <td>{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-4">No subscriptions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
