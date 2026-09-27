import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import RightBar from '../../../components/RightBar';
import { useAuth } from '../../../context/AuthContext';
import useSocket from '../../../hooks/useSocket';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import './Notifications.css';

const getFallback = (g) => (g === 'female' ? '/img/girl.png' : '/img/boy.png');
const getPhoto = (p, g) =>
  p && (p.startsWith('http') || p.startsWith('/') || p.startsWith('data:'))
    ? p
    : p
    ? `/${p}`
    : getFallback(g);

const timeAgo = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDateBucket = (iso) => {
  if (!iso) return 'Earlier';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return 'Earlier';
};

const getNotificationMeta = (n) => {
  const type = String(n.type || '').toUpperCase();
  const senderId = n.related_user_id || n.sender_id;

  if (type.includes('PRIVATE_PHOTO_REQUEST_APPROVED_PENDING')) {
    return {
      emoji: '🔓',
      icon: 'bi-key-fill',
      label: 'Private Photo Approved',
      actionUrl: senderId ? `/view-profile/${senderId}` : '/requests',
      actionText: 'Unlock Private Photos',
    };
  }
  if (type.includes('PRIVATE_PHOTO_REQUEST_APPROVED')) {
    return {
      emoji: '🔓',
      icon: 'bi-unlock-fill',
      label: 'Private Photo Approved',
      actionUrl: senderId ? `/view-profile/${senderId}` : '/requests',
      actionText: 'Unlock Private Photos',
    };
  }
  if (type.includes('PRIVATE_PHOTO_REQUEST_REJECTED')) {
    return {
      emoji: '❌',
      icon: 'bi-x-circle-fill',
      label: 'Private Photo Rejected',
      actionUrl: senderId ? `/view-profile/${senderId}` : '/requests',
      actionText: 'View Profile',
    };
  }
  if (type.includes('PRIVATE_PHOTO_REQUEST') || type.includes('CONNECTION_REQUEST') || type === 'REQUEST') {
    return {
      emoji: '🔒',
      icon: 'bi-lock-fill',
      label: 'Private Photo Request',
      actionUrl: '/requests',
      actionText: 'View Request',
    };
  }
  if (type.includes('PRIVATE_MESSAGE')) {
    return {
      emoji: '🔐',
      icon: 'bi-envelope-lock-fill',
      label: 'New Private Message',
      actionUrl: senderId ? `/message-details/${senderId}?type=private_message` : '/private-chats',
      actionText: 'Open Private Message',
    };
  }
  if (type.includes('CHAT_MESSAGE') || type === 'MESSAGE' || type.includes('MESSAGE_REQUEST')) {
    return {
      emoji: '💬',
      icon: 'bi-chat-dots-fill',
      label: 'New Chat Message',
      actionUrl: senderId ? `/chat/${senderId}?type=chat` : '/chat',
      actionText: 'Open Chat',
    };
  }
  if (type.includes('CRUSH')) {
    return {
      emoji: '💖',
      icon: 'bi-heart-pulse-fill',
      label: 'Crush Alert',
      actionUrl: senderId ? `/view-profile/${senderId}` : '/crushes',
      actionText: 'View Profile',
    };
  }
  if (type.includes('LIKE')) {
    return {
      emoji: '❤️',
      icon: 'bi-heart-fill',
      label: 'Profile Like',
      actionUrl: senderId ? `/view-profile/${senderId}` : '/home',
      actionText: 'View Profile',
    };
  }
  if (type.includes('VISIT')) {
    return {
      emoji: '👤',
      icon: 'bi-person-fill',
      label: 'Profile Visit',
      actionUrl: senderId ? `/view-profile/${senderId}` : '/visitors',
      actionText: 'View Profile',
    };
  }
  if (type.includes('CONNECT') || type.includes('PURCHASE')) {
    return {
      emoji: '⚡',
      icon: 'bi-lightning-charge-fill',
      label: 'Connects Wallet',
      actionUrl: '/purchase-connect',
      actionText: 'View Connects',
    };
  }
  return {
    emoji: '🔔',
    icon: 'bi-bell-fill',
    label: 'Notification',
    actionUrl: senderId ? `/view-profile/${senderId}` : null,
    actionText: senderId ? 'View Profile' : null,
  };
};

