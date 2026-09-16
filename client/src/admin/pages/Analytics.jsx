import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-center py-5"><div className="spinner-border text-danger"></div></div>;

  return (
    <div>
      <div className="page-header"><h4>Platform Analytics</h4></div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Users', value: data.totalUsers, icon: '👥', color: '#3b82f6' },
          { label: 'Online Now', value: data.onlineUsers, icon: '🟢', color: '#22c55e' },
          { label: 'Verified', value: data.totalVerified, icon: '✅', color: '#8b5cf6' },
          { label: 'Revenue (₹)', value: `₹${(data.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#f59e0b' },
        ].map(kpi => (
          <div key={kpi.label} className="col-6 col-md-3">
            <div className="card shadow-sm border-0 rounded-4 p-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span style={{ fontSize: 20 }}>{kpi.icon}</span>
                <small className="text-muted">{kpi.label}</small>
              </div>
              <h3 className="fw-bold mb-0" style={{ color: kpi.color }}>{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* City-wise */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <h5 className="fw-bold mb-3">Top Cities</h5>
            {(data.cityWiseUsers || []).map((c, i) => (
              <div key={i} className="d-flex align-items-center gap-3 mb-3">
                <span className="text-muted" style={{ minWidth: 20, fontSize: 13 }}>#{i + 1}</span>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.city || 'Unknown'}</span>
                    <span style={{ fontSize: 12, color: '#76000b' }}>{c.count} users</span>
                  </div>
                  <div className="progress" style={{ height: 5, borderRadius: 3 }}>
                    <div className="progress-bar" style={{ width: `${Math.min(c.count * 3, 100)}%`, background: '#76000b' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <h5 className="fw-bold mb-3">Verification Stats</h5>
            {data.verificationStats && Object.entries(data.verificationStats).map(([status, count]) => (
              <div key={status} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span className="text-capitalize" style={{ fontSize: 13 }}>{status.replace('_', ' ')}</span>
                <span className={`badge rounded-pill ${status === 'verified' ? 'bg-success' : status === 'under_review' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
