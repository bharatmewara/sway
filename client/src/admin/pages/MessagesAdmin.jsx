import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function MessagesAdmin() {
  const navigate = useNavigate();
  const [commType, setCommType] = useState('CHAT');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/chats', {
        params: {
          communication_type: commType,
          session_status: statusFilter,
          search,
        },
      });
      setConversations(res.data.conversations || []);
    } catch (err) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [commType, statusFilter, search]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const viewTranscript = async (conv) => {
    setSelectedConv(conv);
    try {
      const res = await api.get(`/admin/conversations/${conv.id}/messages`);
      setTranscript(res.data.messages || []);
    } catch (err) {
      toast.error('Failed to load transcript');
      setTranscript([]);
    }
  };

  const handleModerate = async (convId, action, extendMinutes = 60) => {
    try {
      await api.put(`/admin/conversations/${convId}/status`, {
        action,
        extend_minutes: extendMinutes,
        reason: `Admin ${action} action`,
      });
      toast.success(`Conversation #${convId} ${action}d`);
      loadConversations();
      if (selectedConv?.id === convId) setSelectedConv(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div>
      <div className="page-header flex-wrap gap-2">
        <div>
          <h4>Chats & Private Messages Control</h4>
          <div className="breadcrumb-text">
            Monitor active & expired sessions, Connect deductions, and moderate conversations.
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className={commType === 'CHAT' ? 'btn-admin-primary' : 'btn-admin-outline'}
            onClick={() => setCommType('CHAT')}
          >
            <i className="bi bi-chat-dots" /> Live Chats
          </button>
          <button
            className={commType === 'PRIVATE_MESSAGE' ? 'btn-admin-primary' : 'btn-admin-outline'}
            onClick={() => setCommType('PRIVATE_MESSAGE')}
          >
            <i className="bi bi-envelope-paper-heart" /> Private Messages
          </button>
          <button
            className={commType === 'ALL' ? 'btn-admin-primary' : 'btn-admin-outline'}
            onClick={() => setCommType('ALL')}
          >
            All Threads
          </button>
        </div>
      </div>

      <div className="table-card p-3 mb-4 d-flex flex-wrap gap-2">
        <input
          className="search-input"
          placeholder="Search participant username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 240px' }}
        />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Session Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="EXPIRED">EXPIRED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <button className="btn-admin-outline" onClick={loadConversations}>
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      </div>

      <div className="table-card table-responsive">
        <table className="table mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Participants</th>
              <th>Status</th>
              <th>Messages</th>
              <th>Connects Spent</th>
              <th>Expires At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.id}>
                <td>#{c.id}</td>
                <td>
                  <span className={`badge bg-${c.communication_type === 'PRIVATE_MESSAGE' ? 'primary' : 'dark'}`}>
                    {c.communication_type || 'CHAT'}
                  </span>
                </td>
                <td>
                  <div>
                    <span
                      style={{ cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => navigate(`/admin/users/${c.user1_id}`)}
                    >
                      {c.user1_username} ({c.user1_gender})
                    </span>
                    {' ↔ '}
                    <span
                      style={{ cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => navigate(`/admin/users/${c.user2_id}`)}
                    >
                      {c.user2_username} ({c.user2_gender})
                    </span>
                  </div>
                  {c.last_message_content && (
                    <small className="text-muted d-block text-truncate" style={{ maxWidth: 260 }}>
                      &ldquo;{c.last_message_content}&rdquo;
                    </small>
                  )}
                </td>
                <td>
                  <span
                    className={`badge bg-${
                      c.session_status === 'ACTIVE'
                        ? 'success'
                        : c.session_status === 'EXPIRED'
                        ? 'warning text-dark'
                        : 'secondary'
                    }`}
                  >
                    {c.session_status || 'ACTIVE'}
                  </span>
                </td>
                <td>{c.message_count || 0}</td>
                <td className="fw-bold" style={{ color: '#6a1b9a' }}>
                  {c.connects_spent || 0} Connects
                </td>
                <td>{c.expires_at ? new Date(c.expires_at).toLocaleString('en-IN') : 'No Expiry'}</td>
                <td>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-dark" onClick={() => viewTranscript(c)}>
                      Transcript
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleModerate(c.id, 'extend', 60)}
                      title="Extend by 60 mins"
                    >
                      +60m
                    </button>
                    {c.session_status === 'ACTIVE' && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleModerate(c.id, 'expire')}
                      >
                        Expire
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && conversations.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  No conversations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Transcript Modal */}
      {selectedConv && (
        <div className="modal-overlay" onClick={() => setSelectedConv(null)}>
          <div className="modal-box" style={{ maxWidth: 650 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                Conversation #{selectedConv.id}: {selectedConv.user1_username} ↔ {selectedConv.user2_username}
              </h5>
              <button className="modal-close-btn" onClick={() => setSelectedConv(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div
              className="border rounded-3 p-3 mb-3 bg-light"
              style={{ maxHeight: 360, overflowY: 'auto' }}
            >
              {transcript.map((m) => (
                <div key={m.id} className="mb-2 p-2 bg-white rounded border-bottom">
                  <div className="d-flex justify-content-between small">
                    <strong>{m.sender_username} ({m.sender_gender})</strong>
                    <span className="text-muted">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div className="mt-1">{m.content}</div>
                </div>
              ))}
              {transcript.length === 0 && (
                <div className="text-muted text-center py-4">No messages in this thread.</div>
              )}
            </div>
            <div className="d-flex justify-content-between">
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-success" onClick={() => handleModerate(selectedConv.id, 'extend', 120)}>
                  Extend +2 Hours
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleModerate(selectedConv.id, 'expire')}>
                  Force Expire Session
                </button>
              </div>
              <button className="btn-admin-outline" onClick={() => setSelectedConv(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
