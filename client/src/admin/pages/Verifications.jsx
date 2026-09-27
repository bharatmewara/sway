import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

function resolveSelfieUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('/uploads')) return url;
  return `/uploads/verification/${url}`;
}

export default function Verifications() {
  const navigate = useNavigate();
  const [reqs, setReqs] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/verifications', {
        params: { status: statusFilter, gender: genderFilter, search },
      });
      setReqs(res.data.requests || []);
      setSummary(res.data.summary || {});
    } catch (e) {
      console.error(e);
      toast.error('Failed to load verification requests');
      setReqs([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, genderFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id, action, verifiedGender = null) => {
    const reason = action === 'reject' ? window.prompt('Enter rejection reason:', 'Live selfie verification rejected by admin') : 'Approved by admin';
    if (action === 'reject' && reason === null) return;
    try {
      await api.put(`/admin/verifications/${id}/${action}`, {
        reason,
        verified_gender: verifiedGender,
      });
      toast.success(`Verification ${action}d`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update verification');
    }
  };

  return (
    <div>
      <div className="page-header flex-wrap gap-2">
        <div>
          <h4>Live Selfie & Gender Verification Queue</h4>
          <div className="breadcrumb-text">
            Inspect live camera captures, Selected vs AI Detected Gender, and manual verification overrides.
          </div>
        </div>
        <button className="btn-admin-primary" onClick={load}>
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value">{summary.total || 0}</div>
            <div className="stat-label">Total Attempts</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value text-warning">{summary.pending || 0}</div>
            <div className="stat-label">Pending Review</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value text-success">{summary.approved || 0}</div>
            <div className="stat-label">Approved & Matched</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value text-danger">{summary.mismatch || 0}</div>
            <div className="stat-label">Gender Mismatches</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="table-card p-3 mb-4 d-flex flex-wrap gap-2 align-items-center">
        <input
          className="search-input"
          placeholder="Search username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 220px' }}
        />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="mismatch">Gender Mismatch Only</option>
        </select>
        <select className="filter-select" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="">All Selected Genders</option>
          <option value="female">Selected Female</option>
          <option value="male">Selected Male</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner-border text-danger" />
          <span>Loading verification requests...</span>
        </div>
      ) : reqs.length === 0 ? (
        <div className="table-card empty-state">
          <i className="bi bi-shield-check" />
          <p>No verification requests found for the selected filter.</p>
        </div>
      ) : (
        <div className="row g-4">
          {reqs.map((r) => (
            <div className="col-lg-6" key={r.id}>
              <div className="table-card p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6
                      className="mb-0 fw-bold"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/users/${r.user_id}`)}
                    >
                      #{r.user_id} {r.username} <small className="text-muted">({r.email})</small>
                    </h6>
                    <small className="text-muted">
                      Submitted: {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'} • Source: {r.capture_source || 'live_camera'}
                    </small>
                  </div>
                  <span
                    className={`badge bg-${
                      r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning text-dark'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="row g-3 align-items-center">
                  <div className="col-sm-5">
                    {r.selfie_url ? (
                      <img
                        src={resolveSelfieUrl(r.selfie_url)}
                        className="w-100 rounded-3 border"
                        alt="Live Selfie"
                        style={{ height: 180, objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="bg-light rounded-3 d-flex align-items-center justify-content-center" style={{ height: 180 }}>
                        <span className="text-muted small">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="col-sm-7">
                    <div className="p-3 bg-light rounded-3 mb-2" style={{ fontSize: 13 }}>
                      <div className="mb-1">
                        <strong>Selected Gender:</strong>{' '}
                        <span className="badge bg-primary text-uppercase">{r.selected_gender || r.gender || '—'}</span>
                      </div>
                      <div className="mb-1">
                        <strong>AI Detected Gender:</strong>{' '}
                        <span className="badge bg-info text-dark text-uppercase">{r.ai_detected_gender || '—'}</span>
                      </div>
                      <div className="mb-1">
                        <strong>Match Status:</strong>{' '}
                        <span className={`badge bg-${r.gender_match_status === 'MATCH' ? 'success' : 'danger'}`}>
                          {r.gender_match_status || '—'}
                        </span>
                      </div>
                      <div className="mb-1">
                        <strong>AI Confidence:</strong>{' '}
                        {r.ai_confidence ? `${(Number(r.ai_confidence) * 100).toFixed(1)}%` : '—'}
                      </div>
                      {r.failure_reason && (
                        <div className="text-danger small mt-1">
                          <i className="bi bi-exclamation-circle me-1" />
                          {r.failure_reason}
                        </div>
                      )}
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        className="btn btn-sm btn-success flex-grow-1"
                        onClick={() => updateStatus(r.id, 'approve', r.selected_gender || r.gender)}
                      >
                        <i className="bi bi-check-lg me-1" /> Approve ({r.selected_gender || r.gender})
                      </button>
                      <button
                        className="btn btn-sm btn-danger flex-grow-1"
                        onClick={() => updateStatus(r.id, 'reject')}
                      >
                        <i className="bi bi-x-lg me-1" /> Reject / Resubmit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}