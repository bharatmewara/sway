import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../components/DashboardLayout'
import RightBar from '../../../components/RightBar'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import useSocket from '../../../hooks/useSocket'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import './Search.css'

const getFallback = (g) => g === 'female' ? '/img/girl.png' : '/img/boy.png'
const getPhoto = (p, g) => p && (p.startsWith('http') || p.startsWith('/') || p.startsWith('data:')) ? p : p ? `/${p}` : getFallback(g)

const formatDistance = (distKm) => {
  if (distKm === null || distKm === undefined || isNaN(Number(distKm))) return null
  const d = Number(distKm)
  if (d < 1) return '< 1 km away'
  return `${d.toFixed(1)} km away`
}

export default function Search() {
  const { user, updateUser } = useAuth()
  const { socket } = useSocket()
  const [searchParams] = useSearchParams()

  const [results,          setResults]          = useState([])
  const [loading,          setLoading]          = useState(false)
  const [ageRange,         setAgeRange]         = useState([
    Number(searchParams.get('min_age')) || 18,
    Number(searchParams.get('max_age')) || 60,
  ])
  const [maritalStatus,    setMaritalStatus]    = useState(searchParams.get('marital_status') || '')
  const [relationshipType, setRelationshipType] = useState(searchParams.get('relationship_type') || '')
  const [onlineStatus,     setOnlineStatus]     = useState(
    searchParams.get('connection_status') === 'online'
      ? 'online'
      : searchParams.get('is_online') === 'true'
        ? 'online'
        : ''
  )
  const [distance,         setDistance]         = useState(searchParams.get('distance') || 'all')
  const [city,             setCity]             = useState(searchParams.get('city') || '')
  const [coords,           setCoords]           = useState(
    user?.latitude && user?.longitude
      ? { latitude: Number(user.latitude), longitude: Number(user.longitude) }
      : null
  )
  const [geoStatus,        setGeoStatus]        = useState('idle')

  const executeSearch = useCallback(async (overrideCoords = null, overrideDist = null) => {
    setLoading(true)
    try {
      const activeCoords = overrideCoords || coords
      const activeDist = overrideDist !== null ? overrideDist : distance
      const params = {
        min_age: ageRange[0],
        max_age: ageRange[1],
        limit: 40,
        ...(maritalStatus    && { marital_status: maritalStatus }),
        ...(relationshipType && { relationship_type: relationshipType }),
        ...(onlineStatus     && { is_online: onlineStatus === 'online' ? 'true' : 'false' }),
        ...(city             && { city }),
        ...(activeDist && activeDist !== 'all' && { distance: activeDist, nearby: 'true' }),
        ...(activeCoords?.latitude !== undefined && activeCoords?.longitude !== undefined && {
          latitude: activeCoords.latitude,
          longitude: activeCoords.longitude,
        }),
      }
      const res = await api.get('/users/members', { params })
      setResults(res.data?.users || [])
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }, [ageRange, maritalStatus, relationshipType, onlineStatus, distance, city, coords])

  const useLiveGpsLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('unavailable')
      toast.error('Geolocation is not supported by your browser.')
      return
    }
    setGeoStatus('detecting')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const liveCoords = {
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }
        setCoords(liveCoords)
        setGeoStatus('granted')
        try {
          await api.put('/users/location', liveCoords)
          updateUser?.(liveCoords)
        } catch {}
        const nextDist = distance === 'all' ? '50' : distance
        setDistance(nextDist)
        toast.success('Live GPS location active! Showing nearby members.')
        executeSearch(liveCoords, nextDist)
      },
      (err) => {
        setGeoStatus(err.code === 1 ? 'denied' : 'unavailable')
        toast.error(
          err.code === 1
            ? 'Location permission denied in browser.'
            : 'Unable to detect your GPS coordinates.'
        )
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  }

  useEffect(() => {
    executeSearch()
  }, [])

  useEffect(() => {
    if (!socket) return
    const onOnline  = ({ user_id }) => setResults(p => p.map(u => String(u.id) === String(user_id) ? { ...u, is_online: true }  : u))
    const onOffline = ({ user_id }) => setResults(p => p.map(u => String(u.id) === String(user_id) ? { ...u, is_online: false } : u))
    socket.on('user_online',  onOnline)
    socket.on('user_offline', onOffline)
    return () => { socket.off('user_online', onOnline); socket.off('user_offline', onOffline) }
  }, [socket])

  const sliderStyle = {
    trackStyle: [{ backgroundColor: '#76000b', height: 6 }],
    railStyle: { backgroundColor: '#e9ecef', height: 6 },
    handleStyle: [
      { backgroundColor: '#76000b', borderColor: '#76000b', height: 20, width: 20, marginTop: -7, opacity: 1, boxShadow: 'none' },
      { backgroundColor: '#76000b', borderColor: '#76000b', height: 20, width: 20, marginTop: -7, opacity: 1, boxShadow: 'none' },
    ],
  }

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h4 className="fw-bold mb-0">Search & Nearby Discovery</h4>
            <button
              type="button"
              onClick={useLiveGpsLocation}
              disabled={geoStatus === 'detecting'}
              className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
            >
              <i className="bi bi-crosshair me-1" />
              {geoStatus === 'detecting'
                ? 'Detecting GPS...'
                : geoStatus === 'granted'
                  ? 'Live GPS Active ✓'
                  : 'Use My Live Location'}
            </button>
          </div>

          <div className="search-card mb-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-sliders text-danger me-2" />Search Parameters</h5>
            <div className="row align-items-end g-3">
              <div className="col-12 col-sm-6">
                <label className="fw-semibold mb-2 d-block">Age: {ageRange[0]} – {ageRange[1]}</label>
                <div className="py-2">
                  <Slider range min={18} max={99} value={ageRange} onChange={setAgeRange} {...sliderStyle} />
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <label className="fw-semibold mb-2">Marital Status</label>
                <select className="form-select" value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)}>
                  <option value="">Any</option>
                  {[
                    { val: 'single', label: 'Single' },
                    { val: 'married', label: 'Married' },
                    { val: 'divorced', label: 'Divorced' },
                    { val: 'in_relationship', label: 'In Relationship' },
                    { val: 'widowed', label: 'Widowed' },
                  ].map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
                </select>
              </div>
              <div className="col-12 col-sm-6">
                <label className="fw-semibold mb-2">Relationship Type</label>
                <select className="form-select" value={relationshipType} onChange={e => setRelationshipType(e.target.value)}>
                  <option value="">Any</option>
                  {['friends', 'dating', 'marriage'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="col-12 col-sm-6">
                <label className="fw-semibold mb-2">Online Status</label>
                <select className="form-select" value={onlineStatus} onChange={e => setOnlineStatus(e.target.value)}>
                  <option value="">Any</option>
                  <option value="online">Online now</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div className="col-12 col-sm-4">
                <label className="fw-semibold mb-2">Distance Radius</label>
                <select className="form-select" value={distance} onChange={e => setDistance(e.target.value)}>
                  <option value="all">Any distance</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                  <option value="100">Within 100 km</option>
                  <option value="250">Within 250 km</option>
                </select>
              </div>
              <div className="col-12 col-sm-4">
                <label className="fw-semibold mb-2">City / State</label>
                <input type="text" className="form-control" placeholder="e.g. Mumbai" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="col-12 col-sm-4">
                <button className="btn-search-exec w-100" onClick={() => executeSearch()}>
                  <i className="bi bi-search me-2" />Search Members
                </button>
              </div>
            </div>
          </div>

          <h5 className="fw-bold mb-3">Results ({results.length})</h5>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
          ) : (
            <div className="row g-2 g-md-3">
              {results.length === 0 ? (
                <div className="col-12 text-center py-5 text-muted">
                  <i className="bi bi-search display-4 d-block mb-3 opacity-50" />
                  No members found matching your filters.
                </div>
              ) : results.map(m => {
                const distLabel = formatDistance(m.distance_km)
                return (
                  <div className="col-6 col-sm-6 col-md-4" key={m.id}>
                    <Link to={`/view-profile/${m.id}`} className="search-results-card shadow-sm position-relative">
                      <img
                        src={getPhoto(m.profile_photo, m.gender)}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(m.gender); }}
                        alt={m.username}
                      />
                      {distLabel && (
                        <span
                          className="position-absolute top-0 start-0 m-2 badge bg-dark bg-opacity-75 text-white rounded-pill"
                          style={{ fontSize: 11 }}
                        >
                          <i className="bi bi-geo-alt-fill text-danger me-1" />
                          {distLabel}
                        </span>
                      )}
                      <div className="search-results-overlay">
                        <h5 className="mb-0 fw-bold text-truncate">{m.nickname || m.username}{m.age ? `, ${m.age}` : ''}</h5>
                        <small className="text-truncate d-block">
                          <i className="bi bi-geo-alt-fill me-1" />
                          {[m.city, m.state].filter(Boolean).join(', ') || m.country || 'Location Verified'}
                        </small>
                      </div>
                      {m.is_online && <span className="position-absolute top-0 end-0 m-2 badge bg-success rounded-pill">Online</span>}
                    </Link>
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
