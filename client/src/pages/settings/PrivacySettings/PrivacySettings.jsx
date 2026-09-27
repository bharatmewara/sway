import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import RightBar from '../../../components/RightBar';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const getFallback = (gender) => (gender === 'female' ? '/img/girl.png' : '/img/boy.png');
const getPhoto = (p, gender) => {
  if (!p) return getFallback(gender);
  return p.startsWith('http') || p.startsWith('/') || p.startsWith('data:') ? p : `/${p}`;
};

export default function PrivacySettings() {
  const { user, updateUser } = useAuth();
  const isFemale = (user?.verified_gender || user?.gender) === 'female';

  const [loading, setLoading] = useState(true);
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialForm, setSocialForm] = useState({
    instagram: '',
    facebook: '',
    telegram: '',
    phone: '',
  });

  const [permissions, setPermissions] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [selectedMaleId, setSelectedMaleId] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const requests = [
        api.get('/profile/me').catch(() => ({ data: {} })),
        api.get('/reports/blocks').catch(() => ({ data: { blocks: [] } })),
      ];
      if (isFemale) {
        requests.push(api.get('/users/privacy/permissions').catch(() => ({ data: { permissions: [] } })));
        requests.push(api.get('/visitors').catch(() => ({ data: { visitors: [] } })));
      }

      const [profRes, blockRes, permRes, visRes] = await Promise.all(requests);
      const prof = profRes.data?.profile || profRes.data?.user || user || {};
      setSocialForm({
        instagram: prof.instagram || '',
        facebook: prof.facebook || '',
        telegram: prof.telegram || '',
        phone: prof.phone || '',
      });
      setBlocks(blockRes.data?.blocks || []);
      if (isFemale && permRes) {
        setPermissions(permRes.data?.permissions || []);
      }
      if (isFemale && visRes) {
        setVisitors(visRes.data?.visitors || []);
      }
    } catch (err) {
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [isFemale]);

  const handleSaveSocial = async (e) => {
    e.preventDefault();
    setSavingSocial(true);
    try {
      const res = await api.put('/profile/me', socialForm);
      const updated = res.data?.profile || res.data?.user;
      if (updated) {
        updateUser(updated);
      }
      toast.success('Social links & contact details saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update social links');
    } finally {
      setSavingSocial(false);
    }
  };

  const handleTogglePermission = async (perm, field) => {
    const updated = {
      male_user_id: perm.male_user_id,
      allow_instagram: field === 'allow_instagram' ? !perm.allow_instagram : !!perm.allow_instagram,
      allow_facebook: field === 'allow_facebook' ? !perm.allow_facebook : !!perm.allow_facebook,
      allow_telegram: field === 'allow_telegram' ? !perm.allow_telegram : !!perm.allow_telegram,
      allow_phone: field === 'allow_phone' ? !perm.allow_phone : !!perm.allow_phone,
    };
    try {
      await api.put(`/users/privacy/permissions/${perm.male_user_id}`, updated);
      setPermissions((prev) =>
        prev.map((p) => (p.male_user_id === perm.male_user_id ? { ...p, ...updated } : p))
      );
      toast.success('Permission updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update permission');
    }
  };

  const handleAddMalePermission = async (e) => {
    e.preventDefault();
    if (!selectedMaleId) return;
    try {
      await api.post('/users/privacy/permissions', {
        male_user_id: Number(selectedMaleId),
        allow_instagram: true,
        allow_facebook: false,
        allow_telegram: false,
        allow_phone: false,
      });
      toast.success('User added to contact permissions list');
      setSelectedMaleId('');
      const res = await api.get('/users/privacy/permissions');
      setPermissions(res.data?.permissions || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant permission');
    }
  };

  const handleRevokeAll = async (maleUserId) => {
    try {
      await api.delete(`/users/privacy/permissions/${maleUserId}`);
      setPermissions((prev) => prev.filter((p) => p.male_user_id !== maleUserId));
      toast.success('All contact access revoked for this user');
    } catch (err) {
      toast.error('Failed to revoke permissions');
    }
  };

  const handleUnblock = async (blockedId) => {
    try {
      await api.delete(`/reports/block/${blockedId}`);
      setBlocks((prev) => prev.filter((b) => b.blocked_id !== blockedId));
      toast.success('User unblocked');
    } catch (err) {
      toast.error('Failed to unblock user');
    }
  };

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="fw-bold mb-1">
                <i className="bi bi-shield-lock-fill text-danger me-2" />
                Privacy & Contact Controls
              </h4>
              <p className="text-muted small mb-0">
                Manage who can view your social links, contact details, and profile.
              </p>
            </div>
          </div>

          {/* Settings Navigation Tabs */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {[
              { path: '/settings/account',       icon: 'bi-person-gear',  label: 'Account Settings' },
              { path: '/settings/privacy',       icon: 'bi-shield-lock',  label: 'Privacy Controls' },
              { path: '/settings/notifications', icon: 'bi-bell',         label: 'Notifications' },
            ].map((tab) => {
              const active = tab.path === '/settings/privacy';
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold text-decoration-none ${
                    active ? 'btn-wine text-white' : 'btn-light border text-dark'
                  }`}
                >
                  <i className={`bi ${tab.icon} me-1`} />
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status" />
            </div>
          ) : (
            <>
              {/* Social Links & Contact Information */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <div>
                    <h5 className="fw-bold mb-1">Your Social Links & Contact Details</h5>
                    <p className="text-muted small mb-0">
                      {isFemale
                        ? 'Default Privacy Rule: Your Instagram, Facebook, Telegram, and Phone Number are strictly hidden from all male users unless you explicitly grant access below.'
                        : 'Update your contact details and social handles.'}
                    </p>
                  </div>
                  {isFemale && (
                    <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">
                      <i className="bi bi-lock-fill me-1" /> Protected by Female Privacy Controls
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveSocial}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        <i className="bi bi-instagram text-danger me-1" /> Instagram Username
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="@your_instagram"
                        value={socialForm.instagram}
                        onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        <i className="bi bi-facebook text-primary me-1" /> Facebook Profile
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="facebook.com/yourprofile"
                        value={socialForm.facebook}
                        onChange={(e) => setSocialForm({ ...socialForm, facebook: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        <i className="bi bi-telegram text-info me-1" /> Telegram Username
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="@your_telegram"
                        value={socialForm.telegram}
                        onChange={(e) => setSocialForm({ ...socialForm, telegram: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        <i className="bi bi-telephone-fill text-success me-1" /> Phone Number
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+91 98765 43210"
                        value={socialForm.phone}
                        onChange={(e) => setSocialForm({ ...socialForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-12 text-end">
                      <button type="submit" className="btn btn-wine px-4 rounded-pill" disabled={savingSocial}>
                        {savingSocial ? 'Saving...' : 'Save Contact Details'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Female Per-User Privacy Permissions */}
              {isFemale && (
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">
                        <i className="bi bi-person-check-fill text-danger me-2" />
                        Per-User Contact Access Permissions
                      </h5>
                      <p className="text-muted small mb-0">
                        Select which specific male users are allowed to view your Instagram, Facebook, Telegram, or Phone Number. You can grant or revoke access at any time.
                      </p>
                    </div>
                  </div>

                  {/* Quick Add from Visitors */}
                  {visitors.length > 0 && (
                    <form onSubmit={handleAddMalePermission} className="row g-2 align-items-center mb-4 p-3 rounded-3 bg-light">
                      <div className="col-12 col-md-8">
                        <select
                          className="form-select"
                          value={selectedMaleId}
                          onChange={(e) => setSelectedMaleId(e.target.value)}
                        >
                          <option value="">Select a recent visitor to grant contact access...</option>
                          {visitors
                            .filter((v) => !permissions.some((p) => p.male_user_id === v.visitor_id))
                            .map((v) => (
                              <option key={v.visitor_id} value={v.visitor_id}>
                                {v.username}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="col-12 col-md-4">
                        <button
                          type="submit"
                          className="btn btn-outline-danger w-100 rounded-pill"
                          disabled={!selectedMaleId}
                        >
                          <i className="bi bi-plus-circle me-1" /> Grant Access
                        </button>
                      </div>
                    </form>
                  )}

                  {permissions.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded-3 text-muted">
                      <i className="bi bi-shield-check fs-2 d-block mb-2 text-success" />
                      <p className="mb-1 fw-semibold text-dark">All your contact details are currently private</p>
                      <small>
                        You can also grant access directly from any male user&apos;s profile page (<Link to="/home">Explore Members</Link>).
                      </small>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr className="small text-muted">
                            <th>Male Member</th>
                            <th className="text-center">Allow Instagram</th>
                            <th className="text-center">Allow Facebook</th>
                            <th className="text-center">Allow Telegram</th>
                            <th className="text-center">Allow Phone Number</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {permissions.map((perm) => (
                            <tr key={perm.male_user_id}>
                              <td>
                                <Link
                                  to={`/view-profile/${perm.male_user_id}`}
                                  className="d-flex align-items-center gap-2 text-decoration-none text-dark fw-semibold"
                                >
                                  <img
                                    src={getPhoto(perm.profile_photo, 'male')}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = getFallback('male');
                                    }}
                                    alt={perm.username}
                                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                  <span>{perm.username}</span>
                                </Link>
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={!!perm.allow_instagram}
                                  onChange={() => handleTogglePermission(perm, 'allow_instagram')}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={!!perm.allow_facebook}
                                  onChange={() => handleTogglePermission(perm, 'allow_facebook')}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={!!perm.allow_telegram}
                                  onChange={() => handleTogglePermission(perm, 'allow_telegram')}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={!!perm.allow_phone}
                                  onChange={() => handleTogglePermission(perm, 'allow_phone')}
                                />
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                  onClick={() => handleRevokeAll(perm.male_user_id)}
                                >
                                  Revoke All
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Blocked Users List */}
              <div className="card border-0 shadow-sm rounded-4 p-4">
                <h5 className="fw-bold mb-1">
                  <i className="bi bi-slash-circle text-danger me-2" />
                  Blocked Users
                </h5>
                <p className="text-muted small mb-3">
                  Blocked users cannot send you messages, private messages, connection requests, likes, or crushes.
                </p>

                {blocks.length === 0 ? (
                  <div className="text-muted small py-3 text-center bg-light rounded-3">
                    You have not blocked any users.
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {blocks.map((b) => (
                      <div
                        key={b.blocked_id}
                        className="list-group-item d-flex justify-content-between align-items-center px-0"
                      >
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={getPhoto(b.profile_photo, b.gender)}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getFallback(b.gender);
                            }}
                            alt={b.username}
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-semibold">{b.username}</div>
                            <small className="text-muted">Blocked</small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                          onClick={() => handleUnblock(b.blocked_id)}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="col-12 col-xl-3">
          <RightBar />
        </div>
      </div>
    </DashboardLayout>
  );
}
