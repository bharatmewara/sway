import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../components/DashboardLayout'
import api from '../../../api/axios'
import useSocket from '../../../hooks/useSocket'
import './Visitors.css'

const getFallback = () => '/img/profile.jpg'
const getPhoto = (p) => p && (p.startsWith('http') || p.startsWith('/') || p.startsWith('data:')) ? p : p ? `/${p}` : null
const timeAgo = (d) => {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
const fmtDate = (d) => {
  if (!d) return { date: '', time: '' }
  const dt = new Date(d)
  return { date: dt.toLocaleDateString('en-GB'), time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
}

export default function Visitors() {
  const [visitors, setVisitors] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [pages,    setPages]    = useState(1)
  const { socket } = useSocket()

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/visitors', { params: { page: p, limit: 12 } })
      setVisitors(res.data?.visitors || [])
      setPages(res.data?.pages || 1)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  useEffect(() => {
    if (!socket) return
    const handler = ({ user_id, userId, is_online, isOnline, last_seen }) => {
      const uid = String(user_id ?? userId)
      const online = is_online ?? isOnline
      setVisitors(p => p.map(v => String(v.visitor_id) === uid ? { ...v, is_online: online, last_seen: online ? v.last_seen : last_seen } : v))
    }
    socket.on('online_status', handler)
    socket.on('user_online',  ({ user_id }) => handler({ user_id, is_online: true }))
    socket.on('user_offline', ({ user_id, last_seen }) => handler({ user_id, is_online: false, last_seen }))
    return () => { socket.off('online_status', handler); socket.off('user_online'); socket.off('user_offline') }
  }, [socket])

  const remove = (visitorId) => {
    setVisitors(p => p.filter(v => v.visitor_id !== visitorId))
    api.delete(`/visitors/${visitorId}`).catch(() => {})
  }

  return (
    <DashboardLayout>
      <h4 className="fw-bold mb-4">Visitors</h4>
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-eye display-4 d-block mb-3 opacity-50" />No visitors yet.
        </div>
      ) : (
        <>
          <div className="row g-2 g-md-3">
            {visitors.map(v => {
              const { date, time } = fmtDate(v.visited_at || v.last_visited_at)
              const photo = getPhoto(v.profile_photo)
              return (
                <div key={v.visitor_id} className="col-6 col-md-4 col-xl-3">
                  <div className="card border-0 shadow-sm conversation-card mb-2 mb-md-3 position-relative">
                    <button className="trash-btn" onClick={() => remove(v.visitor_id)} title="Remove">
                      <i className="bi bi-trash-fill" />
                    </button>
                    <Link to={`/view-profile/${v.visitor_id}`} className="card-body p-3 p-md-4 text-center text-decoration-none text-dark d-block">
                      {photo
                        ? <img
                            src={photo}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(); }}
                            className="profile-img-private-chat"
                            alt={v.username}
                          />
                        : <div className="profile-img-private-chat bg-secondary d-flex align-items-center justify-content-center rounded-circle mx-auto"><i className="bi bi-person-fill text-white fs-3" /></div>
                      }
                      <h5 className="mt-2 mt-md-3 mb-1 fw-bold text-truncate">
                        {v.username}
                        {v.is_online && <span className="status-dot ms-1 ms-md-2" />}
                      </h5>
                      <small className="text-muted d-block text-truncate">
                        {v.is_online ? 'Online now' : timeAgo(v.last_seen || v.visited_at)}
                      </small>
                      <div className="d-flex justify-content-center gap-1 gap-md-2 mt-2 text-muted small">
                        <span>{date}</span>
                        <span className="d-none d-sm-inline">{time}</span>
                      </div>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          {pages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-2">
              <button className="btn btn-sm btn-outline-danger" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
              <span className="align-self-center small">Page {page} of {pages}</span>
              <button className="btn btn-sm btn-outline-danger" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
