import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useSocket from '../hooks/useSocket'

export default function RightBar() {
  const [conversations, setConversations] = useState([])
  const [requests, setRequests] = useState([])
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  const fetchData = async () => {
    try {
      const [convRes, reqRes, visRes] = await Promise.all([
        api.get('/messages/conversations').catch(() => ({ data: { conversations: [] } })),
        api.get('/requests').catch(() => ({ data: { requests: [] } })),
        api.get('/visitors').catch(() => ({ data: { visitors: [] } })),
      ])
      
      setConversations(Array.isArray(convRes.data?.conversations) ? convRes.data.conversations.slice(0, 5) : [])
      setRequests(Array.isArray(reqRes.data?.requests) ? reqRes.data.requests.slice(0, 5) : [])
      setVisitors(Array.isArray(visRes.data?.visitors) ? visRes.data.visitors.slice(0, 5) : [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getAvatar = (photo) =>
    photo ? `http://localhost:5000${photo}` : null

  useEffect(() => {
    if (!socket) return;
    const handleStatus = ({ userId, user_id, isOnline, is_online, lastSeen, last_seen }) => {
      const statusUserId = userId ?? user_id
      const online = isOnline ?? is_online
      const seenAt = lastSeen ?? last_seen
      setConversations(prev => prev.map(conv => {
        if (String(conv.other_user_id) === String(statusUserId)) {
          return { ...conv, other_is_online: online, other_last_seen: online ? conv.other_last_seen : seenAt }
        }
        return conv
      }))
    }
    socket.on('online_status', handleStatus)
    socket.on('user_online', ({ user_id }) => handleStatus({ user_id, is_online: true }))
    socket.on('user_offline', ({ user_id, last_seen }) => handleStatus({ user_id, is_online: false, last_seen }))
    return () => {
      socket.off('online_status', handleStatus)
      socket.off('user_online')
      socket.off('user_offline')
    }
  }, [socket])

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <>
      {/* Active Conversations */}
      <div className="rightbar mb-4">
        <div className="d-flex justify-content-between mb-2">
          <h6 className="fw-bold mb-0">Active Conversations</h6>
          <Link to="/chats" className="text-danger small text-decoration-none">See All</Link>
        </div>
        <div className="scrool_right">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-danger" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              <i className="bi bi-chat-dots fs-3 d-block mb-1 opacity-50"></i>
              No active chats yet.
              <br />
              <Link to="/members" className="text-danger text-decoration-none fw-semibold">Start chatting</Link>
            </div>
          ) : (
            conversations.map((conv) => (
              <Link
                key={conv.conversation_id || conv.id}
                to={`/chats/${conv.other_user_id}`}
                className="user-row text-decoration-none"
                style={{ color: 'inherit' }}
              >
                <div className="avatar">
                  <img
                    src={conv.other_photo?.startsWith('http') || conv.other_photo?.startsWith('/') ? conv.other_photo : (getAvatar(conv.other_photo) || '/img/profile-man.png')}
                    alt={conv.other_username || conv.username}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
                <div className="flex-grow-1">
                  <b>{conv.other_username || conv.username || 'Member'}</b>
                  <br />
                  <small>
                    {conv.is_typing ? (
                      <span className="text-danger">Typing...</span>
                    ) : conv.other_is_online || conv.is_online ? (
                      <><span className="small-dot"></span> Online</>
                    ) : (
                      timeAgo(conv.other_last_seen || conv.last_seen || conv.last_message_at) || 'Active'
                    )}
                  </small>
                </div>
                {conv.unread_count > 0 && (
                  <span className="badge-dot">{conv.unread_count}</span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Chat Requests */}
      <div className="rightbar mb-4">
        <div className="d-flex justify-content-between mb-2">
          <h6 className="fw-bold mb-0">Chat Requests Conversations</h6>
          <Link to="/requests" className="text-danger small text-decoration-none">See All</Link>
        </div>
        <div className="scrool_right">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-danger" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              <i className="bi bi-person-heart fs-3 d-block mb-1 opacity-50"></i>
              No pending chat requests.
            </div>
          ) : (
            requests.map((req) => (
              <Link
                key={req.id}
                to={`/view-profile/${req.sender_id}`}
                className="user-row text-decoration-none"
                style={{ color: 'inherit' }}
              >
                <div className="avatar">
                  <img
                    src={req.profile_photo?.startsWith('http') || req.profile_photo?.startsWith('/') ? req.profile_photo : (getAvatar(req.profile_photo) || '/img/girl.png')}
                    alt={req.username}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
                <div className="flex-grow-1">
                  <b>{req.username || 'Member'}</b>
                  <br />
                  <small>
                    {req.is_online ? (
                      <><span className="small-dot"></span> Online</>
                    ) : (
                      timeAgo(req.created_at) || 'Recent'
                    )}
                  </small>
                </div>
                <span className="badge-dot">!</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Who Viewed You */}
      <div className="rightbar">
        <div className="d-flex justify-content-between mb-3">
          <h6 className="fw-bold mb-0">Who Viewed You</h6>
          <Link to="/visitors" className="text-danger small text-decoration-none">See All</Link>
        </div>
        <div>
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-danger" />
            </div>
          ) : visitors.length === 0 ? (
            <div className="text-center py-3 text-muted small">
              No recent visitors.
            </div>
          ) : (
            <>
              {visitors.slice(0, 4).map((v, i) => (
                <Link
                  key={v.id || v.visitor_id || i}
                  to={`/view-profile/${v.visitor_id}`}
                  className="profile-img"
                  style={{ textDecoration: 'none', display: 'inline-block', overflow: 'hidden' }}
                >
                  <img
                    src={v.profile_photo?.startsWith('http') || v.profile_photo?.startsWith('/') ? v.profile_photo : (getAvatar(v.profile_photo) || '/img/girl.png')}
                    alt={v.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                </Link>
              ))}
              {visitors.length > 4 && (
                <Link
                  to="/visitors"
                  className="profile-img bg-light text-dark text-center text-decoration-none fw-semibold"
                  style={{ lineHeight: '40px', fontSize: 13 }}
                >
                  +{visitors.length - 4}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
