import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';



function CreditsModal({ user, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Enter a valid credit amount');
      return;
    }
    setLoading(true);
    await onSubmit(Number(amount));
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h5 className="modal-title-custom">
            <i className="bi bi-plus-circle me-2" style={{ color: '#6a1b9a' }} />
            Add Credits
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
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div className="avatar-sm">{(user?.username || '?')[0].toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.username}</div>
            <div style={{ fontSize: 12, color: '#888' }}>Current: {user?.credits || 0} credits</div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label-admin">Credits to Add</label>
            <input
              type="number"
              className="form-input-admin"
              placeholder="Enter amount (e.g. 50)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="10000"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-admin-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-admin-primary" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : null}
              Add Credits
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BanModal({ user, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a ban reason');
      return;
    }
    setLoading(true);
    await onSubmit(reason);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h5 className="modal-title-custom">
            <i className="bi bi-slash-circle me-2" style={{ color: '#c62828' }} />
            Ban User
          </h5>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div
          style={{
            background: '#fce4ec',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 600, color: '#c62828', fontSize: 13 }}>
            <i className="bi bi-exclamation-triangle me-2" />
            You are about to ban <strong>{user?.username}</strong>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            This will prevent the user from accessing the app.
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label-admin">Reason for Ban</label>
            <textarea
              className="form-input-admin"
              placeholder="Describe why this user is being banned..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ resize: 'vertical' }}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-admin-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#c62828',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-slash-circle" />}
              Confirm Ban
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
  const [city, setCity] = useState('');
  const [showBanned, setShowBanned] = useState(false);
  const [creditModal, setCreditModal] = useState(null);
  const [banModal, setBanModal] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, search, gender, verification_status: verStatus, city };
      if (showBanned) params.is_banned = true;
      const res = await api.get('/admin/users', { params });
      setUsers(Array.isArray(res.data.users) ? res.data.users : (Array.isArray(res.data) ? res.data : []));
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, gender, verStatus, city, showBanned]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddCredits = async (amount) => {
    try {
      await api.put(`/admin/users/${creditModal.id}/add-credits`, { credits: amount });
      toast.success(`Added ${amount} credits to ${creditModal.username}`);
      setCreditModal(null);
      fetchUsers();
    } catch {
      toast.error('Action failed');
    }
  };

  const handleBan = async (reason) => {
    try {
      await api.put(`/admin/users/${banModal.id}/ban`, { reason });
      toast.success(`User ${banModal.username} has been banned`);
      setBanModal(null);
      fetchUsers();
    } catch {
      toast.error('Action failed');
    }
  };

  const handleUnban = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}/unban`);
      toast.success(`${user.username} has been unbanned`);
      fetchUsers();
    } catch {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.username}? This action is irreversible.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success(`User deleted`);
      fetchUsers();
    } catch {
      toast.error('Action failed');
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status) => {
    const map = {
      verified: 'badge-verified',
      pending: 'badge-pending',
      rejected: 'badge-rejected',
      not_submitted: 'badge-inactive',
    };
    return map[status] || 'badge-inactive';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h4>User Management</h4>
          <div className="breadcrumb-text">{total.toLocaleString('en-IN')} total users</div>
        </div>
        <button className="btn-admin-primary" onClick={() => fetchUsers()}>
          <i className="bi bi-arrow-clockwise" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="table-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '16px' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <i
              className="bi bi-search"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}
            />
            <input
              className="search-input"
              style={{ width: '100%', paddingLeft: 36 }}
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="filter-select" value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }}>
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select className="filter-select" value={verStatus} onChange={(e) => { setVerStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="not_submitted">Not Submitted</option>
          </select>
          <input
            className="filter-select"
            placeholder="Filter by city..."
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            style={{ width: 160 }}
          />
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              color: showBanned ? '#c62828' : '#555',
              background: showBanned ? '#fce4ec' : '#f5f5f5',
              borderRadius: 10,
              padding: '9px 14px',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={showBanned}
              onChange={(e) => { setShowBanned(e.target.checked); setPage(1); }}
              style={{ accentColor: '#c62828' }}
            />
            Banned Only
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner-border" />
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
                    <th>User</th>
                    <th>Gender</th>
                    <th>City</th>
                    <th>Age</th>
                    <th>Credits</th>
                    <th>Verification</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar-sm">
                            {(user.username || user.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div
                              style={{ fontWeight: 600, color: '#1a1a2e', cursor: 'pointer' }}
                              onClick={() => navigate(`/admin/users/${user.id}`)}
                            >
                              {user.username || user.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#999' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status ${user.gender === 'female' ? 'badge-female' : 'badge-male'}`}>
                          {user.gender === 'female' ? '♀ F' : '♂ M'}
                        </span>
                      </td>
                      <td style={{ color: '#555' }}>{user.city || '—'}</td>
                      <td>{user.age || '—'}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: '#6a1b9a',
                            fontSize: 13,
                          }}
                        >
                          {user.credits ?? 0}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${getStatusBadge(user.verification_status)}`}>
                          {user.verification_status || 'not submitted'}
                        </span>
                      </td>
                      <td style={{ color: '#888', fontSize: 12 }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <span className={`badge-status ${user.is_banned ? 'badge-banned' : 'badge-active'}`}>
                          {user.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn-icon btn-icon-view"
                            title="View Profile"
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                          {user.is_banned ? (
                            <button
                              className="btn-icon btn-icon-unban"
                              title="Unban User"
                              onClick={() => handleUnban(user)}
                            >
                              <i className="bi bi-check-circle" />
                            </button>
                          ) : (
                            <button
                              className="btn-icon btn-icon-ban"
                              title="Ban User"
                              onClick={() => setBanModal(user)}
                            >
                              <i className="bi bi-slash-circle" />
                            </button>
                          )}
                          <button
                            className="btn-icon btn-icon-credit"
                            title="Add Credits"
                            onClick={() => setCreditModal(user)}
                          >
                            <i className="bi bi-plus-circle" />
                          </button>
                          <button
                            className="btn-icon btn-icon-delete"
                            title="Delete User"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
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
                {totalPages > 7 && <span style={{ color: '#999' }}>...</span>}
                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {creditModal && (
        <CreditsModal user={creditModal} onClose={() => setCreditModal(null)} onSubmit={handleAddCredits} />
      )}
      {banModal && (
        <BanModal user={banModal} onClose={() => setBanModal(null)} onSubmit={handleBan} />
      )}
    </div>
  );
}
