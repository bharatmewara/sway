import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import RightBar from '../../../components/RightBar';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import useSocket from '../../../hooks/useSocket';
import toast from 'react-hot-toast';
import './PrivateChats.css';

const getFallback = (gender) => (gender === 'female' ? '/img/girl.png' : '/img/profile.jpg');
const getPhoto = (p, gender) => {
  if (!p) return getFallback(gender);
  return p.startsWith('http') || p.startsWith('/') || p.startsWith('data:') ? p : `/${p}`;
};

const timeAgo = (dateStr, isOnline) => {
  if (isOnline) return 'Online now';
  if (!dateStr) return 'Recently';
  const sec = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  return `${Math.floor(sec / 86400)} days ago`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatRemainingTime = (expiresAt) => {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
};

export default function PrivateChats() {
  const { user, updateUser, showInsufficientConnects } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const isFemale = (user?.verified_gender || user?.gender) === 'female' || user?.connect_required_for_chat === false;

  // Determine default tab from URL path (/chat vs /private-chats)
  const initialType = location.pathname === '/chat' || location.pathname === '/chats' ? 'chat' : 'private_message';
  const [commType, setCommType] = useState(initialType);
  const [showExpired, setShowExpired] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatConfig, setChatConfig] = useState(null);
  const [reinitiatingId, setReinitiatingId] = useState(null);

  useEffect(() => {
    if (location.pathname === '/chat') {
      setCommType('chat');
    } else if (location.pathname === '/private-chats') {
      setCommType('private_message');
    }
  }, [location.pathname]);

  useEffect(() => {
    api.get('/chat/config')
      .then((res) => setChatConfig(res.data?.config || null))
      .catch(() => {});
  }, []);

  const fetchConversations = async (type = commType, includeExp = showExpired) => {
    setLoading(true);
    try {
      const res = await api.get('/chat/conversations', {
        params: {
          type,
          include_expired: includeExp ? 'true' : 'false',
        },
      });
      const list = res.data?.conversations || res.data?.data?.conversations || [];
      const seen = new Set();
      const deduped = [];
      for (const c of list) {
        const uid = String(c.other_user_id);
        if (uid && !seen.has(uid)) {
          seen.add(uid);
          deduped.push(c);
        }
      }
      setConversations(deduped);
    } catch (e) {
      console.error(e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(commType, showExpired);
  }, [commType, showExpired]);

  // Socket real-time updates for conversation list
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      fetchConversations(commType, showExpired);
    };

    const handleOnline = ({ user_id }) => {
      setConversations((prev) =>
        prev.map((c) =>
          String(c.other_user_id) === String(user_id)
            ? { ...c, other_is_online: true, is_online: true }
            : c
        )
      );
    };

    const handleOffline = ({ user_id, last_seen }) => {
      setConversations((prev) =>
        prev.map((c) =>
          String(c.other_user_id) === String(user_id)
            ? { ...c, other_is_online: false, is_online: false, other_last_seen: last_seen || c.other_last_seen }
            : c
        )
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('receive_message', handleNewMessage);
    socket.on('user_online', handleOnline);
    socket.on('user_offline', handleOffline);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('receive_message', handleNewMessage);
      socket.off('user_online', handleOnline);
      socket.off('user_offline', handleOffline);
    };
  }, [socket, user?.id, commType, showExpired]);

  const handleDelete = async (e, convId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await api.delete(`/chat/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleReinitiate = async (e, c) => {
    e.preventDefault();
    e.stopPropagation();
    setReinitiatingId(c.id);
    try {
      const res = await api.post('/chat/reinitiate', {
        target_user_id: c.other_user_id,
        communication_type: c.communication_type || commType,
      });
      if (res.data?.remaining_credits !== undefined && !isFemale) {
        updateUser({ connect_credits: res.data.remaining_credits });
      }
      toast.success(
        c.communication_type === 'private_message'
          ? 'Private Messages reinitiated for 72 hours!'
          : 'Chat session reinitiated!'
      );
      navigate(`/message-details/${c.other_user_id}?type=${c.communication_type || commType}`);
    } catch (err) {
      if (err.response?.status === 402) {
        const typeLabel = c.communication_type || commType;
        const defaultReinitCost =
          typeLabel === 'private_message'
            ? chatConfig?.private_message_reinitiate_cost ?? 10
            : chatConfig?.chat_reinitiate_cost ?? 5;
        showInsufficientConnects({
          message: err.response?.data?.message || 'Insufficient Connects to reinitiate this conversation.',
          requiredConnects: err.response?.data?.required_connects ?? defaultReinitCost,
          currentConnects: err.response?.data?.credits ?? user?.connect_credits ?? 0,
          returnTo: location.pathname,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to reinitiate conversation');
      }
    } finally {
      setReinitiatingId(null);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!showExpired) {
      const st = String(c.session_status || 'ACTIVE').toUpperCase();
      if (st !== 'ACTIVE') return false;
      if (c.expires_at && new Date(c.expires_at).getTime() <= Date.now()) return false;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          {/* Header & Communication System Switcher */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h4 className="fw-bold mb-1">
                {commType === 'private_message' ? 'Private Messages (72-Hour Sessions)' : 'Chat (Real-Time Conversations)'}
              </h4>
              <p className="text-muted small mb-0">
                {commType === 'private_message'
                  ? 'Active Private Message sessions remain open for 72 hours before expiring.'
                  : 'Chat expires after 1 hour if there is no new reply from the female member.'}
              </p>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 ${showExpired ? 'btn-wine text-white' : 'btn-outline-secondary'}`}
                onClick={() => setShowExpired((prev) => !prev)}
              >
                <i className="bi bi-clock-history me-1" />
                {showExpired ? 'Showing All (Including Expired)' : 'Show Expired Sessions'}
              </button>
            </div>
          </div>

          {/* System Tabs */}
          <div className="d-flex gap-2 mb-4">
            <button
              type="button"
              className={`btn rounded-pill px-4 py-2 fw-semibold ${
                commType === 'private_message' ? 'btn-wine text-white' : 'btn-light border'
              }`}
              onClick={() => setCommType('private_message')}
            >
              <i className="bi bi-envelope-paper-heart me-2" />
              Private Messages (72h)
            </button>
            <button
              type="button"
              className={`btn rounded-pill px-4 py-2 fw-semibold ${
                commType === 'chat' ? 'btn-wine text-white' : 'btn-light border'
              }`}
              onClick={() => setCommType('chat')}
            >
              <i className="bi bi-chat-dots me-2" />
              Chat (1h)
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
              <i className="bi bi-chat-heart display-3 d-block mb-3 text-danger opacity-50" />
              <h5 className="fw-bold">
                {commType === 'private_message' ? 'No Active Private Messages Yet' : 'No Active Chats Yet'}
              </h5>
              <p className="small mb-4">
                {commType === 'private_message'
                  ? 'Start a 72-hour Private Message session from any member profile!'
                  : 'Start a real-time Chat from any member profile!'}
              </p>
              <Link to="/home" className="btn btn-wine mx-auto rounded-pill px-4">
                Explore Members
              </Link>
            </div>
          ) : (
            <div className="row g-2 g-md-3">
              {filteredConversations.map((c) => {
                const isOnline = c.other_is_online ?? c.is_online;
                const otherName = c.other_username || c.username || 'Member';
                const photo = getPhoto(c.other_photo || c.profile_photo, c.other_gender);
                const isMe = c.last_sender_id === user?.id;
                const isExpired = c.session_status === 'EXPIRED';
                const isLocked = !isFemale && (c.is_locked || c.is_blurred);
                const remainingLabel = formatRemainingTime(c.expires_at);

                return (
                  <div className="col-12 col-sm-6 col-lg-4" key={c.id}>
                    <div className="card border-0 shadow-sm conversation-card mb-3 position-relative h-100">
                      <button
                        className="trash-btn"
                        onClick={(e) => handleDelete(e, c.id)}
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <i className="bi bi-trash-fill" />
                      </button>

                      <Link
                        to={`/message-details/${c.other_user_id}?type=${c.communication_type || commType}`}
                        className="card-body p-3 p-md-4 text-center text-decoration-none text-dark d-flex flex-column justify-content-between h-100"
                      >
                        <div className="mb-2">
                          <img
                            src={photo}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getFallback(c.other_gender);
                            }}
                            className="profile-img-private-chat"
                            alt={otherName}
                          />
                          <div className="mt-3">
                            <h5 className="mb-1 fw-bold d-flex align-items-center justify-content-center gap-1 text-truncate">
                              <span className="text-truncate">{otherName}</span>
                              {isOnline && <span className="status-dot flex-shrink-0" />}
                              {c.unread_count > 0 && <span className="unread-badge">{c.unread_count}</span>}
                            </h5>

                            <small className="text-muted d-block text-truncate mb-1">
                              Last active: <span className="fw-semibold">{timeAgo(c.other_last_seen || c.last_seen, isOnline)}</span>
                            </small>

                            {/* Session Status Badge */}
                            {isExpired ? (
                              <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1 small">
                                <i className="bi bi-hourglass-bottom me-1" /> Session Expired
                              </span>
                            ) : remainingLabel ? (
                              <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 small">
                                <i className="bi bi-clock me-1" /> {remainingLabel}
                              </span>
                            ) : (
                              <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 small">
                                Active Session
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 mt-2">
                            {isLocked ? (
                              <span className="badge bg-warning-subtle text-dark border border-warning rounded-pill px-3 py-2 w-100 text-truncate">
                                <i className="bi bi-lock-fill me-1 text-danger" />
                                {(c.communication_type || commType) === 'private_message'
                                  ? `Message Locked (${c.required_connects || chatConfig?.private_message_access_cost || 5} Connects to View)`
                                  : '[ BLURRED MESSAGE — Tap to Unlock ]'}
                              </span>
                            ) : (
                              <span className="message-bubble" title={c.last_message || ''}>
                                {isMe ? <strong>You:</strong> : <strong>{otherName}:</strong>}
                                {c.last_message ? ` "${c.last_message}"` : ' "Started a conversation"'}
                              </span>
                            )}
                          </div>

                          {isExpired && !isFemale ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-wine w-100 rounded-pill mt-1"
                              onClick={(e) => handleReinitiate(e, c)}
                              disabled={reinitiatingId === c.id}
                            >
                              <i className="bi bi-arrow-repeat me-1" />
                              {reinitiatingId === c.id ? 'Reinitiating...' : 'Reinitiate Session'}
                            </button>
                          ) : (
                            <div className="d-inline-flex gap-2 text-muted small">
                              <span className="fw-bold text-dark">{formatDate(c.message_time || c.last_message_at)}</span>
                              <span>{formatTime(c.message_time || c.last_message_at)}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-12 col-xl-3">
          <RightBar />
        </div>
      </div>
    </DashboardLayout>
  );
}
