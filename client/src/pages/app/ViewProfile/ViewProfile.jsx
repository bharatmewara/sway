import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '../../../components/DashboardLayout'
import RightBar from '../../../components/RightBar'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import './ViewProfile.css'

const getFallback = (g) => g === 'female' ? '/img/girl.png' : '/img/boy.png'
const getPhoto = (p, g) => p && (p.startsWith('http') || p.startsWith('/') || p.startsWith('data:')) ? p : p ? `/${p}` : getFallback(g)

const parseArr = (v) => {
  if (!v) return []
  if (Array.isArray(v)) return v
  try { return JSON.parse(v) } catch { return [v] }
}

export default function ViewProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, updateUser, fetchCounts, showInsufficientConnects } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [chatConfig, setChatConfig] = useState(null)
  const [selectedPrivatePhoto, setSelectedPrivatePhoto] = useState(null)
  const [processingRequest, setProcessingRequest] = useState(false)
  const [grants, setGrants] = useState({
    allow_instagram: false,
    allow_facebook: false,
    allow_telegram: false,
    allow_phone: false,
  })
  const [savingGrants, setSavingGrants] = useState(false)

  const isFemaleViewer = (user?.verified_gender || user?.gender) === 'female'

  const loadProfileData = () => {
    setLoading(true)
    setErrorMsg(null)

    Promise.all([
      api.get(`/users/${id}`),
      api.get('/chat/config').catch(() => ({ data: {} })),
    ])
      .then(([res, cfgRes]) => {
        const u = res.data?.user || res.data?.profile || res.data
        setProfile(u)
        if (u?.my_privacy_grants_for_user) {
          setGrants({
            allow_instagram: !!u.my_privacy_grants_for_user.allow_instagram,
            allow_facebook: !!u.my_privacy_grants_for_user.allow_facebook,
            allow_telegram: !!u.my_privacy_grants_for_user.allow_telegram,
            allow_phone: !!u.my_privacy_grants_for_user.allow_phone,
          })
        }
        if (cfgRes.data?.config) {
          setChatConfig(cfgRes.data.config)
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to load profile'
        setErrorMsg(msg)
        toast.error(msg)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProfileData()
  }, [id])

  const sendLike = async () => {
    if (profile?.interaction_status?.has_liked) {
      toast('You have already liked this profile.')
      return
    }
    try {
      const res = await api.post(`/users/${id}/like`, { target_user_id: id })
      setProfile((p) => ({
        ...p,
        interaction_status: { ...(p?.interaction_status || {}), has_liked: true },
      }))
      toast.success(res.data?.matched ? "It's a Match! 🎉" : 'Like sent!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send Like')
    }
  }

  const sendCrush = async () => {
    if (profile?.interaction_status?.has_crushed) {
      toast('You have already sent a Crush to this user.')
      return
    }
    try {
      const res = await api.post('/crushes', { receiver_id: id })
      setProfile((p) => ({
        ...p,
        interaction_status: { ...(p?.interaction_status || {}), has_crushed: true },
      }))
      toast.success(res.data?.message || 'Crush sent!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send Crush')
    }
  }

  const sendPrivatePhotoRequest = async () => {
    const st = profile?.interaction_status?.request_status
    if (st === 'PENDING') {
      toast('Private photo request is already pending approval.')
      return
    }
    if (st === 'ACCESS_GRANTED' || st === 'ACCEPTED') {
      toast('Private photos are already unlocked!')
      return
    }
    if (st === 'APPROVED_PENDING_CONNECTS') {
      await unlockPrivatePhotos()
      return
    }
    setProcessingRequest(true)
    try {
      const res = await api.post('/requests', { receiver_id: id })
      setProfile((p) => ({
        ...p,
        interaction_status: {
          ...(p?.interaction_status || {}),
          request_status: 'PENDING',
          request_id: res.data?.request?.id || p?.interaction_status?.request_id,
          request_sender_id: user?.id,
        },
      }))
      toast.success(res.data?.message || 'Private photo request sent! Connects are only deducted upon approval.')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send Private Photo Request')
    } finally {
      setProcessingRequest(false)
    }
  }

  const unlockPrivatePhotos = async () => {
    const photoCost =
      profile?.interaction_status?.private_photo_access_cost ??
      chatConfig?.private_photo_access_cost ??
      chatConfig?.private_photo_cost ??
      5
    setProcessingRequest(true)
    try {
      const res = await api.post(`/requests/unlock-user/${id}`)
      if (res.data?.remaining_credits !== undefined) {
        updateUser({ connect_credits: res.data.remaining_credits })
      }
      toast.success(res.data?.message || `Private photos unlocked! (${photoCost} Connects used)`)
      fetchCounts?.()
      loadProfileData()
    } catch (err) {
      if (err.response?.status === 402) {
        showInsufficientConnects({
          message:
            err.response.data?.message ||
            `Her private photo request is approved! You need ${photoCost} Connects to unlock her private photos.`,
          requiredConnects: err.response.data?.required_connects ?? photoCost,
          currentConnects: err.response.data?.credits ?? user?.connect_credits ?? 0,
          returnTo: `/view-profile/${id}`,
        })
      } else {
        toast.error(err.response?.data?.message || 'Failed to unlock private photos')
      }
    } finally {
      setProcessingRequest(false)
    }
  }

  const respondToIncomingPhotoRequest = async (action) => {
    const reqId = profile?.interaction_status?.request_id
    if (!reqId) return
    setProcessingRequest(true)
    try {
      const endpoint = action === 'approve' ? `/requests/${reqId}/approve` : `/requests/${reqId}/reject`
      const res = await api.put(endpoint)
      const newStatus = res.data?.status || (action === 'approve' ? 'ACCESS_GRANTED' : 'REJECTED')
      setProfile((p) => ({
        ...p,
        interaction_status: {
          ...(p?.interaction_status || {}),
          request_status: newStatus,
        },
      }))
      fetchCounts?.()
      toast.success(res.data?.message || (action === 'approve' ? 'Private photo request approved!' : 'Request declined.'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request')
    } finally {
      setProcessingRequest(false)
    }
  }

  const startCommunication = async (commType) => {
    try {
      const res = await api.post('/chat/start', {
        receiver_id: id,
        communication_type: commType,
      })
      if (res.data?.remaining_credits !== undefined && !isFemaleViewer) {
        updateUser({ connect_credits: res.data.remaining_credits })
      }
      if (res.data?.credits_charged > 0) {
        toast.success(
          `${commType === 'private_message' ? 'Private Messages (72h)' : 'Chat'} started! (${res.data.credits_charged} Connects used)`
        )
      }
      const targetUrl =
        commType === 'private_message'
          ? `/message-details/${id}?type=private_message`
          : `/chat/${id}?type=chat`
      navigate(targetUrl)
    } catch (err) {
      if (err.response?.status === 402) {
        const returnTo =
          commType === 'private_message'
            ? `/message-details/${id}?type=private_message`
            : `/chat/${id}?type=chat`
        const defaultRequired =
          commType === 'private_message'
            ? chatConfig?.private_message_start_cost ?? 10
            : chatConfig?.chat_start_cost ?? 5
        showInsufficientConnects({
          message:
            err.response.data?.message ||
            `You don't have enough Connects to start ${commType === 'private_message' ? 'Private Messages (72h)' : 'Chat'}.`,
          requiredConnects: err.response.data?.required_connects ?? defaultRequired,
          currentConnects: err.response.data?.credits ?? user?.connect_credits ?? 0,
          returnTo,
        })
      } else {
        toast.error(err.response?.data?.message || 'Unable to start conversation')
      }
    }
  }

  const toggleGrant = async (field) => {
    const updated = { ...grants, [field]: !grants[field] }
    setGrants(updated)
    setSavingGrants(true)
    try {
      await api.post('/users/privacy/permissions', {
        male_user_id: Number(id),
        ...updated,
      })
      toast.success('Privacy access updated for this user')
    } catch {
      toast.error('Failed to update privacy permission')
    } finally {
      setSavingGrants(false)
    }
  }

  const blockUser = async () => {
    if (!window.confirm('Block this user? They will no longer be able to chat, message, request, like, or crush you.')) return
    try {
      await api.post('/reports/block', { blocked_id: id, reason: 'Blocked from profile' })
      toast.success('User blocked')
      navigate('/home')
    } catch {
      toast.error('Failed to block user')
    }
  }

  const reportUser = async () => {
    const reason = window.prompt('Why are you reporting this user?')
    if (!reason) return
    try {
      await api.post('/reports', { reported_id: id, reason, description: 'Reported from profile' })
      toast.success('Report submitted')
    } catch {
      toast.error('Failed to report')
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
    </DashboardLayout>
  )

  if (errorMsg || !profile) return (
    <DashboardLayout>
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center my-4">
        <i className="bi bi-shield-exclamation display-4 text-danger mb-3 d-block" />
        <h4 className="fw-bold">{errorMsg || 'Profile Unavailable'}</h4>
        <p className="text-muted small mb-4">
          This profile cannot be viewed due to gender-based discovery or blocking rules.
        </p>
        <Link to="/home" className="btn btn-wine rounded-pill px-4 mx-auto">
          Back to Home Discovery
        </Link>
      </div>
    </DashboardLayout>
  )

  const InfoRow = ({ label, value }) => value ? (
    <div className="d-flex justify-content-between mb-2 pb-1 border-bottom border-light">
      <span className="text-muted small">{label}</span>
      <span className="fw-semibold text-dark small">{value}</span>
    </div>
  ) : null

  const TagList = ({ title, values }) => {
    const arr = parseArr(values)
    if (!arr.length) return null
    return (
      <div className="mb-4">
        <h6 className="fw-bold mb-3 text-dark">{title}</h6>
        <ul className="personality-list">
          {arr.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
    )
  }

  const hasLiked = !!profile.interaction_status?.has_liked
  const hasCrushed = !!profile.interaction_status?.has_crushed
  const requestStatus = profile.interaction_status?.request_status || 'NONE'
  const pmCost = chatConfig?.private_message_start_cost ?? 10
  const chatCost = chatConfig?.chat_start_cost ?? 5
  const photoAccessCost =
    profile.interaction_status?.private_photo_access_cost ??
    chatConfig?.private_photo_access_cost ??
    chatConfig?.private_photo_cost ??
    5
  const isTargetFemale = (profile.verified_gender || profile.gender) === 'female'
  const privatePhotos = Array.isArray(profile.private_photos) ? profile.private_photos : []
  const hasPrivatePhotoAccess =
    !!profile.private_photo_access_granted ||
    !!profile.interaction_status?.private_photo_access_granted ||
    requestStatus === 'ACCESS_GRANTED' ||
    requestStatus === 'ACCEPTED'

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          <div className="row g-3 g-md-4">

            {/* Left Card: Avatar, Online Status & Profile Actions */}
            <div className="col-12 col-md-5 col-xl-4">
              <div className="profile-card2">
                <div className="text-center mb-4">
                  <div className="position-relative d-inline-block">
                    <img
                      src={getPhoto(profile.profile_photo, profile.gender)}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(profile?.gender); }}
                      className="profile-avatar"
                      alt={profile.username}
                    />
                    {profile.is_online && <span className="online-dot" />}
                  </div>
                  <h4 className="mt-3 fw-bold mb-1">{profile.nickname || profile.username}</h4>
                  <div className="mb-1">
                    <span className={profile.is_online ? 'text-success small fw-semibold' : 'text-muted small'}>
                      ● {profile.is_online ? 'Online now' : 'Offline'}
                    </span>
                  </div>
                  <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1" style={{ fontSize: 11 }}>
                    <i className="bi bi-patch-check-fill me-1" />
                    Verified profile
                  </span>
                </div>

                {/* Primary Communication Systems: Chat vs Private Messages */}
                <button
                  onClick={() => startCommunication('chat')}
                  className="btn-profile-chat mb-2 w-100"
                >
                  <i className="bi bi-chat-dots-fill me-2" />
                  {isFemaleViewer ? 'Start Chat (Free)' : `Start Chat (${chatCost} Connects)`}
                </button>

                <button
                  onClick={() => startCommunication('private_message')}
                  className="btn btn-dark rounded-pill w-100 py-2 fw-semibold mb-2"
                  style={{ fontSize: 14 }}
                >
                  <i className="bi bi-envelope-lock-fill me-2 text-warning" />
                  {isFemaleViewer ? 'Private Messages — 72h (Free)' : `Private Messages — 72h (${pmCost} Connects)`}
                </button>

                {/* Male viewing Female profile: Private Photo Request button */}
                {!isFemaleViewer && isTargetFemale && (
                  <div className="mb-3">
                    <button
                      onClick={sendPrivatePhotoRequest}
                      disabled={processingRequest || requestStatus === 'PENDING' || hasPrivatePhotoAccess}
                      className={`w-100 ${
                        hasPrivatePhotoAccess
                          ? 'btn btn-success rounded-pill py-2 fw-semibold'
                          : requestStatus === 'APPROVED_PENDING_CONNECTS'
                            ? 'btn btn-warning text-dark rounded-pill py-2 fw-bold'
                            : 'btn-profile-req'
                      }`}
                    >
                      <i
                        className={`bi ${
                          hasPrivatePhotoAccess
                            ? 'bi-unlock-fill'
                            : requestStatus === 'APPROVED_PENDING_CONNECTS'
                              ? 'bi-key-fill'
                              : requestStatus === 'PENDING'
                                ? 'bi-hourglass-split'
                                : 'bi-images'
                        } me-2`}
                      />
                      {hasPrivatePhotoAccess
                        ? 'Private Photos Unlocked ✓'
                        : requestStatus === 'PENDING'
                          ? 'Private Photo Request Pending'
                          : requestStatus === 'APPROVED_PENDING_CONNECTS'
                            ? `Unlock Private Photos (${photoAccessCost} Connects)`
                            : requestStatus === 'REJECTED'
                              ? 'Request Private Photos Again'
                              : 'Request Private Photos'}
                    </button>
                    {!hasPrivatePhotoAccess && requestStatus !== 'APPROVED_PENDING_CONNECTS' && (
                      <div className="text-center text-muted mt-1" style={{ fontSize: 11 }}>
                        <i className="bi bi-info-circle me-1" />
                        {photoAccessCost} Connects deducted only when approved
                      </div>
                    )}
                  </div>
                )}

                {/* Female viewing Male profile who requested her private photos */}
                {isFemaleViewer && !isTargetFemale && requestStatus === 'PENDING' && Number(profile.interaction_status?.request_sender_id) === Number(profile.id) && (
                  <div className="p-3 mb-3 rounded-3 bg-danger-subtle border border-danger-subtle text-center">
                    <div className="small fw-bold text-danger mb-2">
                      <i className="bi bi-images me-1" />
                      {profile.nickname || profile.username} requested access to your Private Photos
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        disabled={processingRequest}
                        onClick={() => respondToIncomingPhotoRequest('approve')}
                        className="btn btn-sm btn-success rounded-pill flex-fill fw-semibold"
                      >
                        <i className="bi bi-check-lg me-1" /> Approve
                      </button>
                      <button
                        disabled={processingRequest}
                        onClick={() => respondToIncomingPhotoRequest('reject')}
                        className="btn btn-sm btn-outline-danger rounded-pill flex-fill fw-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                <div className="profile-list mb-2">
                  <div className="item">
                    <button
                      onClick={sendLike}
                      disabled={hasLiked}
                      className="bg-transparent border-0 p-0 text-start w-100 fw-semibold"
                    >
                      <i className={`bi ${hasLiked ? 'bi-hand-thumbs-up-fill text-success' : 'bi-hand-thumbs-up text-primary'} me-2`} />
                      {hasLiked ? 'Liked Profile ✓' : 'Send Like'}
                    </button>
                  </div>
                  <div className="item">
                    <button
                      onClick={sendCrush}
                      disabled={hasCrushed}
                      className="bg-transparent border-0 p-0 text-start w-100 fw-semibold"
                    >
                      <i className="bi bi-heart-fill text-danger me-2" />
                      {hasCrushed ? 'Crush Sent ❤️' : 'Send Crush'}
                    </button>
                  </div>
                  <div className="item">
                    <button onClick={blockUser} className="bg-transparent border-0 p-0 text-start w-100 text-danger">
                      <i className="bi bi-ban-fill me-2" />Block User
                    </button>
                  </div>
                  <div className="item">
                    <button onClick={reportUser} className="bg-transparent border-0 p-0 text-start w-100">
                      <i className="bi bi-flag-fill text-warning me-2" />Report User
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Info */}
            <div className="col-12 col-md-7 col-xl-8">
              {/* About / Bio */}
              <div className="profile-card2 h-auto mb-3">
                <h5 className="fw-bold mb-2">
                  <i className="bi bi-person-lines-fill text-danger me-2" />
                  About
                </h5>
                <p className="text-secondary small mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {profile.bio || 'No bio provided yet.'}
                </p>
              </div>

              {/* Private Photos Gallery (For Female Profiles) */}
              {isTargetFemale && (
                <div className="profile-card2 h-auto mb-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <h5 className="fw-bold mb-0">
                      <i className="bi bi-images text-danger me-2" />
                      Private Photos ({privatePhotos.length})
                    </h5>
                    {hasPrivatePhotoAccess ? (
                      <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1">
                        <i className="bi bi-unlock-fill me-1" />
                        Private Photos Unlocked
                      </span>
                    ) : requestStatus === 'APPROVED_PENDING_CONNECTS' ? (
                      <span className="badge bg-warning-subtle text-dark rounded-pill px-3 py-1">
                        <i className="bi bi-key-fill me-1" />
                        Approved — {photoAccessCost} Connects Required to Unlock
                      </span>
                    ) : requestStatus === 'PENDING' ? (
                      <span className="badge bg-info-subtle text-info rounded-pill px-3 py-1">
                        <i className="bi bi-hourglass-split me-1" />
                        Approval Pending
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-1">
                        <i className="bi bi-lock-fill me-1" />
                        Approval Required ({photoAccessCost} Connects on approval)
                      </span>
                    )}
                  </div>

                  {privatePhotos.length === 0 ? (
                    <div className="text-muted small py-3 text-center bg-light rounded-3">
                      <i className="bi bi-camera me-2" />
                      This user hasn't uploaded any private photos yet.
                    </div>
                  ) : hasPrivatePhotoAccess ? (
                    <div className="row g-2">
                      {privatePhotos.map((p) => (
                        <div className="col-6 col-sm-4" key={p.id}>
                          <div
                            className="position-relative rounded-3 overflow-hidden border shadow-sm"
                            style={{ aspectRatio: '1/1', cursor: 'pointer' }}
                            onClick={() => setSelectedPrivatePhoto(getPhoto(p.photo_url, profile.gender))}
                          >
                            <img
                              src={getPhoto(p.photo_url, profile.gender)}
                              alt="Private"
                              className="w-100 h-100"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-3 bg-light border text-center">
                      <div className="row g-2 mb-3 justify-content-center">
                        {privatePhotos.slice(0, 3).map((p, idx) => (
                          <div className="col-4 col-sm-3" key={p.id || idx}>
                            <div
                              className="rounded-3 d-flex flex-column align-items-center justify-content-center text-white position-relative overflow-hidden shadow-sm"
                              style={{
                                aspectRatio: '1/1',
                                background: 'linear-gradient(135deg, #3a0ca3 0%, #7209b7 50%, #f72585 100%)',
                              }}
                            >
                              <i className="bi bi-lock-fill fs-3 mb-1" />
                              <span style={{ fontSize: 11, fontWeight: 600 }}>Private #{idx + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <h6 className="fw-bold mb-1">
                        {requestStatus === 'APPROVED_PENDING_CONNECTS'
                          ? `${profile.nickname || profile.username} approved your Private Photo Request!`
                          : `${privatePhotos.length} Private Photo${privatePhotos.length > 1 ? 's' : ''} Locked`}
                      </h6>
                      <p className="text-muted small mb-3">
                        {requestStatus === 'APPROVED_PENDING_CONNECTS'
                          ? `Unlock her private photos now using ${photoAccessCost} Connects.`
                          : requestStatus === 'PENDING'
                            ? `Your request is waiting for ${profile.nickname || profile.username}'s approval. ${photoAccessCost} Connects will be deducted only after she approves.`
                            : `Send a Private Photo Request to view ${profile.nickname || profile.username}'s private photos. ${photoAccessCost} Connects are deducted only when she approves your request.`}
                      </p>
                      {!isFemaleViewer && (
                        <button
                          onClick={sendPrivatePhotoRequest}
                          disabled={processingRequest || requestStatus === 'PENDING'}
                          className={`btn rounded-pill px-4 fw-semibold ${
                            requestStatus === 'APPROVED_PENDING_CONNECTS' ? 'btn-warning text-dark' : 'btn-wine'
                          }`}
                        >
                          <i
                            className={`bi ${
                              requestStatus === 'APPROVED_PENDING_CONNECTS'
                                ? 'bi-key-fill'
                                : requestStatus === 'PENDING'
                                  ? 'bi-hourglass-split'
                                  : 'bi-images'
                            } me-2`}
                          />
                          {requestStatus === 'PENDING'
                            ? 'Private Photo Request Pending'
                            : requestStatus === 'APPROVED_PENDING_CONNECTS'
                              ? `Unlock Private Photos (${photoAccessCost} Connects)`
                              : 'Request Private Photos'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Social Links & Contact Details (Enforced by Female Privacy Controls) */}
              <div className="profile-card2 h-auto mb-3">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-share-fill text-danger me-2" />
                    Social Links & Contact
                  </h5>
                  {isTargetFemale && !isFemaleViewer && (
                    <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-1">
                      <i className="bi bi-shield-lock me-1" />
                      Protected by Female Privacy Controls
                    </span>
                  )}
                </div>

                <div className="row g-2">
                  {[
                    { key: 'instagram', label: 'Instagram', icon: 'bi-instagram text-danger', val: profile.instagram, restricted: profile.instagram_restricted },
                    { key: 'facebook',  label: 'Facebook',  icon: 'bi-facebook text-primary', val: profile.facebook,  restricted: profile.facebook_restricted },
                    { key: 'telegram',  label: 'Telegram',  icon: 'bi-telegram text-info',    val: profile.telegram,  restricted: profile.telegram_restricted },
                    { key: 'phone',     label: 'Phone Number', icon: 'bi-telephone-fill text-success', val: profile.phone, restricted: profile.phone_restricted },
                  ].map((item) => (
                    <div className="col-12 col-sm-6" key={item.key}>
                      <div className="p-2 border rounded-3 bg-light d-flex align-items-center justify-content-between">
                        <span className="small fw-semibold">
                          <i className={`bi ${item.icon} me-2`} />
                          {item.label}
                        </span>
                        {item.val ? (
                          <span className="badge bg-success-subtle text-success fw-semibold">{item.val}</span>
                        ) : item.restricted ? (
                          <span className="badge bg-secondary-subtle text-muted">
                            <i className="bi bi-lock-fill me-1" />Hidden
                          </span>
                        ) : (
                          <span className="text-muted small">Not shared</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Female Viewer: Per-Male-User Privacy Grant Panel */}
                {isFemaleViewer && !isTargetFemale && (
                  <div className="mt-3 pt-3 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0 text-danger">
                        <i className="bi bi-shield-check me-1" />
                        Allow {profile.username} to View My Contact Details:
                      </h6>
                      {savingGrants && <span className="spinner-border spinner-border-sm text-danger" />}
                    </div>
                    <p className="text-muted small mb-2">
                      Your social links & phone number are hidden from all male users by default. Check any box below to grant {profile.username} access:
                    </p>
                    <div className="d-flex flex-wrap gap-3">
                      {[
                        { field: 'allow_instagram', label: 'Instagram', icon: 'bi-instagram' },
                        { field: 'allow_facebook',  label: 'Facebook',  icon: 'bi-facebook' },
                        { field: 'allow_telegram',  label: 'Telegram',  icon: 'bi-telegram' },
                        { field: 'allow_phone',     label: 'Phone Number', icon: 'bi-telephone' },
                      ].map((g) => (
                        <label className="form-check form-check-inline m-0 d-flex align-items-center gap-2 border rounded-pill px-3 py-1 bg-white" key={g.field} style={{ cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            className="form-check-input m-0"
                            checked={!!grants[g.field]}
                            onChange={() => toggleGrant(g.field)}
                          />
                          <span className="small fw-semibold">
                            <i className={`bi ${g.icon} me-1`} />
                            {g.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-card2 h-auto mb-3">
                <h5 className="fw-bold mb-3">Personal Information</h5>
                <InfoRow label="Age"            value={profile.age ? `${profile.age} years old` : null} />
                <InfoRow label="Gender"         value={profile.verified_gender || profile.gender} />
                <InfoRow label="Marital Status" value={profile.marital_status} />
                <InfoRow label="Children"       value={profile.children} />
                <InfoRow label="Occupation"     value={profile.profession} />
                <InfoRow label="Height"         value={profile.height ? `${profile.height} cm` : null} />
                <InfoRow label="Body Type"      value={profile.body_type} />
                <InfoRow label="Ethnicity"      value={profile.ethnicity} />
                <InfoRow label="Smoker"         value={profile.smoker} />
                <InfoRow label="Location"       value={[profile.city, profile.state, profile.country].filter(Boolean).join(', ')} />
              </div>

              <div className="profile-card2 h-auto">
                <TagList title="My Personality"      values={profile.personality_traits} />
                <TagList title="Relationship Sought" values={profile.relationship_expectations} />
                <TagList title="Hobbies"             values={profile.hobbies} />
                <TagList title="Sexual Practices"    values={profile.sexual_practices} />
              </div>
            </div>

          </div>
        </div>
        <div className="col-12 col-xl-3"><RightBar /></div>
      </div>

      {/* Lightbox Modal for Unlocked Private Photos */}
      {selectedPrivatePhoto && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.85)', zIndex: 2050 }}
          onClick={() => setSelectedPrivatePhoto(null)}
        >
          <div className="position-relative p-2" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              className="btn btn-light rounded-circle position-absolute top-0 end-0 m-3 shadow"
              onClick={() => setSelectedPrivatePhoto(null)}
            >
              <i className="bi bi-x-lg" />
            </button>
            <img
              src={selectedPrivatePhoto}
              alt="Private Photo Full"
              className="img-fluid rounded-4 shadow-lg"
              style={{ maxHeight: '85vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
