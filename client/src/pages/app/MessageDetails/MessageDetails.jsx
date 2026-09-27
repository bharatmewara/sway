import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import RightBar from '../../../components/RightBar';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import useSocket from '../../../hooks/useSocket';
import toast from 'react-hot-toast';
import './MessageDetails.css';

const getFallback = (gender) => (gender === 'female' ? '/img/girl.png' : '/img/profile.jpg');
const getPhoto = (p, gender) => {
  if (!p) return getFallback(gender);
  return p.startsWith('http') || p.startsWith('/') || p.startsWith('data:') ? p : `/${p}`;
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDateGroup = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'TODAY';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

const formatRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
};

export default function MessageDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, updateUser, showInsufficientConnects } = useAuth();
  const { socket } = useSocket();
  const isFemale = (user?.verified_gender || user?.gender) === 'female' || user?.connect_required_for_chat === false;

  const queryType = searchParams.get('type');
  const defaultType =
    queryType === 'private_message' || queryType === 'chat'
      ? queryType
      : location.pathname.startsWith('/chat')
      ? 'chat'
      : 'private_message';

  const [commType, setCommType] = useState(defaultType);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('ACTIVE');
  const [isLocked, setIsLocked] = useState(false);
  const [requiredConnects, setRequiredConnects] = useState(5);
  const [config, setConfig] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [reinitiating, setReinitiating] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (queryType === 'private_message' || queryType === 'chat') {
      setCommType(queryType);
    }
  }, [queryType]);

  const loadData = async (activeType = commType) => {
    if (!userId) return;
    setLoading(true);
    try {
      const [uRes, chatRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/chat/with/${userId}`, { params: { type: activeType } }).catch(() => ({
          data: { messages: [], conversation_id: null },
        })),
      ]);
      setProfile(uRes.data?.user || uRes.data);
      const data = chatRes.data || {};
      setMessages(data.messages || []);
      setConversation(data.conversation || null);
      setSessionStatus(data.session_status || data.conversation?.session_status || 'ACTIVE');
      setIsLocked(!!data.is_locked);
      if (data.required_connects !== undefined) {
        setRequiredConnects(data.required_connects);
      }
      if (data.config) {
        setConfig(data.config);
      }
      if (data.user_connects !== undefined && !isFemale) {
        updateUser({ connect_credits: data.user_connects });
      }
      if (data.conversation_id && !data.is_locked) {
        api.put(`/chat/conversations/${data.conversation_id}/read`).catch(() => {});
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response.data?.message || 'Cannot access this profile.');
        navigate('/home');
      } else {
        toast.error('Failed to load conversation');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(commType);
  }, [userId, commType]);

  // Real-time socket message receiver & online status
  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewMessage = (msg) => {
      const msgType = msg.communication_type || 'chat';
      if (
        (String(msg.sender_id) === String(userId) || String(msg.sender_id) === String(user?.id)) &&
        msgType === commType
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.is_locked || msg.is_blurred) {
          setIsLocked(true);
          if (msg.required_connects) setRequiredConnects(msg.required_connects);
        }
        if (String(msg.sender_id) === String(userId) && msg.conversation_id && !msg.is_locked) {
          api.put(`/chat/conversations/${msg.conversation_id}/read`).catch(() => {});
        }
      }
    };

    const handleOnline = ({ user_id }) => {
      if (String(user_id) === String(userId)) {
        setProfile((prev) => (prev ? { ...prev, is_online: true } : prev));
      }
    };

    const handleOffline = ({ user_id, last_seen }) => {
      if (String(user_id) === String(userId)) {
        setProfile((prev) => (prev ? { ...prev, is_online: false, last_seen: last_seen || prev.last_seen } : prev));
      }
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
  }, [socket, userId, user?.id, commType]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSwitchType = (newType) => {
    setCommType(newType);
    setSearchParams({ type: newType });
  };

  const handleUnlockMessages = async (messageId = null, itemCost = null) => {
    if (unlocking) return;
    const defaultCost =
      commType === 'private_message'
        ? (config?.private_message_access_cost ?? 5)
        : (config?.chat_message_access_cost ?? 5);
    const reqCost = Number(itemCost ?? requiredConnects ?? defaultCost);
    const balance = Number(user?.connect_credits ?? 0);

    if (!isFemale && balance < reqCost) {
      showInsufficientConnects({
        message:
          commType === 'private_message'
            ? 'You do not have enough Connects to view this Private Message.'
            : `You need ${reqCost} Connects to unlock this blurred message.`,
        requiredConnects: reqCost,
        currentConnects: balance,
        returnTo: location.pathname + location.search,
      });
      return;
    }

    setUnlocking(true);
    try {
      const res = await api.post('/chat/unlock', {
        target_user_id: userId,
        conversation_id: conversation?.id || undefined,
        message_id: messageId || undefined,
        communication_type: commType,
      });
      if (res.data?.remaining_credits !== undefined && !isFemale) {
        updateUser({ connect_credits: res.data.remaining_credits });
      }
      setIsLocked(false);
      if (res.data?.messages) {
        setMessages(res.data.messages);
      } else {
        await loadData(commType);
      }
      if (res.data?.conversation) {
        setConversation(res.data.conversation);
        setSessionStatus(res.data.conversation.session_status || 'ACTIVE');
      }
      const charged = res.data?.credits_charged ?? reqCost;
      if (charged > 0) {
        toast.success(`Message unlocked! (${charged} Connects used)`);
      } else {
        toast.success('Message unlocked!');
      }
    } catch (err) {
      if (err.response?.status === 402) {
        showInsufficientConnects({
          message:
            err.response?.data?.message ||
            (commType === 'private_message'
              ? 'You do not have enough Connects to view this Private Message.'
              : `You need ${reqCost} Connects to unlock this message.`),
          requiredConnects: err.response?.data?.required_connects ?? reqCost,
          currentConnects: err.response?.data?.available_connects ?? err.response?.data?.credits ?? user?.connect_credits ?? 0,
          returnTo: location.pathname + location.search,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to unlock message');
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handleReinitiate = async () => {
    if (reinitiating) return;
    setReinitiating(true);
    try {
      const res = await api.post('/chat/reinitiate', {
        target_user_id: userId,
        communication_type: commType,
      });
      if (res.data?.remaining_credits !== undefined && !isFemale) {
        updateUser({ connect_credits: res.data.remaining_credits });
      }
      setSessionStatus('ACTIVE');
      setIsLocked(false);
      await loadData(commType);
      toast.success(
        commType === 'private_message'
          ? 'Private Messages reinitiated for 72 hours!'
          : 'Chat reinitiated!'
      );
    } catch (err) {
      if (err.response?.status === 402) {
        const defaultReinitCost =
          commType === 'private_message'
            ? config?.private_message_reinitiate_cost ?? 10
            : config?.chat_reinitiate_cost ?? 5;
        showInsufficientConnects({
          message: err.response?.data?.message || 'Insufficient Connects to reinitiate this session.',
          requiredConnects: err.response?.data?.required_connects ?? defaultReinitCost,
          currentConnects: err.response?.data?.credits ?? user?.connect_credits ?? 0,
          returnTo: location.pathname + location.search,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to reinitiate session');
      }
    } finally {
      setReinitiating(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    const content = text.trim();
    setText('');
    setSending(true);

    try {
      const res = await api.post('/chat/messages', {
        receiver_id: userId,
        content,
        communication_type: commType,
      });

      const sent = res.data?.message || res.data?.data;
      if (sent) {
        setMessages((prev) => [...prev, sent]);
      }
      if (res.data?.conversation) {
        setConversation(res.data.conversation);
        setSessionStatus(res.data.conversation.session_status || 'ACTIVE');
      }
      if (res.data?.remaining_credits !== undefined && !isFemale) {
        updateUser({ connect_credits: res.data.remaining_credits });
      }
      if (res.data?.credits_charged > 0) {
        toast.success(`Session started! (${res.data.credits_charged} Connects used)`);
      }
    } catch (err) {
      const errCode = err.response?.data?.code;
      if (err.response?.status === 402) {
        const defaultStartCost =
          commType === 'private_message'
            ? config?.private_message_start_cost ?? 10
            : config?.chat_start_cost ?? 5;
        showInsufficientConnects({
          message: err.response.data?.message || 'Insufficient Connects! Please Buy Connects to continue.',
          requiredConnects: err.response.data?.required_connects ?? defaultStartCost,
          currentConnects: err.response.data?.credits ?? user?.connect_credits ?? 0,
          returnTo: location.pathname + location.search,
        });
      } else if (errCode === 'CHAT_EXPIRED' || errCode === 'PRIVATE_MESSAGE_EXPIRED' || errCode === 'SESSION_EXPIRED') {
        setSessionStatus('EXPIRED');
        toast.error(err.response?.data?.message || 'Session has expired. Please reinitiate.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to send message');
      }
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const handleBlockUser = async () => {
    if (!window.confirm(`Are you sure you want to block ${profile?.username || 'this user'}?`)) return;
    try {
      await api.post('/reports/block', { blocked_id: userId });
      toast.success('User blocked.');
      navigate('/home');
    } catch (err) {
      toast.error('Failed to block user');
    }
  };

  // Group messages by date
  const groupedMessages = [];
  let currentDate = null;
  messages.forEach((msg) => {
    const dateKey = formatDateGroup(msg.created_at);
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groupedMessages.push({ isDivider: true, date: dateKey });
    }
    groupedMessages.push(msg);
  });

  const reinitiateCost =
    commType === 'private_message'
      ? config?.private_message_reinitiate_cost ?? 10
      : config?.chat_reinitiate_cost ?? 5;

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          {/* Top bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <Link
                to={commType === 'private_message' ? '/private-chats' : '/chat'}
                className="btn btn-sm btn-light border rounded-pill px-3 py-1"
              >
                <i className="bi bi-arrow-left me-1" />
                {commType === 'private_message' ? 'All Private Messages' : 'All Chats'}
              </Link>
              <h5 className="fw-bold mb-0">
                {commType === 'private_message' ? 'Private Messages' : 'Chat'} with {profile?.username || 'Member'}
              </h5>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Switch between Private Messages (72h) and Chat (1h) */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn rounded-start-pill px-3 ${
                    commType === 'private_message' ? 'btn-wine text-white' : 'btn-outline-secondary'
                  }`}
                  onClick={() => handleSwitchType('private_message')}
                >
                  Private Messages (72h)
                </button>
                <button
                  type="button"
                  className={`btn rounded-end-pill px-3 ${
                    commType === 'chat' ? 'btn-wine text-white' : 'btn-outline-secondary'
                  }`}
                  onClick={() => handleSwitchType('chat')}
                >
                  Chat (1h)
                </button>
              </div>

              {isFemale ? (
                <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2">
                  <i className="bi bi-gift-fill me-1" /> Free (0 Connects)
                </span>
              ) : (
                <Link
                  to={`/purchase-connect?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
                  className="badge bg-primary-subtle text-primary text-decoration-none rounded-pill px-3 py-2"
                >
                  <i className="bi bi-lightning-charge-fill me-1" />
                  Connects: {user?.connect_credits ?? 0} (Buy Connects)
                </Link>
              )}
            </div>
          </div>

          <div className="row g-3 g-lg-4">
            {/* ── LEFT PROFILE CARD ── */}
            <div className="col-12 col-lg-4">
              <div className="profile-card2 text-center">
                <div className="mb-3">
                  <Link to={`/view-profile/${userId}`} className="position-relative d-inline-block text-decoration-none">
                    <img
                      src={getPhoto(profile?.profile_photo, profile?.gender)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallback(profile?.gender);
                      }}
                      className="profile-avatar"
                      alt={profile?.username || 'Member'}
                    />
                    {profile?.is_online && <span className="online-dot" />}
                  </Link>

                  <h4 className="mt-3 fw-bold mb-1">
                    <Link to={`/view-profile/${userId}`} className="text-dark text-decoration-none">
                      {profile?.username || 'Loading...'}
                    </Link>
                  </h4>
                  <div className={profile?.is_online ? 'text-success fw-semibold small' : 'text-muted small'}>
                    ● {profile?.is_online ? 'Online now' : 'Offline'}
                  </div>
                </div>

                <div className="text-start mb-3">
                  {profile?.age && (
                    <div className="mb-2 small text-secondary">
                      <i className="bi bi-person me-2 text-danger" />
                      {profile.age} years old
                    </div>
                  )}
                  {(profile?.city || profile?.state || profile?.country) && (
                    <div className="mb-2 small text-secondary">
                      <i className="bi bi-geo-alt me-2 text-danger" />
                      {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                {/* Permitted Social Links if visible */}
                {(profile?.instagram || profile?.facebook || profile?.telegram || profile?.phone) && (
                  <div className="text-start p-3 rounded-3 bg-light mb-3">
                    <div className="small fw-bold text-uppercase text-muted mb-2">Shared Contact Info</div>
                    {profile.instagram && (
                      <div className="small mb-1">
                        <i className="bi bi-instagram text-danger me-2" />
                        <strong>Instagram:</strong> {profile.instagram}
                      </div>
                    )}
                    {profile.facebook && (
                      <div className="small mb-1">
                        <i className="bi bi-facebook text-primary me-2" />
                        <strong>Facebook:</strong> {profile.facebook}
                      </div>
                    )}
                    {profile.telegram && (
                      <div className="small mb-1">
                        <i className="bi bi-telegram text-info me-2" />
                        <strong>Telegram:</strong> {profile.telegram}
                      </div>
                    )}
                    {profile.phone && (
                      <div className="small">
                        <i className="bi bi-telephone-fill text-success me-2" />
                        <strong>Phone:</strong> {profile.phone}
                      </div>
                    )}
                  </div>
                )}

                <div className="profile-list mb-3 text-start">
                  <div className="item">
                    <span>Marital status</span>
                    <span>{profile?.marital_status || 'Single'}</span>
                  </div>
                  <div className="item">
                    <span>Height</span>
                    <span>{profile?.height ? `${profile.height} cm` : '---'}</span>
                  </div>
                  <div className="item">
                    <span>Occupation</span>
                    <span>{profile?.profession || '---'}</span>
                  </div>
                  <div className="item">
                    <span>Looking for</span>
                    <span>{profile?.relationship_type || profile?.looking_for || '---'}</span>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Link to={`/view-profile/${userId}`} className="btn btn-sm btn-outline-secondary rounded-pill">
                    <i className="bi bi-person-lines-fill me-1" /> View Full Profile
                  </Link>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-custom rounded-pill"
                    onClick={handleBlockUser}
                  >
                    <i className="bi bi-slash-circle me-1 text-danger" />
                    Block User
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT CHAT WRAPPER ── */}
            <div className="col-12 col-lg-8">
              <div className="chat-wrapper">
                {/* Header with Session Timer / Status */}
                <div className="chat-header d-flex flex-wrap justify-content-between align-items-center px-3 py-2 border-bottom">
                  <span className="text-muted small">
                    <i className="bi bi-shield-check text-success me-1" />
                    {commType === 'private_message'
                      ? 'Private Messages (72-Hour Session)'
                      : 'Chat (Expires after 1h of female inactivity)'}
                  </span>

                  {conversation && (
                    <span
                      className={`badge rounded-pill px-3 py-1 ${
                        sessionStatus === 'EXPIRED'
                          ? 'bg-secondary-subtle text-secondary'
                          : 'bg-success-subtle text-success'
                      }`}
                    >
                      {sessionStatus === 'EXPIRED'
                        ? 'EXPIRED'
                        : formatRemaining(conversation.expires_at) || 'ACTIVE'}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="chat-body">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-danger" role="status" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-chat-dots display-4 d-block mb-3 opacity-50" />
                      <p className="mb-1 fw-semibold">
                        {commType === 'private_message'
                          ? 'No Private Messages yet.'
                          : 'No Chat messages yet.'}
                      </p>
                      <small>Send a message below to start connecting!</small>
                    </div>
                  ) : (
                    groupedMessages.map((item, idx) => {
                      if (item.isDivider) {
                        return (
                          <div className="date-divider" key={`divider-${idx}`}>
                            <span>{item.date}</span>
                          </div>
                        );
                      }

                      const isMe = String(item.sender_id) === String(user?.id);
                      const msgLocked =
                        !isFemale &&
                        !isMe &&
                        (item.is_locked ||
                          item.is_blurred ||
                          item.is_unlocked === false ||
                          (commType === 'chat' && isLocked));

                      if (msgLocked) {
                        const defaultAccessCost =
                          commType === 'private_message'
                            ? (config?.private_message_access_cost ?? 5)
                            : (config?.chat_message_access_cost ?? 5);
                        const reqCost = Number(item.required_connects ?? requiredConnects ?? defaultAccessCost);
                        const availableConnects = Number(user?.connect_credits ?? 0);
                        const hasEnough = availableConnects >= reqCost;

                        return (
                          <div className="message-row" key={item.id || idx}>
                            <div
                              className="card border-0 shadow-sm rounded-4 p-4 my-2"
                              style={{
                                maxWidth: 400,
                                background: 'linear-gradient(135deg, #fff5f7 0%, #ffffff 100%)',
                                borderLeft: '4px solid #76000b',
                              }}
                            >
                              <div className="small fw-semibold text-muted mb-1">
                                {profile?.username || 'Female User'}
                              </div>

                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span role="img" aria-label="locked">🔒</span>
                                <h6 className="fw-bold mb-0 text-dark">Message Locked</h6>
                              </div>

                              <p className="small text-secondary mb-3">
                                This message requires <strong>{reqCost} Connects</strong> to view
                              </p>

                              <div
                                className="rounded-3 p-3 mb-3 text-center fw-bold"
                                style={{
                                  backgroundColor: '#f3e8ea',
                                  color: '#76000b',
                                  letterSpacing: '0.8px',
                                  userSelect: 'none',
                                }}
                              >
                                [ LOCKED MESSAGE — UNLOCK TO VIEW ]
                              </div>

                              <div className="d-flex justify-content-between small mb-1">
                                <span className="text-muted">Required:</span>
                                <strong className="text-danger">{reqCost} Connects</strong>
                              </div>
                              <div className="d-flex justify-content-between small mb-3">
                                <span className="text-muted">Available:</span>
                                <strong className={hasEnough ? 'text-success' : 'text-danger'}>
                                  {availableConnects} Connects
                                </strong>
                              </div>

                              {!hasEnough && (
                                <div className="alert alert-warning py-2 px-3 small rounded-3 mb-3">
                                  <div className="fw-bold mb-1">Insufficient Connects</div>
                                  <div>
                                    You do not have enough Connects to view this{' '}
                                    {commType === 'private_message' ? 'Private Message' : 'message'}.
                                  </div>
                                </div>
                              )}

                              <div className="d-flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className="btn btn-wine btn-sm rounded-pill px-3 py-2 fw-semibold flex-grow-1"
                                  onClick={() => handleUnlockMessages(item.id, reqCost)}
                                  disabled={unlocking}
                                >
                                  <i className="bi bi-unlock-fill me-1" />
                                  {unlocking ? 'Unlocking...' : 'View Message'}
                                </button>
                                <Link
                                  to={`/purchase-connect?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
                                  className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-2 fw-semibold flex-grow-1 text-center"
                                >
                                  <i className="bi bi-lightning-charge-fill me-1 text-warning" />
                                  Buy Connects
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className={`message-row ${isMe ? 'right' : ''}`} key={item.id || idx}>
                          <div className={`message ${isMe ? 'message-right' : 'message-left'}`}>
                            {item.content}
                            <span className="message-time">
                              {formatTime(item.created_at)}
                              {isMe && <span className="ms-1">{item.is_read ? '✓✓' : '✓'}</span>}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Footer or Expired Reinitiate Bar */}
                <div className="chat-footer">
                  {sessionStatus === 'EXPIRED' && !isFemale ? (
                    <div className="p-3 rounded-3 bg-light border text-center">
                      <div className="fw-bold text-danger mb-1">
                        <i className="bi bi-hourglass-bottom me-1" />
                        {commType === 'private_message'
                          ? 'Private Message Session Expired (72-Hour Limit Reached)'
                          : 'Chat Expired (No new message from female user for 1 hour)'}
                      </div>
                      <p className="text-muted small mb-2">
                        Reinitiate this {commType === 'private_message' ? 'Private Message session' : 'Chat'} using{' '}
                        <strong>{reinitiateCost} Connects</strong> to continue messaging.
                      </p>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-wine btn-sm rounded-pill px-4 py-2 fw-semibold"
                          onClick={handleReinitiate}
                          disabled={reinitiating}
                        >
                          <i className="bi bi-arrow-repeat me-1" />
                          {reinitiating
                            ? 'Reinitiating...'
                            : commType === 'private_message'
                            ? `Reinitiate Private Messages (${reinitiateCost} Connects)`
                            : `Reinitiate Chat (${reinitiateCost} Connects)`}
                        </button>
                        <Link
                          to={`/purchase-connect?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
                          className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-2"
                        >
                          Buy Connects
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSend}>
                      <div className="row g-2 align-items-center">
                        <div className="col">
                          <div className="message-box">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={
                                commType === 'private_message'
                                  ? 'Type your private message (72h session)...'
                                  : 'Type your chat message...'
                              }
                              value={text}
                              onChange={(e) => setText(e.target.value)}
                              disabled={sending}
                            />
                          </div>
                        </div>
                        <div className="col-auto">
                          <button
                            type="submit"
                            className="send-btn"
                            disabled={!text.trim() || sending}
                          >
                            <i className="bi bi-send me-1" />
                            Send
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-3">
          <RightBar />
        </div>
      </div>
    </DashboardLayout>
  );
}
