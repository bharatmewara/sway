import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

function ConnectsModal({ user, onClose, onSubmit }) {
  const [operation, setOperation] = useState('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount === '' || isNaN(amount) || Number(amount) < 0) {
      toast.error('Enter a valid Connect amount');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please enter a reason for this Connect adjustment');
      return;
    }
    setLoading(true);
    await onSubmit({ operation, amount: Number(amount), reason });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h5 className="modal-title-custom">
            <i className="bi bi-coin me-2" style={{ color: '#6a1b9a' }} />
            Adjust User Connects
          </h5>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div
          style={{
            background: '#f3e5f5',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div className="avatar-sm">{(user?.username || '?')[0].toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.username} ({user?.email})</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              Current Balance: <strong>{user?.connect_credits ?? user?.credits ?? 0} Connects</strong>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-admin">Operation</label>
            <select
              className="form-input-admin"
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
            >
              <option value="add">Add Connects (+)</option>
              <option value="deduct">Deduct Connects (-)</option>
              <option value="set">Set Exact Balance (=)</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label-admin">Connect Amount</label>
            <input
              type="number"
              className="form-input-admin"
              placeholder="e.g. 50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              max="100000"
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label-admin">Admin Reason (Logged in Audit Trail)</label>
            <input
              type="text"
              className="form-input-admin"
              placeholder="e.g. Promotional bonus / Dispute resolution"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-admin-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-admin-primary" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check2-circle" />}
              Update Connects
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusModal({ user, onClose, onSubmit }) {
  const [accountStatus, setAccountStatus] = useState(user?.account_status || (user?.is_banned ? 'BANNED' : 'ACTIVE'));
  const [reason, setReason] = useState(user?.ban_reason || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide an admin reason for the status change');
      return;
    }
    setLoading(true);
    await onSubmit({ account_status: accountStatus, reason });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h5 className="modal-title-custom">
            <i className="bi bi-shield-lock me-2" style={{ color: '#c62828' }} />
            Change Account Status: {user?.username}
          </h5>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-admin">Account Status</label>
            <select
              className="form-input-admin"
              value={accountStatus}
              onChange={(e) => setAccountStatus(e.target.value)}
            >
              <option value="ACTIVE">ACTIVE (Full Access)</option>
              <option value="PENDING_REVIEW">PENDING_REVIEW (Under Admin Review)</option>
              <option value="SUSPENDED">SUSPENDED (Temporary Restriction)</option>
              <option value="BLOCKED">BLOCKED (Platform Blocked)</option>
              <option value="BANNED">BANNED (Permanent Ban)</option>
              <option value="DEACTIVATED">DEACTIVATED (Disabled Account)</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label-admin">Reason / Moderation Notes</label>
            <textarea
              className="form-input-admin"
              placeholder="Enter reason for this account status change..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-admin-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-admin-primary" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : null}
              Save Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VerifyModal({ user, onClose, onSubmit }) {
  const [action, setAction] = useState('approve');
  const [verifiedGender, setVerifiedGender] = useState(user?.verified_gender || user?.selected_gender || user?.gender || 'female');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ action, verified_gender: verifiedGender, reason });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h5 className="modal-title-custom">
            <i className="bi bi-patch-check me-2" style={{ color: '#2e7d32' }} />
            Verification & Gender Control: {user?.username}
          </h5>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="p-3 mb-3 rounded-3 bg-light" style={{ fontSize: 13 }}>
          <div><strong>Selected Gender:</strong> {user?.selected_gender || user?.gender || '—'}</div>
          <div><strong>AI Detected Gender:</strong> {user?.ai_detected_gender || '—'}</div>
          <div><strong>Gender Match Status:</strong> {user?.gender_match_status || '—'}</div>
          <div><strong>Current Verification:</strong> {user?.verification_status || '—'}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-admin">Verification Action</label>
            <select className="form-input-admin" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="approve">Approve & Verify User</option>
              <option value="reject">Reject Verification</option>
              <option value="resubmit">Require Live Selfie Resubmission</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label-admin">Authoritative Verified Gender</label>
            <select
              className="form-input-admin"
              value={verifiedGender}
              onChange={(e) => setVerifiedGender(e.target.value)}
            >
              <option value="female">Female (0 Connects required for Chat/PM)</option>
              <option value="male">Male (Connects required for Chat/PM)</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label-admin">Admin Notes / Reason</label>
            <input
              type="text"
              className="form-input-admin"
              placeholder="Optional verification review notes..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-admin-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-admin-primary" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : null}
              Apply Verification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 15;

  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [verStatus, setVerStatus] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [city, setCity] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const [connectModal, setConnectModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [verifyModal, setVerifyModal] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
        gender,
        verification_status: verStatus,
        profile_status: profileStatus,
        account_status: accountStatus,
        city,
      };
      if (onlineOnly) params.online = 'true';
      const res = await api.get('/admin/users', { params });
      setUsers(Array.isArray(res.data.users) ? res.data.users : []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('[Users] Failed to fetch users:', err);
      toast.error(err.response?.data?.message || 'Failed to load users');
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, gender, verStatus, profileStatus, accountStatus, city, onlineOnly]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAdjustConnects = async (payload) => {
    try {
      await api.post(`/admin/users/${connectModal.id}/connects`, payload);
      toast.success(`Updated Connects for ${connectModal.username}`);
      setConnectModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update Connects');
    }
  };

  const handleStatusChange = async (payload) => {
    try {
      await api.put(`/admin/users/${statusModal.id}/status`, payload);
      toast.success(`Updated status for ${statusModal.username} to ${payload.account_status}`);
      setStatusModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleVerifyUser = async (payload) => {
    try {
      await api.put(`/admin/users/${verifyModal.id}/verify`, payload);
      toast.success(`Verification updated for ${verifyModal.username}`);
      setVerifyModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update verification');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Deactivate and remove user ${user.username}?`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success(`User ${user.username} deactivated`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'verified') return 'badge-verified';
    if (s.includes('pending') || s.includes('progress')) return 'badge-pending';
    if (s.includes('reject') || s.includes('resubmission') || s.includes('fail')) return 'badge-rejected';
    return 'badge-inactive';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h4>User Management</h4>
          <div className="breadcrumb-text">{total.toLocaleString('en-IN')} registered users in database</div>
        </div>
        <button className="btn-admin-primary" onClick={fetchUsers}>
          <i className="bi bi-arrow-clockwise" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="table-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '16px' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <i
              className="bi bi-search"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}
            />
            <input
              className="search-input"
              style={{ width: '100%', paddingLeft: 36 }}
              placeholder="Search ID, username, email, phone, city..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="filter-select" value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }}>
            <option value="">All Genders</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <select className="filter-select" value={verStatus} onChange={(e) => { setVerStatus(e.target.value); setPage(1); }}>
            <option value="">All Verifications</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected / Resubmit</option>
          </select>
          <select className="filter-select" value={profileStatus} onChange={(e) => { setProfileStatus(e.target.value); setPage(1); }}>
            <option value="">All Profiles</option>
            <option value="COMPLETED">Completed Profile</option>
            <option value="INCOMPLETE">Incomplete Profile</option>
          </select>
          <select className="filter-select" value={accountStatus} onChange={(e) => { setAccountStatus(e.target.value); setPage(1); }}>
            <option value="">All Account Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="BANNED">BANNED</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
          </select>
          <input
            className="filter-select"
            placeholder="Filter by city..."
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            style={{ width: 140 }}
          />
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              color: onlineOnly ? '#2e7d32' : '#555',
              background: onlineOnly ? '#e8f5e9' : '#f5f5f5',
              borderRadius: 8,
              padding: '8px 12px',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => { setOnlineOnly(e.target.checked); setPage(1); }}
            />
            Online Now
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner-border text-danger" />
            <span style={{ color: '#888' }}>Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-people" />
            <p>No users found matching your filters</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>ID / User</th>
                    <th>Selected / AI / Verified</th>
                    <th>Location & Age</th>
                    <th>Verification</th>
                    <th>Profile</th>
                    <th>Connects</th>
                    <th>Reports</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar-sm" style={{ position: 'relative' }}>
                            {(user.username || '?')[0].toUpperCase()}
                            {user.is_online && (
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  right: 0,
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: '#4caf50',
                                  border: '2px solid #fff',
                                }}
                              />
                            )}
                          </div>
                          <div>
                            <div
                              style={{ fontWeight: 600, color: '#1a1a2e', cursor: 'pointer' }}
                              onClick={() => navigate(`/admin/users/${user.id}`)}
                            >
                              #{user.id} {user.username}
                            </div>
                            <div style={{ fontSize: 11, color: '#888' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status ${user.gender === 'female' ? 'badge-female' : 'badge-male'}`}>
                          {user.selected_gender || user.gender || '—'} / {user.ai_detected_gender || '—'} / {user.verified_gender || '—'}
                        </span>
                        {user.gender_match_status === 'MISMATCH' && (
                          <div className="text-danger fw-bold mt-1" style={{ fontSize: 11 }}>
                            ⚠ Gender Mismatch
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        <div>{user.city || '—'}{user.state ? `, ${user.state}` : ''}</div>
                        <small className="text-muted">Age: {user.age || '—'}</small>
                      </td>
                      <td>
                        <span className={`badge-status ${getStatusBadge(user.verification_status)}`}>
                          {user.verification_status || 'not_submitted'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${user.profile_completed ? 'badge-verified' : 'badge-pending'}`}>
                          {user.profile_completed ? 'COMPLETED' : 'INCOMPLETE'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#6a1b9a', fontSize: 14 }}>
                          {user.connect_credits ?? 0}
                        </span>
                        <div style={{ fontSize: 10, color: '#888' }}>
                          {user.connect_required_for_chat === false ? 'Free (Female)' : 'Paid (Male)'}
                        </div>
                      </td>
                      <td>
                        {user.reports_against_count > 0 ? (
                          <span className="badge bg-danger">{user.reports_against_count} report(s)</span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge-status ${user.is_banned || user.account_status !== 'ACTIVE' ? 'badge-banned' : 'badge-active'}`}>
                          {user.account_status || (user.is_banned ? 'BANNED' : 'ACTIVE')}
                        </span>
                      </td>
                      <td style={{ color: '#888', fontSize: 12 }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn-icon btn-icon-view"
                            title="View 12-Tab Full Profile"
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                          <button
                            className="btn-icon btn-icon-unban"
                            title="Verify / Override Gender"
                            onClick={() => setVerifyModal(user)}
                          >
                            <i className="bi bi-shield-check" />
                          </button>
                          <button
                            className="btn-icon btn-icon-credit"
                            title="Adjust Connects"
                            onClick={() => setConnectModal(user)}
                          >
                            <i className="bi bi-coin" />
                          </button>
                          <button
                            className="btn-icon btn-icon-ban"
                            title="Change Account Status (Suspend/Ban/Activate)"
                            onClick={() => setStatusModal(user)}
                          >
                            <i className="bi bi-person-gear" />
                          </button>
                          <button
                            className="btn-icon btn-icon-delete"
                            title="Deactivate / Delete User"
                            onClick={() => handleDelete(user)}
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <small className="text-muted">
                  Page {page} of {totalPages} ({total} users)
                </small>
                <div className="d-flex gap-1">
                  <button
                    className="page-btn"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <i className="bi bi-chevron-left" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        className={`page-btn ${p === page ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    className="page-btn"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {connectModal && (
        <ConnectsModal
          user={connectModal}
          onClose={() => setConnectModal(null)}
          onSubmit={handleAdjustConnects}
        />
      )}
      {statusModal && (
        <StatusModal
          user={statusModal}
          onClose={() => setStatusModal(null)}
          onSubmit={handleStatusChange}
        />
      )}
      {verifyModal && (
        <VerifyModal
          user={verifyModal}
          onClose={() => setVerifyModal(null)}
          onSubmit={handleVerifyUser}
        />
      )}
    </div>
  );
}
