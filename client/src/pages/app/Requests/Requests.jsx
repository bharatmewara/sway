import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../components/DashboardLayout'
import RightBar from '../../../components/RightBar'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import './Requests.css'

const getFallback = (g) => g === 'female' ? '/img/girl.png' : '/img/boy.png'
const getPhoto = (p, g) => p && (p.startsWith('http') || p.startsWith('/') || p.startsWith('data:')) ? p : p ? `/${p}` : getFallback(g)
const fmt = (iso) => iso ? new Date(iso).toLocaleDateString() + ' ' + new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

export default function Requests() {
  const { user, updateUser, fetchCounts, showInsufficientConnects } = useAuth()
  const isFemale = (user?.verified_gender || user?.gender) === 'female'

  const [incomingRequests, setIncomingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [photoAccessCost, setPhotoAccessCost] = useState(5)
  const [activeTab, setActiveTab] = useState(isFemale ? 'incoming' : 'sent')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const loadRequests = () => {
    setLoading(true)
    api.get('/requests?all=true')
      .then((res) => {
        const inc = res.data?.incoming_requests || (isFemale ? res.data?.requests || [] : [])
        const snt = res.data?.sent_requests || (!isFemale ? res.data?.requests || [] : [])
        setIncomingRequests(inc)
        setSentRequests(snt)
        if (res.data?.private_photo_access_cost !== undefined) {
          setPhotoAccessCost(res.data.private_photo_access_cost)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setActiveTab(isFemale ? 'incoming' : 'sent')
    loadRequests()
  }, [isFemale])

  const approveRequest = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    setBusyId(id)
    try {
      const res = await api.put(`/requests/${id}/approve`)
      const newStatus = res.data?.status || 'ACCESS_GRANTED'
      setIncomingRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus, connects_charged: res.data?.connects_charged || 0 } : r))
      )
      fetchCounts?.()
      toast.success(res.data?.message || 'Private photo request approved!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request')
    } finally {
      setBusyId(null)
    }
  }

  const rejectRequest = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    setBusyId(id)
    try {
      await api.put(`/requests/${id}/reject`)
      setIncomingRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r))
      )
      fetchCounts?.()
      toast.success('Private photo request declined')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline request')
    } finally {
      setBusyId(null)
    }
  }

  const unlockRequest = async (reqItem, e) => {
    e.preventDefault()
    e.stopPropagation()
    const cost = reqItem.unlock_cost ?? photoAccessCost ?? 5
    setBusyId(reqItem.id)
    try {
      const res = await api.post(`/requests/${reqItem.id}/unlock`)
      if (res.data?.remaining_credits !== undefined) {
        updateUser({ connect_credits: res.data.remaining_credits })
      }
      setSentRequests((prev) =>
        prev.map((r) => (r.id === reqItem.id ? { ...r, status: 'ACCESS_GRANTED', connects_charged: cost } : r))
      )
      fetchCounts?.()
      toast.success(res.data?.message || `Private photos unlocked! (${cost} Connects used)`)
    } catch (err) {
      if (err.response?.status === 402) {
        showInsufficientConnects({
          message:
            err.response.data?.message ||
            `Your request is approved! You need ${cost} Connects to unlock @${reqItem.username}'s private photos.`,
          requiredConnects: err.response.data?.required_connects ?? cost,
          currentConnects: err.response.data?.credits ?? user?.connect_credits ?? 0,
          returnTo: '/requests',
        })
      } else {
        toast.error(err.response?.data?.message || 'Failed to unlock private photos')
      }
    } finally {
      setBusyId(null)
    }
  }

  const cancelSentRequest = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    setBusyId(id)
    try {
      await api.delete(`/requests/${id}`)
      setSentRequests((prev) => prev.filter((r) => r.id !== id))
      fetchCounts?.()
      toast.success('Private photo request cancelled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request')
    } finally {
      setBusyId(null)
    }
  }

  const currentList = activeTab === 'incoming' ? incomingRequests : sentRequests
  const filteredList = currentList.filter((r) => {
    if (statusFilter === 'ALL') return true
    return r.status === statusFilter
  })

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="badge bg-warning-subtle text-dark rounded-pill px-2 py-1" style={{ fontSize: 11 }}>
            <i className="bi bi-hourglass-split me-1" />Pending Approval
          </span>
        )
      case 'APPROVED_PENDING_CONNECTS':
        return (
          <span className="badge bg-info-subtle text-info rounded-pill px-2 py-1" style={{ fontSize: 11 }}>
            <i className="bi bi-key-fill me-1" />Approved — Connects Needed
          </span>
        )
      case 'ACCESS_GRANTED':
        return (
          <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1" style={{ fontSize: 11 }}>
            <i className="bi bi-unlock-fill me-1" />Access Granted ✓
          </span>
        )
      case 'REJECTED':
        return (
          <span className="badge bg-danger-subtle text-danger rounded-pill px-2 py-1" style={{ fontSize: 11 }}>
            <i className="bi bi-x-circle me-1" />Declined
          </span>
        )
      default:
        return (
          <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1" style={{ fontSize: 11 }}>
            {status}
          </span>
        )
    }
  }

  const pendingCount = currentList.filter((r) => r.status === 'PENDING').length
  const awaitingCount = currentList.filter((r) => r.status === 'APPROVED_PENDING_CONNECTS').length
  const unlockedCount = currentList.filter((r) => r.status === 'ACCESS_GRANTED').length
  const rejectedCount = currentList.filter((r) => r.status === 'REJECTED').length

  const filterTabs = [
    { id: 'ALL', label: 'All', count: currentList.length },
    { id: 'PENDING', label: 'Pending', count: pendingCount },
    { id: 'APPROVED_PENDING_CONNECTS', label: 'Awaiting Connects', count: awaitingCount },
    { id: 'ACCESS_GRANTED', label: 'Unlocked', count: unlockedCount },
    { id: 'REJECTED', label: 'Declined', count: rejectedCount },
  ]

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          {/* ── DEDICATED MOBILE-READY HERO HEADER ── */}
          <div className="requests-hero-card mb-3">
            <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
              <div className="d-flex align-items-center gap-2">
                <div className="requests-hero-icon-badge">
                  <i className="bi bi-shield-lock-fill" />
                </div>
                <div>
                  <h3 className="requests-hero-title mb-0">Private Photo Requests</h3>
                  <span className="requests-hero-subtitle text-muted">
                    {isFemale ? 'Female Member Access Controls' : 'Private Gallery Permissions'}
                  </span>
                </div>
              </div>

              {/* Dynamic Admin-Configured Connect Cost Chip */}
              <div className="connect-cost-pill">
                <i className="bi bi-lightning-charge-fill text-danger me-1" />
                <span>
                  <strong>{photoAccessCost} Connects</strong> per unlock
                </span>
              </div>
            </div>

            <p className="requests-hero-description mb-3">
              {isFemale
                ? `Review requests from male members to view your locked private photos. Connects (${photoAccessCost}) are charged to them only upon your approval.`
                : `Track your requests to unlock private photos. ${photoAccessCost} Connects are deducted only when the member grants you access.`}
            </p>

            {/* Compact Summary Strip */}
            <div className="requests-summary-strip d-flex align-items-center gap-2 flex-wrap">
              <span className="summary-pill total">
                <span className="summary-num">{currentList.length}</span> Total
              </span>
              <span className="summary-pill pending">
                <span className="summary-num">{pendingCount}</span> Pending
              </span>
              <span className="summary-pill unlocked">
                <span className="summary-num">{unlockedCount}</span> Unlocked
              </span>
              {awaitingCount > 0 && (
                <span className="summary-pill awaiting">
                  <span className="summary-num">{awaitingCount}</span> Awaiting Connects
                </span>
              )}

              {/* Received vs Sent Toggle if user has both */}
              {incomingRequests.length > 0 && sentRequests.length > 0 && (
                <div className="ms-auto d-flex align-items-center gap-1 border-start ps-2">
                  <button
                    type="button"
                    className={`btn btn-xs rounded-pill px-2 py-1 ${activeTab === 'incoming' ? 'btn-wine text-white' : 'btn-light'}`}
                    style={{ fontSize: 11 }}
                    onClick={() => setActiveTab('incoming')}
                  >
                    Received ({incomingRequests.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs rounded-pill px-2 py-1 ${activeTab === 'sent' ? 'btn-wine text-white' : 'btn-light'}`}
                    style={{ fontSize: 11 }}
                    onClick={() => setActiveTab('sent')}
                  >
                    Sent ({sentRequests.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── HORIZONTALLY SCROLLABLE FILTER BAR ── */}
          <div className="requests-filter-bar mb-3">
            <div className="requests-filter-scroll">
              {filterTabs.map((f) => {
                const isActive = statusFilter === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`requests-filter-chip ${isActive ? 'active' : ''}`}
                  >
                    <span>{f.label}</span>
                    {f.count > 0 && <span className="filter-count-badge">{f.count}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="requests-empty-card text-center p-4 p-md-5 rounded-4 mb-3">
              <div className="empty-icon-shield mx-auto mb-3">
                <i className="bi bi-shield-lock-fill" />
              </div>
              <h5 className="fw-bold mb-2 text-dark">No Private Photo Requests Found</h5>
              <p className="text-muted small max-w-450 mx-auto mb-4">
                {isFemale
                  ? 'When members request permission to view your locked private album photos, their requests will appear here for your review and approval.'
                  : "When you request access to another member's private gallery, your requests will appear here with live approval status."}
              </p>
              <Link to="/discover" className="btn btn-wine rounded-pill px-4 py-2 fw-semibold">
                <i className="bi bi-compass me-2" /> Discover Members
              </Link>
            </div>
          ) : (
            <div className="row g-2 g-md-3">
              {filteredList.map((r) => {
                const targetProfileId = activeTab === 'incoming' ? r.sender_id : r.receiver_id
                return (
                  <div className="col-6 col-sm-6 col-md-4" key={r.id}>
                    <div className="card border-0 shadow-sm conversation-card request-card mb-2 mb-md-3 position-relative h-100">
                      {activeTab === 'incoming' && r.status === 'PENDING' && (
                        <button
                          className="trash-btn"
                          onClick={(e) => rejectRequest(r.id, e)}
                          title="Decline request"
                          disabled={busyId === r.id}
                        >
                          <i className="bi bi-trash-fill" />
                        </button>
                      )}
                      {activeTab === 'sent' && r.status === 'PENDING' && (
                        <button
                          className="trash-btn"
                          onClick={(e) => cancelSentRequest(r.id, e)}
                          title="Cancel request"
                          disabled={busyId === r.id}
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      )}

                      <Link
                        to={`/view-profile/${targetProfileId}`}
                        className="card-body p-3 p-md-4 text-center text-decoration-none text-dark d-flex flex-column justify-content-between"
                      >
                        <div>
                          <div className="position-relative d-inline-block">
                            <img
                              src={getPhoto(r.profile_photo, r.gender)}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(r.gender); }}
                              className="profile-img-private-chat"
                              alt={r.username}
                            />
                            {r.is_online && <span className="status-dot" />}
                          </div>
                          <h5 className="mt-2 mt-md-3 mb-1 fw-bold text-truncate">
                            {r.nickname || r.username}
                          </h5>
                          <small className="text-muted d-block text-truncate mb-2">
                            {fmt(r.created_at)}
                          </small>
                          <div className="mb-2">{renderStatusBadge(r.status)}</div>
                        </div>

                        {activeTab === 'incoming' ? (
                          r.status === 'PENDING' ? (
                            <div className="d-flex gap-2 mt-2">
                              <button
                                className="btn-accept btn-sm flex-fill"
                                disabled={busyId === r.id}
                                onClick={(e) => approveRequest(r.id, e)}
                              >
                                <i className="bi bi-check-lg me-1" /> Approve
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm rounded-pill flex-fill"
                                disabled={busyId === r.id}
                                onClick={(e) => rejectRequest(r.id, e)}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="small text-muted mt-2">
                              {r.status === 'ACCESS_GRANTED'
                                ? 'Can view your private photos'
                                : r.status === 'APPROVED_PENDING_CONNECTS'
                                  ? 'Approved — waiting for user Connects'
                                  : 'Request declined'}
                            </div>
                          )
                        ) : (
                          <div className="mt-2">
                            {r.status === 'APPROVED_PENDING_CONNECTS' ? (
                              <button
                                className="btn btn-warning text-dark btn-sm rounded-pill w-100 fw-bold"
                                disabled={busyId === r.id}
                                onClick={(e) => unlockRequest(r, e)}
                              >
                                <i className="bi bi-key-fill me-1" />
                                Unlock ({r.unlock_cost ?? photoAccessCost} Connects)
                              </button>
                            ) : r.status === 'ACCESS_GRANTED' ? (
                              <span className="btn btn-success btn-sm rounded-pill w-100 fw-semibold">
                                <i className="bi bi-images me-1" /> View Private Photos
                              </span>
                            ) : r.status === 'PENDING' ? (
                              <span className="text-muted small d-block">
                                0 Connects used while pending
                              </span>
                            ) : (
                              <span className="text-muted small d-block">
                                No Connects deducted
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="col-12 col-xl-3"><RightBar /></div>
      </div>
    </DashboardLayout>
  )
}