export default function Notifications() {
  const navigate = useNavigate();
  const { fetchCounts } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await api.get('/notifications');
        const list = res.data?.notifications || res.data?.data?.notifications || [];
        setNotifications(Array.isArray(list) ? list : []);
        setError(null);
        fetchCounts?.();
      } catch (err) {
        if (!silent) {
          setError(err.response?.data?.message || 'Unable to load notifications.');
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [fetchCounts]
  );

  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  // Real-time WebSocket updates for new notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      fetchNotifications(true);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('new_message', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('new_message', handleNewNotification);
    };
  }, [socket, fetchNotifications]);

  const markOneRead = async (notification, navigateToUrl = null) => {
    if (!notification.is_read) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
        );
        fetchCounts?.();
      } catch {}
    }
    if (navigateToUrl) {
      navigate(navigateToUrl);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      fetchCounts?.();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  // Group displayed notifications into Today, Yesterday, Earlier
  const grouped = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };
  displayedNotifications.forEach((n) => {
    const bucket = getDateBucket(n.created_at);
    grouped[bucket].push(n);
  });

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          {/* Header */}
          <div className="notif-page-header">
            <div>
              <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="badge bg-danger rounded-pill" style={{ fontSize: 12 }}>
                    {unreadCount} Unread
                  </span>
                )}
              </h4>
              <p className="text-muted small mb-0">
                Real-time activity for Likes, Crushes, Profile Visits, Private Photo Requests, Chat, and Private Messages.
              </p>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`btn rounded-start-pill px-3 ${
                    filter === 'all' ? 'btn-wine text-white' : 'btn-outline-secondary'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`btn rounded-end-pill px-3 ${
                    filter === 'unread' ? 'btn-wine text-white' : 'btn-outline-secondary'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
              >
                <i className="bi bi-check2-all me-1" />
                Mark All as Read
              </button>
            </div>
          </div>

          {/* 1. Loading Skeleton State */}
          {loading ? (
            <div>
              {[1, 2, 3, 4].map((idx) => (
                <div className="notif-skeleton-card" key={idx}>
                  <div className="notif-skeleton-avatar" />
                  <div className="flex-grow-1">
                    <div className="notif-skeleton-line mb-2" style={{ width: '38%' }} />
                    <div className="notif-skeleton-line mb-2" style={{ width: '75%' }} />
                    <div className="notif-skeleton-line" style={{ width: '25%', height: 24, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* 2. Error State */
            <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
              <div className="fs-1 mb-2">⚠️</div>
              <h5 className="fw-bold text-dark mb-2">Unable to load notifications.</h5>
              <p className="text-muted small mb-4">{error}</p>
              <div>
                <button
                  type="button"
                  onClick={() => fetchNotifications(false)}
                  className="btn btn-wine rounded-pill px-4 py-2 fw-semibold"
                >
                  <i className="bi bi-arrow-clockwise me-1" />
                  Try Again
                </button>
              </div>
            </div>
          ) : displayedNotifications.length === 0 ? (
            /* 3. Empty State */
            <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
              <div className="display-5 mb-3">🔔</div>
              <h5 className="fw-bold text-dark mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h5>
              <p className="text-muted small mb-0">
                {filter === 'unread'
                  ? 'You are all caught up! Switch to "All" to view your notification history.'
                  : "You'll see likes, messages, profile visits and other activity here."}
              </p>
            </div>
          ) : (
            /* 4. Grouped Notification Cards (Today / Yesterday / Earlier) */
            <div>
              {['Today', 'Yesterday', 'Earlier'].map((sectionName) => {
                const items = grouped[sectionName];
                if (!items || items.length === 0) return null;

                return (
                  <div className="notif-section-group" key={sectionName}>
                    <div className="notif-section-title">{sectionName}</div>
                    <div className="notif-card-list">
                      {items.map((n) => {
                        const meta = getNotificationMeta(n);
                        const senderId = n.related_user_id || n.sender_id;
                        const senderName = n.sender_nickname || n.sender_username || 'Member';

                        return (
                          <div
                            key={n.id}
                            onClick={() => markOneRead(n, meta.actionUrl)}
                            className={`notif-card ${n.is_read ? 'read' : 'unread'}`}
                          >
                            {/* Avatar + Category Badge */}
                            <div className="notif-avatar-wrap">
                              {senderId ? (
                                <Link
                                  to={`/view-profile/${senderId}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markOneRead(n);
                                  }}
                                >
                                  <img
                                    src={getPhoto(n.sender_photo, n.sender_gender)}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = getFallback(n.sender_gender);
                                    }}
                                    alt={senderName}
                                    className="notif-avatar-img"
                                  />
                                </Link>
                              ) : (
                                <div className="notif-avatar-fallback">
                                  <span>{meta.emoji}</span>
                                </div>
                              )}
                              <span className="notif-cat-badge" title={meta.label}>
                                {meta.emoji}
                              </span>
                            </div>

                            {/* Content + Action Button */}
                            <div className="notif-content">
                              <div className="notif-top-line">
                                <div className="notif-title">
                                  {!n.is_read && (
                                    <span className="notif-unread-dot" title="Unread">
                                      ●
                                    </span>
                                  )}
                                  <span>{meta.emoji}</span>
                                  <span>{n.title || meta.label}</span>
                                </div>
                                <span className="notif-time">{timeAgo(n.created_at)}</span>
                              </div>

                              <div className="notif-body">{n.body || n.content}</div>

                              {meta.actionUrl && (
                                <div className="notif-actions">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markOneRead(n, meta.actionUrl);
                                    }}
                                    className="notif-action-btn"
                                  >
                                    {meta.actionText}
                                  </button>
                                  {senderId && meta.actionUrl !== `/view-profile/${senderId}` && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markOneRead(n, `/view-profile/${senderId}`);
                                      }}
                                      className="notif-action-btn secondary"
                                    >
                                      View Profile
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
