import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import RightBar from '../../../components/RightBar';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const SETTINGS_TABS = [
  { path: '/settings/account',       icon: 'bi-person-gear',     label: 'Account Settings' },
  { path: '/settings/privacy',       icon: 'bi-shield-lock',     label: 'Privacy Controls' },
  { path: '/settings/notifications', icon: 'bi-bell',            label: 'Notifications' },
];

export default function AccountSettings() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const isFemale = (user?.verified_gender || user?.gender) === 'female';

  const [accountForm, setAccountForm] = useState({
    username: '',
    nickname: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
  });
  const [savingAccount, setSavingAccount] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api.get('/profile/me')
      .then((res) => {
        const p = res.data?.profile || res.data?.user || user || {};
        setAccountForm({
          username: p.username || '',
          nickname: p.nickname || '',
          email: p.email || '',
          phone: p.phone || '',
          city: p.city || '',
          state: p.state || '',
          country: p.country || '',
        });
      })
      .catch(() => {
        if (user) {
          setAccountForm({
            username: user.username || '',
            nickname: user.nickname || '',
            email: user.email || '',
            phone: user.phone || '',
            city: user.city || '',
            state: user.state || '',
            country: user.country || '',
          });
        }
      });
  }, [user?.id]);

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const res = await api.put('/users/account', accountForm);
      const updated = res.data?.user || res.data?.data?.user;
      if (updated) {
        updateUser(updated);
      }
      toast.success('Account details updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update account details');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/users/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h4 className="fw-bold mb-1">
                <i className="bi bi-gear-fill text-danger me-2" />
                Account Settings
              </h4>
              <p className="text-muted small mb-0">
                Manage your account credentials, security, privacy controls, and blocked users.
              </p>
            </div>
          </div>

          {/* Settings Navigation Tabs */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {SETTINGS_TABS.map((tab) => {
              const active = location.pathname === tab.path || (tab.path === '/settings/account' && location.pathname === '/settings');
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

          {/* Verification & Identity Status Banner */}
          <div
            className="card border-0 shadow-sm rounded-4 p-4 mb-4"
            style={{
              background: 'linear-gradient(135deg, #fff5f8 0%, #ffffff 100%)',
              borderLeft: '4px solid #76000b',
            }}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1">
                    <i className="bi bi-patch-check-fill me-1" /> Verified profile
                  </span>
                </div>
                <p className="text-muted small mb-0 mt-1">
                  {isFemale
                    ? 'Your verified female account includes free Chat & Private Messages (0 Connects) and full Female Privacy Controls.'
                    : `Your current Connect balance is ${user?.connect_credits ?? 0} Connects.`}
                </p>
              </div>
              <div className="d-flex gap-2">
                <Link to="/profile" className="btn btn-sm btn-outline-danger rounded-pill px-3">
                  <i className="bi bi-person-lines-fill me-1" /> Edit Public Profile
                </Link>
                {!isFemale && (
                  <Link to="/purchase-connect" className="btn btn-sm btn-wine rounded-pill px-3">
                    <i className="bi bi-lightning-charge-fill me-1" /> Buy Connects
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Account Information Form */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-1">Account Information</h5>
            <p className="text-muted small mb-3">
              Update your username, email address, phone number, and location.
            </p>

            <form onSubmit={handleSaveAccount}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={accountForm.username}
                    onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Display Nickname</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Optional nickname"
                    value={accountForm.nickname}
                    onChange={(e) => setAccountForm({ ...accountForm, nickname: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">City</label>
                  <input
                    type="text"
                    className="form-control"
                    value={accountForm.city}
                    onChange={(e) => setAccountForm({ ...accountForm, city: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={accountForm.state}
                    onChange={(e) => setAccountForm({ ...accountForm, state: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    value={accountForm.country}
                    onChange={(e) => setAccountForm({ ...accountForm, country: e.target.value })}
                  />
                </div>
                <div className="col-12 text-end">
                  <button type="submit" className="btn btn-wine rounded-pill px-4" disabled={savingAccount}>
                    {savingAccount ? 'Saving...' : 'Save Account Details'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-1">
              <i className="bi bi-key-fill text-danger me-2" />
              Change Password
            </h5>
            <p className="text-muted small mb-3">
              Keep your account secure by updating your password regularly.
            </p>

            <form onSubmit={handleChangePassword}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter current password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirm new password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 text-end">
                  <button type="submit" className="btn btn-outline-danger rounded-pill px-4" disabled={savingPassword}>
                    {savingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="col-12 col-xl-3">
          <RightBar />
        </div>
      </div>
    </DashboardLayout>
  );
}
