import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import useSocket from '../hooks/useSocket'

const getAvatar = (photo) => photo ? `http://localhost:5000${photo}` : null

const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  return `${Math.floor(diff / 86400)} days ago`
}

const formatDate = (dateStr) => {
  if (!dateStr) return { date: '', time: '' }
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('en-GB')
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

export default function Visitors() {
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const { socket } = useSocket()

  const fetchVisitors = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get(`/visitors?page=${p}&limit=12`)
      setVisitors(res.data.visitors || [])
      setPages(res.data.pages || 1)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVisitors(page) }, [page])

  useEffect(() => {
    if (!socket) return
    const handler = ({ user_id, userId, is_online, isOnline, last_seen }) => {
      const uid = user_id ?? userId
      const online = is_online ?? isOnline
      setVisitors(prev => prev.map(v =>
        String(v.visitor_id) === String(uid)
          ? { ...v, is_online: online, last_seen: online ? v.last_seen : last_seen }
          : v
      ))
    }
    socket.on('online_status', handler)
    socket.on('user_online', ({ user_id }) => handler({ user_id, is_online: true }))
    socket.on('user_offline', ({ user_id, last_seen }) => handler({ user_id, is_online: false, last_seen }))
    return () => {
      socket.off('online_status', handler)
      socket.off('user_online')
      socket.off('user_offline')
    }
  }, [socket])

  const handleDelete = async (visitorId) => {
    setVisitors(prev => prev.filter(v => v.visitor_id !== visitorId))
    await api.delete(`/visitors/${visitorId}`).catch(() => {})
  }

  return (
    <DashboardLayout>
      <h4 className="fw-bold mb-3">Visitors</h4>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" />
        </div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-5 text-muted">No visitors yet</div>
      ) : (
        <>
          <div className="row">
            {visitors.map((v) => {
              const { date, time } = formatDate(v.last_visited_at)
              const avatar = getAvatar(v.profile_photo)
              return (
                <div key={v.visitor_id} className="col-12 col-lg-4">
                  <div className="card border-0 shadow-sm conversation-card mb-3 position-relative">
                    <button
                      className="trash-btn mb-2"
                      onClick={() => handleDelete(v.visitor_id)}
                      title="Remove visitor"
                    >
                      <i className="bi bi-trash-fill"></i>
                    </button>
                    <Link to={`/view-profile/${v.visitor_id}`} className="card-body p-4 text-center text-decoration-none text-dark">
                      <div>
                        {avatar ? (
                          <img src={avatar} className="profile-img-private-chat" alt={v.username} />
                        ) : (
                          <div className="profile-img-private-chat bg-secondary d-flex align-items-center justify-content-center rounded-circle mx-auto">
                            <i className="bi bi-person-fill text-white fs-3"></i>
                          </div>
                        )}
                        <div className="mt-3">
                          <h5 className="mb-1 fw-bold">
                            {v.username}
                            {v.is_online && <span className="status-dot ms-1"></span>}
                          </h5>
                          <small className="text-muted">
                            Last active: <span className="fw-semibold">
                              {v.is_online ? 'Online now' : timeAgo(v.last_seen || v.last_visited_at)}
                            </span>
                          </small>
                        </div>
                      </div>
                      <div className="d-inline-flex gap-2 mt-3">
                        <div className="fw-bold">{date}</div>
                        <div className="text-muted mb-2">{time}</div>
                      </div>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {pages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-2">
              <button
                className="btn btn-sm btn-outline-danger"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <span className="align-self-center small">Page {page} of {pages}</span>
              <button
                className="btn btn-sm btn-outline-danger"
                disabled={page === pages}
                onClick={() => setPage(p => p + 1)}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
