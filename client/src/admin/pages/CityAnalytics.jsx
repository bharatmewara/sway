import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function CityAnalytics() {
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/analytics')
      .then((res) => {
        setCities(res.data.cityWiseUsers || []);
        setStates(res.data.stateWiseUsers || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-danger" />
        <span>Loading regional analytics...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h4>City & Regional Analytics</h4>
          <div className="breadcrumb-text">
            Geographic distribution of Female, Male, and Online users across cities and states.
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {cities.map((c, i) => (
          <div className="col-md-4" key={i}>
            <div className="table-card p-3 h-100 mb-0">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h6 className="fw-bold mb-0">{c.city || 'Unknown'}</h6>
                <span className="badge bg-success">{c.online_count || 0} online</span>
              </div>
              <small className="text-muted d-block mb-2">{c.state || '—'}</small>
              <h3 className="fw-bold mb-2" style={{ color: '#76000b' }}>{c.count} Users</h3>
              <div className="d-flex justify-content-between small text-muted">
                <span>♀ Female: {c.female_count || 0}</span>
                <span>♂ Male: {c.male_count || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}