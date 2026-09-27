import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AuditLogsAdmin() {
  const [tab, setTab] = useState('audit');
  const [logs, setLogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [roleForm, setRoleForm] = useState({ user_id: '', role: 'moderator' });

  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await api.get('/admin/audit-logs', {
        params: { action_type: actionFilter, search },
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      toast.error('Failed to load audit logs');
    }
  }, [actionFilter, search]);

  const loadAdmins = useCallback(async () => {
    try {
      const res = await api.get('/admin/admins');
      setAdmins(res.data.admins || []);
      setRoles(res.data.roles || []);
    } catch (err) {
      toast.error('Failed to load admin accounts');
    }
  }, []);

  useEffect(() => {
    if (tab === 'audit') loadAuditLogs();
    else loadAdmins();
  }, [tab, loadAuditLogs, loadAdmins]);

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!roleForm.user_id) return;
    try {
      await api.post('/admin/admins', roleForm);
      toast.success('Admin role updated');
      setRoleForm({ user_id: '', role: 'moderator' });
      loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div>
      <div className="page-header flex-wrap gap-2">
        <div>
          <h4>Admin Roles & Security Audit Logs</h4>
          <div className="breadcrumb-text">
            Manage RBAC administrator accounts and inspect immutable audit logs of every admin action.
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className={tab === 'audit' ? 'btn-admin-primary' : 'btn-admin-outline'}
            onClick={() => setTab('audit')}
          >
            <i className="bi bi-journal-check" /> Security Audit Logs
          </button>
          <button
            className={tab === 'admins' ? 'btn-admin-primary' : 'btn-admin-outline'}
            onClick={() => setTab('admins')}
          >
            <i className="bi bi-shield-lock" /> Admin Roles & Permissions
          </button>
        </div>
      </div>

      {tab === 'audit' ? (
        <>
          <div className="table-card p-3 mb-4 d-flex flex-wrap gap-2">
            <input
              className="search-input"
              placeholder="Search admin username, action type, target ID, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: '1 1 240px' }}
            />
            <select className="filter-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">All Action Types</option>
              <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
              <option value="USER_VERIFY">USER_VERIFY</option>
              <option value="USER_STATUS_CHANGE">USER_STATUS_CHANGE</option>
              <option value="USER_EDIT">USER_EDIT</option>
              <option value="USER_DELETE">USER_DELETE</option>
              <option value="CONNECT_ADJUST">CONNECT_ADJUST</option>
              <option value="PAYMENT_REFUND">PAYMENT_REFUND</option>
              <option value="REPORT_RESOLVED">REPORT_RESOLVED</option>
              <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
              <option value="NOTIFICATION_BROADCAST">NOTIFICATION_BROADCAST</option>
            </select>
            <button className="btn-admin-outline" onClick={loadAuditLogs}>
              <i className="bi bi-arrow-clockwise" /> Refresh
            </button>
          </div>

          <div className="table-card table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Admin</th>
                  <th>Action Type</th>
                  <th>Target</th>
                  <th>Reason</th>
                  <th>New Value</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>#{l.id}</td>
                    <td>
                      <strong>{l.admin_username || 'admin'}</strong>
                      <div className="small text-muted">{l.admin_role}</div>
                    </td>
                    <td><span className="badge bg-dark">{l.action_type}</span></td>
                    <td>{l.target_type ? `${l.target_type} #${l.target_id}` : '—'}</td>
                    <td>{l.reason || '—'}</td>
                    <td style={{ maxWidth: 280, fontSize: 11 }}>
                      <code className="d-block text-truncate">{JSON.stringify(l.new_value)}</code>
                    </td>
                    <td><small className="text-muted">{l.ip_address || '—'}</small></td>
                    <td>{new Date(l.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-muted py-4">No audit logs found</td></tr>
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
                <h6 className="table-card-title">Active Admin Accounts ({admins.length})</h6>
              </div>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Admin User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a.id}>
                        <td>#{a.id}</td>
                        <td>
                          <strong>{a.username}</strong>
                          <div className="small text-muted">{a.email}</div>
                        </td>
                        <td><span className="badge bg-danger text-uppercase">{a.role}</span></td>
                        <td><span className="badge bg-success">{a.account_status}</span></td>
                        <td>{a.last_seen ? new Date(a.last_seen).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="table-card p-4">
              <h6 className="fw-bold mb-3">Assign / Update Admin Role</h6>
              <form onSubmit={handleAssignRole}>
                <div className="mb-3">
                  <label className="form-label-admin">User ID</label>
                  <input
                    type="number"
                    className="form-input-admin"
                    placeholder="Enter User ID"
                    value={roleForm.user_id}
                    onChange={(e) => setRoleForm({ ...roleForm, user_id: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label-admin">RBAC Role</label>
                  <select
                    className="form-input-admin"
                    value={roleForm.role}
                    onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}
                  >
                    {(roles.length ? roles : ['super_admin', 'admin', 'moderator', 'finance_admin', 'support_admin', 'analyst']).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="user">Revoke Admin (Standard User)</option>
                  </select>
                </div>
                <button type="submit" className="btn-admin-primary w-100 justify-content-center">
                  Save Role Assignment
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
