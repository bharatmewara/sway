import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../components/DashboardLayout'
import RightBar from '../../../components/RightBar'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import './Members.css'

const getFallback = (g) => g === 'female' ? '/img/girl.png' : '/img/boy.png'
const getPhoto = (p, g) => p && (p.startsWith('http') || p.startsWith('/') || p.startsWith('data:')) ? p : p ? `/${p}` : getFallback(g)
const timeAgo = (d, online) => {
  if (online) return 'Active now'
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Members() {
  const { setActiveChatUserId } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/members', { params: { limit: 30 } })
      .then(res => setMembers(res.data?.users || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sendCrush = async (e, id) => {
    e.preventDefault(); e.stopPropagation()
    try { await api.post('/crushes', { receiver_id: id }); toast.success('Crush sent!') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const sendRequest = async (e, id) => {
    e.preventDefault(); e.stopPropagation()
    try {
      const res = await api.post('/requests', { receiver_id: id })
      toast.success(res.data?.message || 'Private photo request sent!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send Private Photo Request')
    }
  }

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          <h4 className="fw-bold mb-3">Members</h4>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
          ) : (
            <div className="row g-2 g-md-3">
              {members.length === 0 && <div className="col-12 text-center text-muted py-5">No members found.</div>}
              {members.map(m => (
                <div className="col-6 col-sm-6 col-md-4" key={m.id}>
                  <Link to={`/view-profile/${m.id}`} className="text-decoration-none text-dark d-block h-100">
                    <div className="card h-100 border-0 shadow-sm member-card-box">
                      <div className="card-body text-center d-flex flex-column align-items-center p-3 p-md-4">
                        <div className="member-avatar-box">
                          <img
                            src={getPhoto(m.profile_photo, m.gender)}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(m.gender); }}
                            alt={m.username}
                          />
                        </div>
                        <h5 className="fw-bold mb-1 d-flex align-items-center gap-1 gap-md-2 text-truncate">
                          <span className="text-truncate">{m.nickname}</span>
                          {m.is_online && <span className="bg-success rounded-circle flex-shrink-0" style={{ width: 8, height: 8, display: 'inline-block' }} />}
                        </h5>
                        <p className="text-muted small mb-2">{timeAgo(m.last_seen, m.is_online)}</p>
                        <div className="text-muted small mb-3 text-truncate w-100">
                          {m.age && <div>{m.age} years old</div>}
                          <div className="text-truncate">{[m.city, m.state, m.country].filter(Boolean).join(', ')}</div>
                        </div>
                        <div className="mt-auto d-flex gap-2">
                          {[
                            { icon: 'bi-envelope-fill', fn: e => { e.preventDefault(); e.stopPropagation(); setActiveChatUserId(m.id) }, title: 'Chat' },
                            { icon: 'bi-heart-fill',    fn: e => sendCrush(e, m.id),   title: 'Crush' },
                            ...((m.verified_gender || m.gender) === 'female'
                              ? [{ icon: 'bi-images', fn: e => sendRequest(e, m.id), title: 'Request Private Photos' }]
                              : []),
                          ].map(({ icon, fn, title }) => (
                            <button key={icon} className="member-action-btn" onClick={fn} title={title}>
                              <i className={`bi ${icon}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="col-12 col-xl-3"><RightBar /></div>
      </div>
    </DashboardLayout>
  )
}
