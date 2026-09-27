import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({
    target: 'all',
    user_id: '',
    city: '',
    title: '',
    body: '',
    type: 'admin_broadcast',
  });
  const [sending, setSending] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get('/admin/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      toast.error('Failed to load notifications history');
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and message body are required');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/admin/notifications', form);
      toast.success(res.data.message || 'Notification sent');
      setForm({ ...form, title: '', body: '' });
      loadNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h4>Broadcast & Targeted Notifications</h4>
          <div className="breadcrumb-text">
            Send in-app system announcements to All Users, Verified Female/Male segments, Cities, or individual users.
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="table-card p-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-megaphone me-2 text-danger" />
              Send New Notification
            </h6>
            <form onSubmit={handleSend}>
              <div className="mb-3">
                <label className="form-label-admin">Audience Target</label>
                <select
                  className="form-input-admin"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                >
                  <option value="all">All Active Users</option>
                  <option value="female">Verified Female Users Only</option>
                  <option value="male">Verified Male Users Only</option>
                  <option value="verified">All Verified Users</option>
                  <option value="city">Specific City</option>
                  <option value="user">Specific User ID</option>
                </select>
              </div>
              {form.target === 'city' && (
                <div className="mb-3">
                  <label className="form-label-admin">Target City</label>
                  <input
                    className="form-input-admin"
                    placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
              )}
              {form.target === 'user' && (
                <div className="mb-3">
                  <label className="form-label-admin">Target User ID</label>
                  <input
                    type="number"
                    className="form-input-admin"
                    placeholder="Enter User ID"
                    value={form.user_id}
                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label-admin">Notification Title</label>
                <input
                  className="form-input-admin"
                  placeholder="e.g. Special Weekend Connect Offer!"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label-admin">Message Body</label>
                <textarea
                  className="form-input-admin"
                  rows={4}
                  placeholder="Write notification message..."
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-admin-primary w-100 justify-content-center" disabled={sending}>
                {sending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send" />}
                Send Notification
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="table-card">
            <div className="table-card-header">
              <h6 className="table-card-title">Recent Platform Notifications ({notifications.length})</h6>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Type</th>
                    <th>Title & Body</th>
                    <th>Read</th>
                    <th>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id}>
                      <td>{n.username || `User #${n.user_id}`}</td>
                      <td><span className="badge bg-secondary">{n.type}</span></td>
                      <td>
                        <div className="fw-semibold">{n.title}</div>
                        <small className="text-muted">{n.body}</small>
                      </td>
                      <td>{n.is_read ? 'Yes' : 'Unread'}</td>
                      <td>{new Date(n.created_at).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {notifications.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-4">No notifications recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
