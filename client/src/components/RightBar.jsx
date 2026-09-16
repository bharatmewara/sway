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

  useEffect(() => {
    fetchData()
  }, [])

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
          <h6 className="fw-bold">Active Conversations</h6>
          <Link to="/chats" className="text-danger small text-decoration-none">See All</Link>
        </div>
        <div className="scrool_right">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-danger" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-muted small text-center py-3">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <Link
                key={conv.conversation_id}
                to={`/chats/${conv.other_user_id}`}
                className="user-row text-decoration-none"
                style={{ color: 'inherit' }}
              >
                <div className="avatar">
                  {getAvatar(conv.other_photo) ? (
                    <img src={getAvatar(conv.other_photo)} alt={conv.other_username} />
                  ) : <div className="placeholder-avatar"></div>}
                </div>
                <div className="flex-grow-1">
                  <b>{conv.other_username || 'Unknown'}</b>
                  <br />
                  <small>
                    {conv.other_is_online ? (
                      <><span className="small-dot bg-success"></span> Online</>
                    ) : (
                      timeAgo(conv.other_last_seen || conv.last_message_at || conv.conversation_created_at)
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
          <h6 className="fw-bold">Chat Requests</h6>
          <Link to="/requests" className="text-danger small text-decoration-none">See All</Link>
        </div>
        <div className="scrool_right">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-danger" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-muted small text-center py-3">No requests</p>
          ) : (
            requests.map((req) => (
              <Link
                key={req.id}
                to={`/view-profile/${req.sender_id}`}
                className="user-row text-decoration-none"
                style={{ color: 'inherit' }}
              >
                <div className="avatar">
                  {getAvatar(req.profile_photo) ? (
                    <img src={getAvatar(req.profile_photo)} alt={req.username} />
                  ) : <div className="placeholder-avatar"></div>}
                </div>
                <div className="flex-grow-1">
                  <b>{req.username || 'Unknown'}</b>
                  <br />
                  <small>{timeAgo(req.created_at)}</small>
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
          <h6 className="fw-bold">Who Viewed You</h6>
          <Link to="/visitors" className="text-danger small text-decoration-none">See All</Link>
        </div>
        <div>
          {loading ? (
             <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-danger" />
             </div>
          ) : visitors.length === 0 ? (
             <p className="text-muted small text-center py-3">No visitors yet</p>
          ) : (
            visitors.slice(0, 4).map((v, i) => (
              <Link
                key={v.visitor_id || i}
                to={`/view-profile/${v.visitor_id}`}
                className="profile-img"
                style={{ textDecoration: 'none', display: 'inline-block', marginRight: '5px' }}
              >
                {getAvatar(v.profile_photo) ? (
                  <img
                    src={getAvatar(v.profile_photo)}
                    alt={v.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : <div className="placeholder-avatar" style={{width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#eee'}}></div>}
              </Link>
            ))
          )}
          {visitors.length > 4 && (
            <span className="profile-img bg-light text-dark text-center" style={{ lineHeight: '46px', fontSize: 12 }}>
              +{visitors.length - 4}
            </span>
          )}
        </div>
      </div>
    </>
  )
}
