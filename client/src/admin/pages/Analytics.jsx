import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function Analytics() {
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/analytics'),
    ])
      .then(([dRes, aRes]) => {
        setDash(dRes.data);
        setAnalytics(aRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-danger" />
        <span>Loading engagement analytics...</span>
      </div>
    );
  }

  const d = dash || {};
  const a = analytics || {};
  const funnel = a.onboardingFunnel || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h4>Engagement & Funnel Analytics</h4>
          <div className="breadcrumb-text">
            Likes, Crushes, Profile Visits, Onboarding Funnel & Verification Breakdown.
          </div>
        </div>
      </div>

      {/* Onboarding & Verification Funnel */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value text-primary">{funnel.registered ?? d.totalUsers ?? 0}</div>
            <div className="stat-label">1. Registered Users</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value text-info">{funnel.gender_matched ?? 0}</div>
            <div className="stat-label">2. AI Gender Matched</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value text-success">{funnel.selfie_verified ?? d.totalVerified ?? 0}</div>
            <div className="stat-label">3. Live Selfie Verified</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#76000b' }}>{funnel.profile_completed ?? d.completedProfiles ?? 0}</div>
            <div className="stat-label">4. Profile Completed</div>
          </div>
        </div>
      </div>

      {/* Top Liked, Crushed, and Visited Users */}
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="table-card p-4 h-100">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-heart-fill text-danger me-2" />
              Most Liked Profiles
            </h6>
            {(a.topLikedUsers || []).map((u, i) => (
              <div
                key={u.id}
                className="d-flex justify-content-between align-items-center py-2 border-bottom"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/admin/users/${u.id}`)}
              >
                <span>#{i + 1} <strong>{u.username}</strong> ({u.gender})</span>
                <span className="badge bg-danger">{u.likes_received} likes</span>
              </div>
            ))}
            {(a.topLikedUsers || []).length === 0 && <div className="text-muted small">No likes recorded yet.</div>}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="table-card p-4 h-100">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-stars text-warning me-2" />
              Most Crushed Profiles
            </h6>
            {(a.topCrushedUsers || []).map((u, i) => (
              <div
                key={u.id}
                className="d-flex justify-content-between align-items-center py-2 border-bottom"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/admin/users/${u.id}`)}
              >
                <span>#{i + 1} <strong>{u.username}</strong> ({u.gender})</span>
                <span className="badge bg-warning text-dark">
                  {u.crushes_received} ({u.mutual_crushes} mutual)
                </span>
              </div>
            ))}
            {(a.topCrushedUsers || []).length === 0 && <div className="text-muted small">No crushes recorded yet.</div>}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="table-card p-4 h-100">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-eye-fill text-primary me-2" />
              Most Visited Profiles
            </h6>
            {(a.topVisitedProfiles || []).map((u, i) => (
              <div
                key={u.id}
                className="d-flex justify-content-between align-items-center py-2 border-bottom"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/admin/users/${u.id}`)}
              >
                <span>#{i + 1} <strong>{u.username}</strong> ({u.gender})</span>
                <span className="badge bg-primary">{u.profile_visits} visits</span>
              </div>
            ))}
            {(a.topVisitedProfiles || []).length === 0 && <div className="text-muted small">No profile visits recorded yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
