import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function ConnectsAdmin() {
  const [packages, setPackages] = useState([]);
  const [commSettings, setCommSettings] = useState({});
  const [usageBreakdown, setUsageBreakdown] = useState([]);
  const [recentLedger, setRecentLedger] = useState([]);
  const [pkgModal, setPkgModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    user_id: '',
    operation: 'add',
    amount: '',
    reason: '',
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/connects');
      setPackages(res.data.packages || []);
      setCommSettings(res.data.communicationSettings || {});
      setUsageBreakdown(res.data.usageBreakdown || []);
      setRecentLedger(res.data.recentLedger || []);
    } catch (err) {
      toast.error('Failed to load Connect economy data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSavePackage = async (e) => {
    e.preventDefault();
    try {
      if (pkgModal.id) {
        await api.put(`/admin/connects/packages/${pkgModal.id}`, pkgModal);
        toast.success('Connect package updated');
      } else {
        await api.post('/admin/connects/packages', pkgModal);
        toast.success('Connect package created');
      }
      setPkgModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save package');
    }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Delete this Connect package?')) return;
    try {
      await api.delete(`/admin/connects/packages/${id}`);
      toast.success('Package deleted');
      loadData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleManualAdjust = async (e) => {
    e.preventDefault();
    if (!adjustForm.user_id || !adjustForm.amount || !adjustForm.reason) {
      toast.error('User ID, amount, and reason are required');
      return;
    }
    try {
      const res = await api.post('/admin/connects/adjust', {
        user_id: Number(adjustForm.user_id),
        operation: adjustForm.operation,
        amount: Number(adjustForm.amount),
        reason: adjustForm.reason,
      });
      toast.success(res.data.message || 'Connect balance updated');
      setAdjustForm({ user_id: '', operation: 'add', amount: '', reason: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed');
    }
  };

  return (
    <div>
      <div className="page-header flex-wrap gap-2">
        <div>
          <h4>Connect Economy & Packages</h4>
          <div className="breadcrumb-text">
            Manage Connect top-up packages, inspect Connect usage by action, and perform audited wallet adjustments.
          </div>
        </div>
        <button
          className="btn-admin-primary"
          onClick={() =>
            setPkgModal({
              name: '',
              credits: 50,
              price_inr: 499,
              currency: 'INR',
              discount: 0,
              bonus_connects: 0,
              is_popular: false,
              is_active: true,
              display_order: packages.length + 1,
            })
          }
        >
          <i className="bi bi-plus-lg" /> Create Connect Package
        </button>
      </div>

      {/* Active Communication Costs Strip */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md">
          <div className="stat-card">
            <div className="stat-value">{commSettings.chat_start_cost ?? 5} Connects</div>
            <div className="stat-label">Start Chat Cost (Male)</div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="stat-card">
            <div className="stat-value">{commSettings.chat_message_access_cost ?? 5} Connects</div>
            <div className="stat-label">Unlock Female Chat Cost</div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="stat-card">
            <div className="stat-value">{commSettings.private_message_start_cost ?? 10} Connects</div>
            <div className="stat-label">Send Private Message Cost</div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="stat-card">
            <div className="stat-value">{commSettings.private_message_access_cost ?? 5} Connects</div>
            <div className="stat-label">View Female Private Message</div>
          </div>
        </div>
        <div className="col-12 col-md">
          <div className="stat-card">
            <div className="stat-value text-success">0 Connects</div>
            <div className="stat-label">Verified Female Cost</div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Connect Packages Table */}
        <div className="col-lg-8">
          <div className="table-card h-100">
            <div className="table-card-header">
              <h6 className="table-card-title">Connect Top-Up Packages ({packages.length})</h6>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Package Name</th>
                    <th>Connects</th>
                    <th>Bonus</th>
                    <th>Price (₹)</th>
                    <th>Popular</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-bold">{p.name}</td>
                      <td>{p.credits} Connects</td>
                      <td>{p.bonus_connects ? `+${p.bonus_connects}` : '—'}</td>
                      <td className="fw-semibold">₹{p.price_inr}</td>
                      <td>{p.is_popular ? <span className="badge bg-warning text-dark">Popular</span> : '—'}</td>
                      <td>
                        <span className={`badge bg-${p.is_active ? 'success' : 'secondary'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setPkgModal(p)}>
                            Edit
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePackage(p.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {packages.length === 0 && !loading && (
                    <tr><td colSpan={7} className="text-center text-muted py-4">No Connect packages configured</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Manual Connect Adjustment Form */}
        <div className="col-lg-4">
          <div className="table-card p-4 h-100">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-wallet2 me-2 text-danger" />
              Manual User Connect Adjustment
            </h6>
            <form onSubmit={handleManualAdjust}>
              <div className="mb-3">
                <label className="form-label-admin">User ID</label>
                <input
                  type="number"
                  className="form-input-admin"
                  placeholder="Enter User ID (e.g. 12)"
                  value={adjustForm.user_id}
                  onChange={(e) => setAdjustForm({ ...adjustForm, user_id: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label-admin">Operation</label>
                <select
                  className="form-input-admin"
                  value={adjustForm.operation}
                  onChange={(e) => setAdjustForm({ ...adjustForm, operation: e.target.value })}
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
                  placeholder="e.g. 100"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  min="0"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label-admin">Reason (Audit Log)</label>
                <input
                  type="text"
                  className="form-input-admin"
                  placeholder="e.g. Promotional reward"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-admin-primary w-100 justify-content-center">
                Apply Connect Adjustment
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Connect Usage Breakdown & Recent Ledger */}
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="table-card p-4">
            <h6 className="fw-bold mb-3">Connect Usage by Action Type</h6>
            {usageBreakdown.map((u) => (
              <div key={u.transaction_type} className="d-flex justify-content-between py-2 border-bottom small">
                <span><strong>{u.transaction_type}</strong> ({u.tx_count} tx)</span>
                <span className="fw-bold" style={{ color: '#6a1b9a' }}>{u.total_connects} Connects</span>
              </div>
            ))}
            {usageBreakdown.length === 0 && <div className="text-muted small">No Connect transactions recorded yet.</div>}
          </div>
        </div>

        <div className="col-lg-8">
          <div className="table-card">
            <div className="table-card-header">
              <h6 className="table-card-title">Recent Connect Ledger Entries</h6>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Delta</th>
                    <th>Balance</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLedger.map((ct) => (
                    <tr key={ct.id}>
                      <td>{ct.username || `#${ct.user_id}`}</td>
                      <td><span className="badge bg-dark">{ct.transaction_type}</span></td>
                      <td className={ct.amount >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                        {ct.amount >= 0 ? `+${ct.amount}` : ct.amount}
                      </td>
                      <td>{ct.previous_balance} → <strong>{ct.new_balance}</strong></td>
                      <td>{ct.description || '—'}</td>
                      <td>{new Date(ct.created_at).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Package Modal */}
      {pkgModal && (
        <div className="modal-overlay" onClick={() => setPkgModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                {pkgModal.id ? 'Edit Connect Package' : 'Create Connect Package'}
              </h5>
              <button className="modal-close-btn" onClick={() => setPkgModal(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <form onSubmit={handleSavePackage}>
              <div className="row g-3 mb-3">
                <div className="col-12">
                  <label className="form-label-admin">Package Name</label>
                  <input
                    className="form-input-admin"
                    value={pkgModal.name}
                    onChange={(e) => setPkgModal({ ...pkgModal, name: e.target.value })}
                    placeholder="e.g. Gold Connect Pack"
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label-admin">Connects Included</label>
                  <input
                    type="number"
                    className="form-input-admin"
                    value={pkgModal.credits}
                    onChange={(e) => setPkgModal({ ...pkgModal, credits: e.target.value })}
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label-admin">Bonus Connects</label>
                  <input
                    type="number"
                    className="form-input-admin"
                    value={pkgModal.bonus_connects || 0}
                    onChange={(e) => setPkgModal({ ...pkgModal, bonus_connects: e.target.value })}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label-admin">Price (₹ INR)</label>
                  <input
                    type="number"
                    className="form-input-admin"
                    value={pkgModal.price_inr}
                    onChange={(e) => setPkgModal({ ...pkgModal, price_inr: e.target.value })}
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label-admin">Discount (%)</label>
                  <input
                    type="number"
                    className="form-input-admin"
                    value={pkgModal.discount || 0}
                    onChange={(e) => setPkgModal({ ...pkgModal, discount: e.target.value })}
                  />
                </div>
                <div className="col-sm-6">
                  <div className="form-check mt-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={pkgModal.is_popular}
                      onChange={(e) => setPkgModal({ ...pkgModal, is_popular: e.target.checked })}
                    />
                    <label className="form-check-label">Mark as Most Popular</label>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="form-check mt-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={pkgModal.is_active}
                      onChange={(e) => setPkgModal({ ...pkgModal, is_active: e.target.checked })}
                    />
                    <label className="form-check-label">Package Active</label>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn-admin-outline" onClick={() => setPkgModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary">
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
