import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function Reports() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [mostBlocked, setMostBlocked] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionForm, setResolutionForm] = useState({
    action: 'resolve',
    resolution_action: 'none',
    admin_notes: '',
  });
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports', {
        params: { status: statusFilter, priority: priorityFilter, search },
      });
      setReports(res.data.reports || []);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/blocks', { params: { search } });
      setBlocks(res.data.blocks || []);
      setMostBlocked(res.data.mostBlockedUsers || []);
    } catch (err) {
      toast.error('Failed to load blocks');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (tab === 'reports') loadReports();
    else loadBlocks();
  }, [tab, loadReports, loadBlocks]);

  const openReportDetail = async (id) => {
    try {
      const res = await api.get(`/admin/reports/${id}`);
      setSelectedReport(res.data);
      setResolutionForm({
        action: 'resolve',
        resolution_action: res.data.report?.resolution_action || 'none',
        admin_notes: res.data.report?.admin_notes || '',
      });
    } catch (err) {
      toast.error('Failed to load report details');
    }
  };

  const submitReportAction = async (e) => {
    e.preventDefault();
    if (!selectedReport?.report) return;
    const reportId = selectedReport.report.id;
    try {
      await api.put(`/admin/reports/${reportId}/${resolutionForm.action}`, {
        resolution_action: resolutionForm.resolution_action,
        admin_notes: resolutionForm.admin_notes,
      });
      toast.success(`Report #${reportId} ${resolutionForm.action}d`);
      setSelectedReport(null);
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const quickResolve = async (id, action = 'resolve') => {
    try {
      await api.put(`/admin/reports/${id}/${action}`, {
        resolution_action: 'none',
        admin_notes: `Quick ${action} by admin`,
      });
      toast.success(`Report #${id} ${action}d`);
      loadReports();
    } catch (err) {
      toast.error('Failed to update report');
    }
  };

  const handleRemoveBlock = async (blockId) => {
    if (!window.confirm('Remove this user block?')) return;
    try {
      await api.delete(`/admin/blocks/${blockId}`);
      toast.success('Block removed');
      loadBlocks();
    } catch (err) {
      toast.error('Failed to remove block');
    }
  };

  return (
    <div>
      <div className="page-header flex-wrap gap-2">
        <div>
          <h4>Reports & Blocks Moderation</h4>
          <div className="breadcrumb-text">
            Review user reports, inspect conversation evidence, enforce suspensions/bans, and manage user blocks.
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className={tab === 'reports' ? 'btn-admin-primary' : 'btn-admin-outline'}
            onClick={() => setTab('reports')}
          >
            <i className="bi bi-flag" /> Reports ({reports.length})
          </button>
          <button
            className={tab === 'blocks' ? 'btn-admin-primary' : 'btn-admin-outline'}
            onClick={() => setTab('blocks')}
          >
            <i className="bi bi-slash-circle" /> Blocks ({blocks.length})
          </button>
        </div>
      </div>

      {tab === 'reports' ? (
        <>
          <div className="table-card p-3 mb-4 d-flex flex-wrap gap-2">
            <input
              className="search-input"
              placeholder="Search reporter, reported user, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: '1 1 240px' }}
            />
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="table-card table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Reporter</th>
                  <th>Reported User</th>
                  <th>Reason & Description</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>
                      <span
                        style={{ cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => navigate(`/admin/users/${r.reporter_id}`)}
                      >
                        {r.reporter_name || `#${r.reporter_id}`}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{ cursor: 'pointer', fontWeight: 600, color: '#c62828' }}
                        onClick={() => navigate(`/admin/users/${r.reported_id}`)}
                      >
                        {r.reported_name || `#${r.reported_id}`}
                      </span>
                      {r.reported_total_reports > 1 && (
                        <span className="badge bg-danger ms-2">{r.reported_total_reports}x</span>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold">{r.reason}</div>
                      {r.description && <small className="text-muted">{r.description}</small>}
                    </td>
                    <td>
                      <span className={`badge bg-${r.priority === 'critical' || r.priority === 'high' ? 'danger' : 'secondary'}`}>
                        {r.priority || 'medium'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge bg-${
                          r.status === 'resolved'
                            ? 'success'
                            : r.status === 'escalated'
                            ? 'danger'
                            : r.status === 'rejected'
                            ? 'secondary'
                            : 'warning text-dark'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => openReportDetail(r.id)}
                        >
                          Inspect
                        </button>
                        {r.status !== 'resolved' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => quickResolve(r.id, 'resolve')}
                          >
                            Resolve
                          </button>
                        )}
                        {r.status !== 'escalated' && r.status !== 'resolved' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => quickResolve(r.id, 'escalate')}
                          >
                            Escalate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="table-card">
              <div className="table-card-header">
                <h6 className="table-card-title">Active User Blocks</h6>
              </div>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Blocker</th>
                      <th>Blocked User</th>
                      <th>Reason</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <span style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate(`/admin/users/${b.blocker_id}`)}>
                            {b.blocker_username} ({b.blocker_gender})
                          </span>
                        </td>
                        <td>
                          <span style={{ cursor: 'pointer', fontWeight: 600, color: '#c62828' }} onClick={() => navigate(`/admin/users/${b.blocked_id}`)}>
                            {b.blocked_username} ({b.blocked_gender})
                          </span>
                        </td>
                        <td>{b.reason || 'Blocked by user'}</td>
                        <td>{new Date(b.created_at).toLocaleString()}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveBlock(b.id)}>
                            Unblock Pair
                          </button>
                        </td>
                      </tr>
                    ))}
                    {blocks.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-muted py-4">No block records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Most Frequently Blocked Users</h6>
              {mostBlocked.map((u) => (
                <div key={u.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <div className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/users/${u.id}`)}>
                      {u.username}
                    </div>
                    <small className="text-muted">{u.email}</small>
                  </div>
                  <span className="badge bg-danger">{u.blocked_count} blocks</span>
                </div>
              ))}
              {mostBlocked.length === 0 && <div className="text-muted small">No data yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Report Detail & Enforcement Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-box" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                Report #{selectedReport.report?.id} — Moderation Review
              </h5>
              <button className="modal-close-btn" onClick={() => setSelectedReport(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="p-3 bg-light rounded-3 mb-3 small">
              <div><strong>Reporter:</strong> {selectedReport.report?.reporter_name} ({selectedReport.report?.reporter_email})</div>
              <div><strong>Reported User:</strong> {selectedReport.report?.reported_name} ({selectedReport.report?.reported_email})</div>
              <div><strong>Reason:</strong> {selectedReport.report?.reason}</div>
              <div><strong>Description:</strong> {selectedReport.report?.description || '—'}</div>
            </div>

            {selectedReport.recentMessagesBetweenUsers?.length > 0 && (
              <div className="mb-3">
                <label className="form-label-admin">Recent Messages Between Users</label>
                <div className="border rounded-3 p-2" style={{ maxHeight: 160, overflowY: 'auto', fontSize: 12 }}>
                  {selectedReport.recentMessagesBetweenUsers.map((m) => (
                    <div key={m.id} className="py-1 border-bottom">
                      <strong>{m.sender_name}:</strong> {m.content}{' '}
                      <span className="text-muted">({new Date(m.created_at).toLocaleString()})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={submitReportAction}>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label-admin">Report Decision</label>
                  <select
                    className="form-input-admin"
                    value={resolutionForm.action}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, action: e.target.value })}
                  >
                    <option value="resolve">Resolve Report</option>
                    <option value="investigating">Mark as Investigating</option>
                    <option value="reject">Reject / Dismiss Report</option>
                    <option value="escalate">Escalate to Critical</option>
                    <option value="pending">Reopen as Pending</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label-admin">Enforcement Action on Reported User</label>
                  <select
                    className="form-input-admin"
                    value={resolutionForm.resolution_action}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, resolution_action: e.target.value })}
                  >
                    <option value="none">No Account Change</option>
                    <option value="warn_user">Send Official Warning Notification</option>
                    <option value="suspend_user">Suspend User Account</option>
                    <option value="block_user">Block User Account</option>
                    <option value="ban_user">Permanently Ban User Account</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label-admin">Admin Notes</label>
                  <textarea
                    className="form-input-admin"
                    rows={3}
                    value={resolutionForm.admin_notes}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, admin_notes: e.target.value })}
                    placeholder="Record investigation findings and decision..."
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn-admin-outline" onClick={() => setSelectedReport(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary">
                  Save Moderation Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}