import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useSocket from '../hooks/useSocket'
import api from '../api/axios'
import './RightBar.css'

const getFallback = (gender) => gender === 'female' ? '/img/girl.png' : '/img/boy.png'

const getPhoto = (photo, gender) => {
  if (!photo) return getFallback(gender)
  return photo.startsWith('http') || photo.startsWith('/') || photo.startsWith('data:') ? photo : `/${photo}`
}

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Recently'
  const sec = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (sec < 60)    return 'Just now'
  if (sec < 3600)  return `${Math.floor(sec / 60)} min ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86400)}d ago`
}

export default function RightBar() {
  const { user, setActiveChatUserId } = useAuth()
  const { socket } = useSocket()
  const [chats,    setChats]    = useState([])
  const [requests, setRequests] = useState([])
  const [visitors, setVisitors] = useState([])
  const [loading,  setLoading]  = useState(true)

  const loadSidebarData = useCallback(async () => {
    if (!user) return
    try {
      const [convRes, reqRes, visRes] = await Promise.all([
        api.get('/chat/conversations', { params: { include_expired: 'false' } }).catch(() => ({ data: { conversations: [] } })),
        api.get('/requests').catch(() => ({ data: { requests: [] } })),
        api.get('/visitors').catch(() => ({ data: { visitors: [] } })),
      ])

      const list = convRes.data?.conversations || convRes.data?.data?.conversations || []
      const activeOnly = list.filter((c) => {
        const st = String(c.session_status || 'ACTIVE').toUpperCase()
        if (st !== 'ACTIVE') return false
        if (c.expires_at && new Date(c.expires_at).getTime() <= Date.now()) return false
        return true
      })
      const seen = new Set()
      const unique = []
      for (const c of activeOnly) {
        const uid = String(c.other_user_id)
        if (uid && !seen.has(uid)) {
          seen.add(uid)
          unique.push(c)
        }
      }
      setChats(unique.slice(0, 10))

      const reqList = Array.isArray(reqRes.data?.requests) ? reqRes.data.requests : []
      setRequests(
        reqList
          .filter((r) => String(r.status || 'PENDING').toUpperCase() === 'PENDING')
          .slice(0, 10)
      )

      const visList = Array.isArray(visRes.data?.visitors) ? visRes.data.visitors : []
      setVisitors(visList)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadSidebarData()
  }, [loadSidebarData])

  useEffect(() => {
    if (!socket) return
    const refresh = () => loadSidebarData()
    const handleStatus = ({ userId, user_id, isOnline, is_online, lastSeen, last_seen }) => {
      const statusUserId = userId ?? user_id
      const online = isOnline ?? is_online
      const seenAt = lastSeen ?? last_seen
      setChats((prev) =>
        prev.map((conv) => {
          if (String(conv.other_user_id) === String(statusUserId)) {
            return {
              ...conv,
              other_is_online: online,
              other_last_seen: online ? conv.other_last_seen : (seenAt || conv.other_last_seen),
            }
          }
          return conv
        })
      )
    }

    socket.on('new_message', refresh)
    socket.on('receive_message', refresh)
    socket.on('new_request', refresh)
    socket.on('request_updated', refresh)
    socket.on('online_status', handleStatus)
    socket.on('user_online', ({ user_id }) => handleStatus({ user_id, is_online: true }))
    socket.on('user_offline', ({ user_id, last_seen }) => handleStatus({ user_id, is_online: false, last_seen }))

    return () => {
      socket.off('new_message', refresh)
      socket.off('receive_message', refresh)
      socket.off('new_request', refresh)
      socket.off('request_updated', refresh)
      socket.off('online_status', handleStatus)
      socket.off('user_online')
      socket.off('user_offline')
    }
  }, [socket, loadSidebarData])

  return (
    <>
      {/* Card 1: Active Conversations */}
      <div className="rightbar mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">Active Conversations</h6>
          <Link to="/chat" className="text-danger small text-decoration-none">See All</Link>
        </div>
        <div className="scrool_right">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-danger" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              No active conversations yet.
            </div>
          ) : (
            chats.map((conv) => {
              const isOnline = conv.other_is_online || conv.is_online
              const name = conv.other_username || conv.username || 'Member'
              const photo = conv.other_photo || conv.profile_photo
              const gender = conv.other_gender || conv.gender
              return (
                <Link
                  key={conv.other_user_id || conv.conversation_id || conv.id}
                  to={`/message-details/${conv.other_user_id}?type=${conv.communication_type || 'chat'}`}
                  onClick={() => setActiveChatUserId && setActiveChatUserId(conv.other_user_id)}
                  className="user-row text-decoration-none"
                  style={{ color: 'inherit' }}
                >
                  <div className="avatar">
                    <img
                      src={getPhoto(photo, gender)}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(gender) }}
                      alt={name}
                    />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <b className="d-block text-truncate">{name}</b>
                    <small className="text-truncate">
                      {conv.is_typing ? (
                        <span className="text-danger">Typing...</span>
                      ) : isOnline ? (
                        <><span className="small-dot"></span> Online</>
                      ) : (
                        timeAgo(conv.other_last_seen || conv.last_seen || conv.last_message_at)
                      )}
                    </small>
                  </div>
                  {Number(conv.unread_count) > 0 && (
                    <span className="badge-dot">{conv.unread_count}</span>
                  )}
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Card 2: Chat Requests Conversations */}
      <div className="rightbar mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
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
              No pending requests.
            </div>
          ) : (
            requests.map((req) => {
              const name = req.username || 'Member'
              return (
                <Link
                  key={req.id}
                  to="/requests"
                  className="user-row text-decoration-none"
                  style={{ color: 'inherit' }}
                >
                  <div className="avatar">
                    <img
                      src={getPhoto(req.profile_photo, req.gender)}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(req.gender) }}
                      alt={name}
                    />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <b className="d-block text-truncate">{name}</b>
                    <small className="text-truncate">
                      {req.is_online ? (
                        <><span className="small-dot"></span> Online</>
                      ) : (
                        timeAgo(req.created_at)
                      )}
                    </small>
                  </div>
                  <span className="badge-dot">1</span>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Card 3: Who Viewed You */}
      <div className="rightbar">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">Who Viewed You</h6>
          <Link to="/visitors" className="text-danger small text-decoration-none">See All</Link>
        </div>
        <div className="who-viewed-avatars">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-danger" />
            </div>
          ) : visitors.length === 0 ? (
            <div className="text-center py-2 text-muted small">
              No recent visitors.
            </div>
          ) : (
            <div className="d-flex align-items-center flex-wrap py-1">
              {visitors.slice(0, 4).map((v, i) => (
                <Link
                  key={v.id || v.visitor_id || i}
                  to={`/view-profile/${v.visitor_id || v.id}`}
                  className="profile-img"
                  title={v.username || 'Visitor'}
                >
                  <img
                    src={getPhoto(v.profile_photo, v.gender)}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(v.gender) }}
                    alt={v.username || ''}
                  />
                </Link>
              ))}
              {visitors.length > 4 && (
                <Link
                  to="/visitors"
                  className="profile-img profile-img-more"
                >
                  +{visitors.length - 4}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
