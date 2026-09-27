import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function Transactions() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [connectLedger, setConnectLedger] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [refundModal, setRefundModal] = useState(null);
  const [refundForm, setRefundForm] = useState({ reason: '', reverse_connects: true });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/transactions', {
        params: { status: statusFilter, transaction_type: typeFilter, search },
      });
      setPayments(res.data.transactions || []);
      setConnectLedger(res.data.connectTransactions || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!refundModal) return;
    try {
      await api.post(`/admin/payments/${refundModal.id}/refund`, refundForm);
      toast.success(`Transaction #${refundModal.id} refunded`);
      setRefundModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed');
    }
  };

  return (
    <div>
      <div className="page-header flex-wrap gap-2">
        <div>
          <h4>Payments, Transactions & Refunds</h4>
          <div className="breadcrumb-text">
            Monitor payment gateway orders, process refunds, and audit Connect wallet ledger entries.
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className={tab === 'payments' ? 'btn-admin-primary' : 'btn-admin-outline'}
            onClick={() => setTab('payments')}
          >
            <i className="bi bi-credit-card" /> Payment Orders ({payments.length})
          </button>
          <button
            className={tab === 'ledger' ? 'btn-admin-primary' : 'btn-admin-outline'}
            onClick={() => setTab('ledger')}
          >
            <i className="bi bi-journal-code" /> Connect Ledger ({connectLedger.length})
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value text-success">
              ₹{Number(summary.total_revenue || 0).toLocaleString('en-IN')}
            </div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value">
              ₹{Number(summary.today_revenue || 0).toLocaleString('en-IN')}
            </div>
            <div className="stat-label">Today&apos;s Revenue</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value text-primary">{summary.successful_payments || 0}</div>
            <div className="stat-label">Successful Payments</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value text-danger">
              {summary.refunded_payments || 0} (₹{Number(summary.total_refunded_amount || 0).toLocaleString('en-IN')})
            </div>
            <div className="stat-label">Refunded Payments</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="table-card p-3 mb-4 d-flex flex-wrap gap-2">
        <input
          className="search-input"
          placeholder="Search user, package, payment ID, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 240px' }}
        />
        {tab === 'payments' ? (
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Payment Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        ) : (
          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Ledger Types</option>
            <option value="PURCHASE">PURCHASE</option>
            <option value="CHAT_START">CHAT_START</option>
            <option value="CHAT_MESSAGE_ACCESS">CHAT_MESSAGE_ACCESS</option>
            <option value="CHAT_REINITIATE">CHAT_REINITIATE</option>
            <option value="PRIVATE_MESSAGE_START">PRIVATE_MESSAGE_START</option>
            <option value="PRIVATE_MESSAGE_REINITIATE">PRIVATE_MESSAGE_REINITIATE</option>
            <option value="ADMIN_ADJUSTMENT">ADMIN_ADJUSTMENT</option>
            <option value="REFUND_REVERSAL">REFUND_REVERSAL</option>
          </select>
        )}
        <button className="btn-admin-outline" onClick={load}>
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      </div>

      {tab === 'payments' ? (
        <div className="table-card table-responsive">
          <table className="table mb-0 text-nowrap">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Package</th>
                <th>Connects</th>
                <th>Amount (₹)</th>
                <th>Gateway Ref</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>
                    <span
                      style={{ cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => t.user_id && navigate(`/admin/users/${t.user_id}`)}
                    >
                      {t.username || 'Deleted User'}
                    </span>
                  </td>
                  <td>{t.pack_name || 'Connect Pack'}</td>
                  <td>+{t.credits_purchased || 0}</td>
                  <td className="fw-bold">₹{t.amount_inr}</td>
                  <td><small className="text-muted">{t.razorpay_payment_id || t.razorpay_order_id || '—'}</small></td>
                  <td>
                    <span
                      className={`badge bg-${
                        t.status === 'success'
                          ? 'success'
                          : t.status === 'refunded'
                          ? 'info'
                          : t.status === 'pending'
                          ? 'warning text-dark'
                          : 'danger'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>{new Date(t.created_at).toLocaleString('en-IN')}</td>
                  <td>
                    {t.status === 'success' && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          setRefundModal(t);
                          setRefundForm({ reason: '', reverse_connects: true });
                        }}
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">
                    No payment transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-card table-responsive">
          <table className="table mb-0 text-nowrap">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Delta</th>
                <th>Prev → New Balance</th>
                <th>Related User</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {connectLedger.map((ct) => (
                <tr key={ct.id}>
                  <td>#{ct.id}</td>
                  <td>
                    <span
                      style={{ cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => ct.user_id && navigate(`/admin/users/${ct.user_id}`)}
                    >
                      {ct.username || `#${ct.user_id}`}
                    </span>
                  </td>
                  <td><span className="badge bg-dark">{ct.transaction_type}</span></td>
                  <td className={ct.amount >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                    {ct.amount >= 0 ? `+${ct.amount}` : ct.amount}
                  </td>
                  <td>{ct.previous_balance} → <strong>{ct.new_balance}</strong></td>
                  <td>{ct.related_username || '—'}</td>
                  <td>{ct.description || '—'}</td>
                  <td>{new Date(ct.created_at).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {connectLedger.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No Connect ledger entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {refundModal && (
        <div className="modal-overlay" onClick={() => setRefundModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                Process Refund — Transaction #{refundModal.id}
              </h5>
              <button className="modal-close-btn" onClick={() => setRefundModal(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="p-3 bg-light rounded-3 mb-3 small">
              <div><strong>User:</strong> {refundModal.username}</div>
              <div><strong>Amount:</strong> ₹{refundModal.amount_inr}</div>
              <div><strong>Connects Purchased:</strong> {refundModal.credits_purchased} Connects</div>
            </div>
            <form onSubmit={handleRefund}>
              <div className="mb-3">
                <label className="form-label-admin">Refund Reason</label>
                <input
                  type="text"
                  className="form-input-admin"
                  placeholder="Enter reason for refund..."
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="reverseConnectsCheck"
                  checked={refundForm.reverse_connects}
                  onChange={(e) => setRefundForm({ ...refundForm, reverse_connects: e.target.checked })}
                />
                <label className="form-check-label small" htmlFor="reverseConnectsCheck">
                  Reverse {refundModal.credits_purchased} Connects from user wallet
                </label>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn-admin-outline" onClick={() => setRefundModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary">
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}