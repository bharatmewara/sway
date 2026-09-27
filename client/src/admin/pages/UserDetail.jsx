import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const TABS = [
  { id: 'overview', label: '1. Overview', icon: 'bi-person-badge' },
  { id: 'profile', label: '2. Profile', icon: 'bi-sliders' },
  { id: 'verification', label: '3. Verification', icon: 'bi-shield-check' },
  { id: 'activity', label: '4. Activity', icon: 'bi-heart-pulse' },
  { id: 'connects', label: '5. Connects', icon: 'bi-coin' },
  { id: 'transactions', label: '6. Transactions', icon: 'bi-receipt' },
  { id: 'chats', label: '7. Chats', icon: 'bi-chat-dots' },
  { id: 'private_messages', label: '8. Private Messages', icon: 'bi-envelope-paper-heart' },
  { id: 'reports', label: '9. Reports', icon: 'bi-flag' },
  { id: 'blocks', label: '10. Blocks', icon: 'bi-slash-circle' },
  { id: 'privacy', label: '11. Privacy', icon: 'bi-lock' },
  { id: 'audit', label: '12. Audit History', icon: 'bi-journal-text' },
];

function resolvePhotoUrl(photo) {
  if (!photo) return '/img/profile.jpg';
  if (photo.startsWith('data:') || photo.startsWith('http') || photo.startsWith('/uploads')) return photo;
  return `/uploads/profiles/${photo}`;
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [editForm, setEditForm] = useState({});
  const [connectForm, setConnectForm] = useState({ operation: 'add', amount: '', reason: '' });
  const [statusForm, setStatusForm] = useState({ account_status: 'ACTIVE', reason: '' });
  const [verifyForm, setVerifyForm] = useState({ action: 'approve', verified_gender: 'female', reason: '' });

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${id}`);
      setDetail(res.data);
      const u = res.data.user || {};
      setEditForm({
        username: u.username || '',
        nickname: u.nickname || '',
        email: u.email || '',
        phone: u.phone || '',
        city: u.city || '',
        state: u.state || '',
        country: u.country || '',
        age: u.age || '',
        bio: u.bio || '',
        instagram: u.instagram || '',
        facebook: u.facebook || '',
        telegram: u.telegram || '',
        profile_status: u.profile_status || 'COMPLETED',
        profile_moderation_status: u.profile_moderation_status || 'APPROVED',
        admin_notes: u.admin_notes || '',
      });
      setStatusForm({
        account_status: u.account_status || 'ACTIVE',
        reason: u.ban_reason || '',
      });
      setVerifyForm({
        action: 'approve',
        verified_gender: u.verified_gender || u.selected_gender || u.gender || 'female',
        reason: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${id}`, editForm);
      toast.success('User profile updated');
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleAdjustConnects = async (e) => {
    e.preventDefault();
    if (!connectForm.amount || !connectForm.reason) {
      toast.error('Amount and reason are required');
      return;
    }
    try {
      await api.post(`/admin/users/${id}/connects`, {
        operation: connectForm.operation,
        amount: Number(connectForm.amount),
        reason: connectForm.reason,
      });
      toast.success('Connect balance updated');
      setConnectForm({ operation: 'add', amount: '', reason: '' });
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Connect adjustment failed');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${id}/status`, statusForm);
      toast.success(`Status updated to ${statusForm.account_status}`);
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleVerifyUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${id}/verify`, verifyForm);
      toast.success(`Verification ${verifyForm.action}d`);
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification update failed');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-danger" />
        <span>Loading complete 12-tab user profile...</span>
      </div>
    );
  }

  if (!detail || !detail.user) {
    return <div className="p-4 text-center">User not found.</div>;
  }

  const {
    user,
    verificationHistory = [],
    privacy = {},
    activity = {},
    connects = {},
    transactions = [],
    chats = [],
    privateMessages = [],
    reports = {},
    blocks = {},
    auditHistory = [],
  } = detail;

  return (
    <div>
      {/* Header */}
      <div className="page-header flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <button className="btn-admin-outline" onClick={() => navigate('/admin/users')}>
            <i className="bi bi-arrow-left" /> Back
          </button>
          <div>
            <h4>
              #{user.id} {user.username}{' '}
              {user.nickname ? <small className="text-muted">({user.nickname})</small> : null}
            </h4>
            <div className="breadcrumb-text">
              {user.email} • Joined {new Date(user.created_at).toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <span className={`badge-status ${user.gender === 'female' ? 'badge-female' : 'badge-male'}`}>
            {user.verified_gender || user.gender || 'Unknown'}
          </span>
          <span className={`badge-status ${user.verification_status === 'verified' ? 'badge-verified' : 'badge-pending'}`}>
            {user.verification_status}
          </span>
          <span className={`badge-status ${user.account_status === 'ACTIVE' ? 'badge-active' : 'badge-banned'}`}>
            {user.account_status}
          </span>
        </div>
      </div>

      {/* 12 Tabs Bar */}
      <div className="table-card mb-4 p-2">
        <div className="d-flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={activeTab === t.id ? 'btn-admin-primary' : 'btn-admin-outline'}
              style={{ padding: '7px 12px', fontSize: 12 }}
            >
              <i className={`bi ${t.icon}`} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="table-card p-4 text-center">
              <img
                src={resolvePhotoUrl(user.profile_photo)}
                alt={user.username}
                className="rounded-circle mb-3"
                style={{ width: 120, height: 120, objectFit: 'cover', border: '3px solid #76000b' }}
              />
              <h5 className="fw-bold mb-1">{user.username}</h5>
              <p className="text-muted small mb-2">{user.email}</p>
              <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
                <span className="badge bg-dark">Selected: {user.selected_gender || '—'}</span>
                <span className="badge bg-info text-dark">AI: {user.ai_detected_gender || '—'}</span>
                <span className="badge bg-success">Verified: {user.verified_gender || '—'}</span>
              </div>
              <div className="p-3 rounded-3 bg-light mb-3">
                <div className="text-muted small">Connect Balance</div>
                <h3 className="fw-bold mb-0" style={{ color: '#6a1b9a' }}>
                  {user.connect_credits ?? 0} Connects
                </h3>
                <small className="text-muted">
                  {user.connect_required_for_chat === false ? 'Female Free Access' : 'Male Connect-Required'}
                </small>
              </div>
              <form onSubmit={handleStatusUpdate} className="text-start">
                <label className="form-label-admin">Account Status Control</label>
                <select
                  className="form-input-admin mb-2"
                  value={statusForm.account_status}
                  onChange={(e) => setStatusForm({ ...statusForm, account_status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="BANNED">BANNED</option>
                  <option value="DEACTIVATED">DEACTIVATED</option>
                </select>
                <input
                  type="text"
                  className="form-input-admin mb-2"
                  placeholder="Reason for status change..."
                  value={statusForm.reason}
                  onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
                />
                <button type="submit" className="btn-admin-primary w-100 justify-content-center">
                  Update Account Status
                </button>
              </form>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="table-card p-4 mb-4">
              <h6 className="fw-bold mb-3">Account & Onboarding Summary</h6>
              <div className="row g-3">
                <div className="col-sm-4"><small className="text-muted">Phone</small><div className="fw-semibold">{user.phone || '—'}</div></div>
                <div className="col-sm-4"><small className="text-muted">Location</small><div className="fw-semibold">{user.city || '—'}, {user.state || '—'}, {user.country || '—'}</div></div>
                <div className="col-sm-4"><small className="text-muted">Age / DOB</small><div className="fw-semibold">{user.age || '—'} ({user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : '—'})</div></div>
                <div className="col-sm-4"><small className="text-muted">Gender Match Status</small><div className="fw-semibold">{user.gender_match_status || '—'}</div></div>
                <div className="col-sm-4"><small className="text-muted">Onboarding Status</small><div className="fw-semibold">{user.onboarding_status || '—'}</div></div>
                <div className="col-sm-4"><small className="text-muted">Profile Completed</small><div className="fw-semibold">{user.profile_completed ? 'Yes (COMPLETED)' : 'No (INCOMPLETE)'}</div></div>
                <div className="col-sm-4"><small className="text-muted">Instagram</small><div className="fw-semibold">{user.instagram || '—'}</div></div>
                <div className="col-sm-4"><small className="text-muted">Facebook</small><div className="fw-semibold">{user.facebook || '—'}</div></div>
                <div className="col-sm-4"><small className="text-muted">Telegram</small><div className="fw-semibold">{user.telegram || '—'}</div></div>
              </div>
              <hr />
              <small className="text-muted">Bio / Presentation</small>
              <p className="mb-0 mt-1">{user.bio || 'No bio entered.'}</p>
            </div>

            <div className="row g-3">
              <div className="col-sm-4">
                <div className="stat-card">
                  <div className="stat-value">{(activity.likesReceived || []).length}</div>
                  <div className="stat-label">Likes Received</div>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="stat-card">
                  <div className="stat-value">{chats.length + privateMessages.length}</div>
                  <div className="stat-label">Total Conversations</div>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="stat-card">
                  <div className="stat-value">{(reports.againstUser || []).length}</div>
                  <div className="stat-label">Reports Against User</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE EDIT */}
      {activeTab === 'profile' && (
        <div className="table-card p-4">
          <h6 className="fw-bold mb-3">Edit User Profile & Moderation</h6>
          <form onSubmit={handleSaveProfile}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label-admin">Username</label>
                <input className="form-input-admin" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label-admin">Nickname</label>
                <input className="form-input-admin" value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label-admin">Email</label>
                <input className="form-input-admin" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label-admin">Phone</label>
                <input className="form-input-admin" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label-admin">City</label>
                <input className="form-input-admin" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label-admin">State</label>
                <input className="form-input-admin" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label-admin">Country</label>
                <input className="form-input-admin" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label-admin">Instagram</label>
                <input className="form-input-admin" value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label-admin">Facebook</label>
                <input className="form-input-admin" value={editForm.facebook} onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label-admin">Telegram</label>
                <input className="form-input-admin" value={editForm.telegram} onChange={(e) => setEditForm({ ...editForm, telegram: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label-admin">Profile Status</label>
                <select className="form-input-admin" value={editForm.profile_status} onChange={(e) => setEditForm({ ...editForm, profile_status: e.target.value })}>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="INCOMPLETE">INCOMPLETE</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label-admin">Profile Moderation Status</label>
                <select className="form-input-admin" value={editForm.profile_moderation_status} onChange={(e) => setEditForm({ ...editForm, profile_moderation_status: e.target.value })}>
                  <option value="APPROVED">APPROVED</option>
                  <option value="FLAGGED">FLAGGED</option>
                  <option value="HIDDEN">HIDDEN</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label-admin">Bio / Presentation</label>
                <textarea className="form-input-admin" rows={3} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="form-label-admin">Internal Admin Notes</label>
                <textarea className="form-input-admin" rows={2} value={editForm.admin_notes} onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })} />
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className="btn-admin-primary">
                <i className="bi bi-check2" /> Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="row g-4">
          <div className="col-md-5">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Manual Verification & Gender Override</h6>
              <form onSubmit={handleVerifyUpdate}>
                <div className="mb-3">
                  <label className="form-label-admin">Action</label>
                  <select className="form-input-admin" value={verifyForm.action} onChange={(e) => setVerifyForm({ ...verifyForm, action: e.target.value })}>
                    <option value="approve">Approve Verification</option>
                    <option value="reject">Reject Verification</option>
                    <option value="resubmit">Require Live Selfie Resubmission</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label-admin">Verified Gender</label>
                  <select className="form-input-admin" value={verifyForm.verified_gender} onChange={(e) => setVerifyForm({ ...verifyForm, verified_gender: e.target.value })}>
                    <option value="female">Female (Connects NOT required)</option>
                    <option value="male">Male (Connects REQUIRED)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label-admin">Review Reason / Notes</label>
                  <input className="form-input-admin" value={verifyForm.reason} onChange={(e) => setVerifyForm({ ...verifyForm, reason: e.target.value })} placeholder="Reason for override..." />
                </div>
                <button type="submit" className="btn-admin-primary w-100 justify-content-center">
                  Apply Verification Decision
                </button>
              </form>
            </div>
          </div>
          <div className="col-md-7">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Live Selfie Verification Attempts ({verificationHistory.length})</h6>
              {verificationHistory.map((vr) => (
                <div key={vr.id} className="border rounded-3 p-3 mb-3 d-flex gap-3 align-items-start">
                  {vr.selfie_photo && (
                    <img
                      src={resolvePhotoUrl(vr.selfie_photo)}
                      alt="selfie"
                      style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10 }}
                    />
                  )}
                  <div className="flex-grow-1" style={{ fontSize: 13 }}>
                    <div className="d-flex justify-content-between">
                      <strong>Attempt #{vr.id} ({vr.capture_source || 'live_camera'})</strong>
                      <span className={`badge bg-${vr.status === 'approved' ? 'success' : vr.status === 'rejected' ? 'danger' : 'warning'}`}>
                        {vr.status}
                      </span>
                    </div>
                    <div className="mt-1">
                      Selected: <strong>{vr.selected_gender || '—'}</strong> • AI Detected: <strong>{vr.ai_gender_detected || '—'}</strong> • Match: <strong>{vr.gender_match_status || '—'}</strong>
                    </div>
                    <div>Confidence: {vr.ai_confidence_score ? `${(Number(vr.ai_confidence_score) * 100).toFixed(1)}%` : '—'}</div>
                    {vr.failure_reason && <div className="text-danger mt-1">Reason: {vr.failure_reason}</div>}
                    <small className="text-muted">{new Date(vr.submitted_at).toLocaleString()}</small>
                  </div>
                </div>
              ))}
              {verificationHistory.length === 0 && <div className="text-muted">No selfie verification attempts recorded.</div>}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Likes Received ({(activity.likesReceived || []).length})</h6>
              {(activity.likesReceived || []).map((l) => (
                <div key={l.id} className="d-flex justify-content-between py-2 border-bottom small">
                  <span>From <strong>{l.username}</strong> ({l.gender}, {l.city || '—'})</span>
                  <span className="text-muted">{new Date(l.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {(activity.likesReceived || []).length === 0 && <div className="text-muted small">No likes received yet.</div>}
            </div>
          </div>
          <div className="col-md-6">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Crushes Sent ({(activity.crushesSent || []).length}) & Received ({(activity.crushesReceived || []).length})</h6>
              {(activity.crushesReceived || []).map((c) => (
                <div key={c.id} className="d-flex justify-content-between py-2 border-bottom small">
                  <span>Crush from <strong>{c.username}</strong> {c.is_mutual ? <span className="badge bg-danger">Mutual</span> : null}</span>
                  <span className="text-muted">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {(activity.crushesReceived || []).length === 0 && <div className="text-muted small">No crushes received yet.</div>}
            </div>
          </div>
          <div className="col-md-12">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Recent Profile Visitors ({(activity.visitors || []).length})</h6>
              <div className="row">
                {(activity.visitors || []).map((v) => (
                  <div key={v.id} className="col-md-4 mb-2 small">
                    <div className="p-2 border rounded">
                      <strong>{v.username}</strong> ({v.gender}) • {new Date(v.visited_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              {(activity.visitors || []).length === 0 && <div className="text-muted small">No profile visitors yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONNECTS */}
      {activeTab === 'connects' && (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Manual Connect Adjustment</h6>
              <div className="p-3 bg-light rounded-3 mb-3">
                <small className="text-muted">Current Balance</small>
                <h3 className="fw-bold mb-0" style={{ color: '#6a1b9a' }}>{connects.currentBalance ?? 0} Connects</h3>
              </div>
              <form onSubmit={handleAdjustConnects}>
                <div className="mb-3">
                  <label className="form-label-admin">Operation</label>
                  <select className="form-input-admin" value={connectForm.operation} onChange={(e) => setConnectForm({ ...connectForm, operation: e.target.value })}>
                    <option value="add">Add Connects (+)</option>
                    <option value="deduct">Deduct Connects (-)</option>
                    <option value="set">Set Exact Balance (=)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label-admin">Amount</label>
                  <input type="number" className="form-input-admin" value={connectForm.amount} onChange={(e) => setConnectForm({ ...connectForm, amount: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label-admin">Reason</label>
                  <input type="text" className="form-input-admin" value={connectForm.reason} onChange={(e) => setConnectForm({ ...connectForm, reason: e.target.value })} required />
                </div>
                <button type="submit" className="btn-admin-primary w-100 justify-content-center">
                  Update Balance
                </button>
              </form>
            </div>
          </div>
          <div className="col-md-8">
            <div className="table-card">
              <div className="table-card-header">
                <h6 className="table-card-title">Connect Ledger History</h6>
              </div>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Delta</th>
                      <th>Prev → New</th>
                      <th>Description</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(connects.ledger || []).map((tx) => (
                      <tr key={tx.id}>
                        <td><span className="badge bg-secondary">{tx.transaction_type}</span></td>
                        <td className={tx.amount >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                        </td>
                        <td>{tx.previous_balance} → <strong>{tx.new_balance}</strong></td>
                        <td>{tx.description || '—'}</td>
                        <td>{new Date(tx.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(connects.ledger || []).length === 0 && (
                      <tr><td colSpan={5} className="text-center text-muted py-4">No Connect ledger entries</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="table-card">
          <div className="table-card-header">
            <h6 className="table-card-title">Payment Gateway Transactions ({transactions.length})</h6>
          </div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Package</th>
                  <th>Connects</th>
                  <th>Amount (₹)</th>
                  <th>Payment ID</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td>{t.pack_name || 'Connect Pack'}</td>
                    <td>{t.credits_purchased || 0}</td>
                    <td>₹{t.amount_inr}</td>
                    <td>{t.razorpay_payment_id || '—'}</td>
                    <td><span className={`badge bg-${t.status === 'success' ? 'success' : t.status === 'refunded' ? 'info' : 'warning'}`}>{t.status}</span></td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No payment transactions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: CHATS */}
      {activeTab === 'chats' && (
        <div className="table-card">
          <div className="table-card-header">
            <h6 className="table-card-title">Chat Conversations ({chats.length})</h6>
          </div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Participants</th>
                  <th>Session Status</th>
                  <th>Messages</th>
                  <th>Last Message Preview</th>
                  <th>Expires At</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>{c.user1_username} ↔ {c.user2_username}</td>
                    <td><span className={`badge bg-${c.session_status === 'ACTIVE' ? 'success' : 'secondary'}`}>{c.session_status || 'ACTIVE'}</span></td>
                    <td>{c.message_count || 0}</td>
                    <td>{c.last_message_preview || '—'}</td>
                    <td>{c.expires_at ? new Date(c.expires_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {chats.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No chat sessions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: PRIVATE MESSAGES */}
      {activeTab === 'private_messages' && (
        <div className="table-card">
          <div className="table-card-header">
            <h6 className="table-card-title">Private Message Threads ({privateMessages.length})</h6>
          </div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Participants</th>
                  <th>Status</th>
                  <th>Messages</th>
                  <th>Last Preview</th>
                  <th>Expires At</th>
                </tr>
              </thead>
              <tbody>
                {privateMessages.map((pm) => (
                  <tr key={pm.id}>
                    <td>#{pm.id}</td>
                    <td>{pm.user1_username} ↔ {pm.user2_username}</td>
                    <td><span className="badge bg-primary">{pm.session_status || 'ACTIVE'}</span></td>
                    <td>{pm.message_count || 0}</td>
                    <td>{pm.last_message_preview || '—'}</td>
                    <td>{pm.expires_at ? new Date(pm.expires_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {privateMessages.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No private message threads</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: REPORTS */}
      {activeTab === 'reports' && (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Reports Against This User ({(reports.againstUser || []).length})</h6>
              {(reports.againstUser || []).map((r) => (
                <div key={r.id} className="p-3 border rounded-3 mb-2">
                  <div className="d-flex justify-content-between">
                    <strong>Reason: {r.reason}</strong>
                    <span className="badge bg-danger">{r.status}</span>
                  </div>
                  <div className="small text-muted">Reported by: {r.reporter_username}</div>
                  {r.description && <div className="small mt-1">{r.description}</div>}
                </div>
              ))}
              {(reports.againstUser || []).length === 0 && <div className="text-muted">No reports against this user.</div>}
            </div>
          </div>
          <div className="col-md-6">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Reports Submitted By This User ({(reports.submittedByUser || []).length})</h6>
              {(reports.submittedByUser || []).map((r) => (
                <div key={r.id} className="p-3 border rounded-3 mb-2">
                  <div className="d-flex justify-content-between">
                    <strong>Against: {r.reported_username}</strong>
                    <span className="badge bg-secondary">{r.status}</span>
                  </div>
                  <div className="small">Reason: {r.reason}</div>
                </div>
              ))}
              {(reports.submittedByUser || []).length === 0 && <div className="text-muted">No reports submitted by this user.</div>}
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: BLOCKS */}
      {activeTab === 'blocks' && (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Users Blocked By {user.username} ({(blocks.blockedByUser || []).length})</h6>
              {(blocks.blockedByUser || []).map((b) => (
                <div key={b.id} className="d-flex justify-content-between py-2 border-bottom">
                  <span><strong>{b.blocked_username}</strong> ({b.blocked_email})</span>
                  <span className="text-muted small">{new Date(b.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {(blocks.blockedByUser || []).length === 0 && <div className="text-muted">Has not blocked anyone.</div>}
            </div>
          </div>
          <div className="col-md-6">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Blocked By Others ({(blocks.blockedByOthers || []).length})</h6>
              {(blocks.blockedByOthers || []).map((b) => (
                <div key={b.id} className="d-flex justify-content-between py-2 border-bottom">
                  <span>Blocked by <strong>{b.blocker_username}</strong></span>
                  <span className="text-muted small">{new Date(b.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {(blocks.blockedByOthers || []).length === 0 && <div className="text-muted">Not blocked by any user.</div>}
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: PRIVACY */}
      {activeTab === 'privacy' && (
        <div className="row g-4">
          <div className="col-md-5">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">User Privacy Flags</h6>
              {privacy.settings ? (
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between"><span>Hide Phone</span><strong>{privacy.settings.hide_phone ? 'Hidden' : 'Visible'}</strong></li>
                  <li className="list-group-item d-flex justify-content-between"><span>Hide Instagram</span><strong>{privacy.settings.hide_instagram ? 'Hidden' : 'Visible'}</strong></li>
                  <li className="list-group-item d-flex justify-content-between"><span>Hide Facebook</span><strong>{privacy.settings.hide_facebook ? 'Hidden' : 'Visible'}</strong></li>
                  <li className="list-group-item d-flex justify-content-between"><span>Hide Telegram</span><strong>{privacy.settings.hide_telegram ? 'Hidden' : 'Visible'}</strong></li>
                  <li className="list-group-item d-flex justify-content-between"><span>Incognito Mode</span><strong>{privacy.settings.incognito_mode ? 'Enabled' : 'Disabled'}</strong></li>
                </ul>
              ) : (
                <div className="text-muted">Default privacy settings active (contact fields hidden for female users until explicitly shared).</div>
              )}
            </div>
          </div>
          <div className="col-md-7">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Per-User Female Contact Permissions ({(privacy.femalePermissions || []).length})</h6>
              {(privacy.femalePermissions || []).map((fp) => (
                <div key={fp.id} className="p-3 border rounded-3 mb-2 small">
                  <div className="fw-bold mb-1">Partner: {fp.partner_username} ({fp.partner_email})</div>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge bg-${fp.allow_phone ? 'success' : 'secondary'}`}>Phone: {fp.allow_phone ? 'Allowed' : 'Hidden'}</span>
                    <span className={`badge bg-${fp.allow_instagram ? 'success' : 'secondary'}`}>Instagram: {fp.allow_instagram ? 'Allowed' : 'Hidden'}</span>
                    <span className={`badge bg-${fp.allow_facebook ? 'success' : 'secondary'}`}>Facebook: {fp.allow_facebook ? 'Allowed' : 'Hidden'}</span>
                    <span className={`badge bg-${fp.allow_telegram ? 'success' : 'secondary'}`}>Telegram: {fp.allow_telegram ? 'Allowed' : 'Hidden'}</span>
                  </div>
                </div>
              ))}
              {(privacy.femalePermissions || []).length === 0 && (
                <div className="text-muted">No per-user contact permissions granted or received yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 12: AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="table-card">
          <div className="table-card-header">
            <h6 className="table-card-title">Admin Audit Trail for User #{user.id} ({auditHistory.length})</h6>
          </div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Admin</th>
                  <th>Reason</th>
                  <th>Changes</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditHistory.map((log) => (
                  <tr key={log.id}>
                    <td><span className="badge bg-dark">{log.action_type}</span></td>
                    <td>{log.admin_username} ({log.admin_role})</td>
                    <td>{log.reason || '—'}</td>
                    <td style={{ fontSize: 12, maxWidth: 320 }}>
                      <code>{JSON.stringify(log.new_value)}</code>
                    </td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {auditHistory.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted py-4">No admin audit logs for this user yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
