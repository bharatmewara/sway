import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import toast from 'react-hot-toast';

import DashboardLayout from '../../../components/DashboardLayout';
import RightBar from '../../../components/RightBar';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import useSocket from '../../../hooks/useSocket';
import './Dashboard.css';

const getFallback = (gender) => gender === 'female' ? '/img/girl.png' : '/img/profile-man.png';

const getPhoto = (member) => {
  if (!member?.profile_photo) return getFallback(member?.gender);
  const p = member.profile_photo;
  return p.startsWith('http') || p.startsWith('/') || p.startsWith('data:') ? p : `/${p}`;
};

const formatDistance = (distKm) => {
  if (distKm === null || distKm === undefined || isNaN(Number(distKm))) return null;
  const d = Number(distKm);
  if (d < 1) return '< 1 km away';
  return `${d.toFixed(1)} km away`;
};

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [newMembers,    setNewMembers]    = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [nearbyMembers, setNearbyMembers] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // 'idle' | 'detecting' | 'granted' | 'denied' | 'unavailable'
  const [geoStatus, setGeoStatus] = useState('idle');
  const [userCoords, setUserCoords] = useState(
    user?.latitude && user?.longitude
      ? { latitude: Number(user.latitude), longitude: Number(user.longitude) }
      : null
  );

  const [ageRange,          setAgeRange]          = useState([18, 65]);
  const [maritalStatus,     setMaritalStatus]     = useState('');
  const [connectionStatus,  setConnectionStatus]  = useState('');
  const [distance,          setDistance]          = useState('50');

  const nearbyRef = useRef(null);
  const newRef    = useRef(null);
  const onlineRef = useRef(null);

  const myGender = (user?.verified_gender || user?.gender || 'male').toLowerCase();
  const oppositeGender = myGender === 'female' ? 'male' : 'female';

  const filterOpp = useCallback(
    (arr) => (arr || []).filter((m) => (m.verified_gender || m.gender || '').toLowerCase() === oppositeGender),
    [oppositeGender]
  );

  const fetchNearbyMembers = useCallback(
    async (coordsOverride = null, radiusKm = distance) => {
      setNearbyLoading(true);
      try {
        const activeCoords = coordsOverride || userCoords;
        const params = {
          limit: 20,
          gender: oppositeGender,
          nearby: 'true',
          ...(radiusKm && radiusKm !== 'all' ? { distance: radiusKm } : {}),
          ...(activeCoords?.latitude !== undefined && activeCoords?.longitude !== undefined
            ? { latitude: activeCoords.latitude, longitude: activeCoords.longitude }
            : {}),
        };
        const res = await api.get('/users/nearby', { params });
        setNearbyMembers(filterOpp(res.data?.users));
      } catch {
        setNearbyMembers([]);
      } finally {
        setNearbyLoading(false);
      }
    },
    [distance, filterOpp, oppositeGender, userCoords]
  );

  const detectAndSyncLocation = useCallback(
    (showToast = false) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setGeoStatus('unavailable');
        fetchNearbyMembers(null, distance);
        if (showToast) toast.error('Geolocation is not supported by your browser.');
        return;
      }

      setGeoStatus('detecting');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          };
          setUserCoords(coords);
          setGeoStatus('granted');
          try {
            await api.put('/users/location', coords);
            updateUser?.({ latitude: coords.latitude, longitude: coords.longitude });
            if (showToast) toast.success('Live location updated!');
          } catch {}
          fetchNearbyMembers(coords, distance);
        },
        (err) => {
          if (err.code === 1) {
            setGeoStatus('denied');
            if (showToast) toast.error('Location permission denied. Enable location access in your browser settings.');
          } else {
            setGeoStatus('unavailable');
            if (showToast) toast.error('Unable to retrieve your current GPS location.');
          }
          // Fall back to saved profile coordinates if user already has them in DB
          if (user?.latitude && user?.longitude) {
            fetchNearbyMembers({ latitude: Number(user.latitude), longitude: Number(user.longitude) }, distance);
          } else {
            setNearbyMembers([]);
          }
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    },
    [distance, fetchNearbyMembers, updateUser, user?.latitude, user?.longitude]
  );

  // ── Fetch members from backend ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [newRes, onlineRes] = await Promise.all([
          api.get('/users/members', { params: { limit: 20, gender: oppositeGender } }),
          api.get('/users/members', { params: { limit: 20, gender: oppositeGender, is_online: true } }),
        ]);

        setNewMembers(filterOpp(newRes.data?.users));
        setOnlineMembers(filterOpp(onlineRes.data?.users));
      } catch {
        setNewMembers([]);
        setOnlineMembers([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      load();
      detectAndSyncLocation(false);
    }
  }, [user?.id]);

  // Re-fetch nearby when distance selector changes
  useEffect(() => {
    if (!user) return;
    if (geoStatus === 'granted' || (user?.latitude && user?.longitude)) {
      fetchNearbyMembers(userCoords, distance);
    }
  }, [distance]);

  // ── Load saved preferences ─────────────────────────────────────────────────
  useEffect(() => {
    api.get('/users/preferences').then((res) => {
      const p = res.data?.preferences;
      if (!p) return;
      if (p.preferred_age_min && p.preferred_age_max)
        setAgeRange([Number(p.preferred_age_min), Number(p.preferred_age_max)]);
      if (p.preferred_distance)
        setDistance(String(p.preferred_distance));
    }).catch(() => {});
  }, []);

  // ── Real-time online status via socket ────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const update = ({ userId, user_id, isOnline, is_online }) => {
      const id     = String(userId ?? user_id);
      const online = isOnline ?? is_online;

      setNewMembers(prev => prev.map(m => String(m.id) === id ? { ...m, is_online: online } : m));
      setNearbyMembers(prev => prev.map(m => String(m.id) === id ? { ...m, is_online: online } : m));

      setOnlineMembers(prev => {
        const exists = prev.some(m => String(m.id) === id);
        if (online && !exists) {
          const found = newMembers.find(m => String(m.id) === id) || nearbyMembers.find(m => String(m.id) === id);
          return found ? [{ ...found, is_online: true }, ...prev] : prev;
        }
        if (!online) return prev.filter(m => String(m.id) !== id);
        return prev.map(m => String(m.id) === id ? { ...m, is_online: true } : m);
      });
    };

    socket.on('online_status', update);
    socket.on('user_online',  ({ user_id }) => update({ user_id, is_online: true }));
    socket.on('user_offline', ({ user_id }) => update({ user_id, is_online: false }));

    return () => {
      socket.off('online_status', update);
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket, newMembers, nearbyMembers]);

  const scroll = (ref, by) => ref.current?.scrollBy({ left: by, behavior: 'smooth' });

  const handleSearch = () => {
    const p = new URLSearchParams({
      min_age: ageRange[0],
      max_age: ageRange[1],
      ...(maritalStatus    && { marital_status: maritalStatus }),
      ...(connectionStatus && { connection_status: connectionStatus }),
      ...(distance !== 'all' && { distance }),
    });
    navigate(`/search?${p.toString()}`);
  };

  const completionPercent = (() => {
    if (!user) return 0;
    let s = 0;
    if (user.username)      s += 10;
    if (user.email)         s += 10;
    if (user.gender)        s += 10;
    if (user.profile_photo) s += 20;
    if (user.bio?.trim())   s += 15;
    if (user.age || user.date_of_birth) s += 15;
    if (user.city || user.state)        s += 10;
    if (user.marital_status)            s += 10;
    return Math.min(100, s);
  })();

  const MemberCard = ({ member, showOnline, showDistance = false }) => {
    const distLabel = formatDistance(member.distance_km);
    return (
      <Link to={`/view-profile/${member.id}`} className="member-card position-relative" key={member.id}>
        <img
          src={getPhoto(member)}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(member?.gender); }}
          alt={member.username}
        />
        {showDistance && distLabel && (
          <span
            className="position-absolute top-0 start-0 m-2 badge rounded-pill bg-dark bg-opacity-75 text-white"
            style={{ fontSize: 10, zIndex: 2 }}
          >
            <i className="bi bi-geo-alt-fill text-danger me-1" />
            {distLabel}
          </span>
        )}
        <div className="member-info">
          <b>{member.nickname || member.username}{member.age ? `, ${member.age}` : ''}</b>
          <span>
            {[member.city, member.state].filter(Boolean).join(', ') || member.country || ''}
            {!showDistance && distLabel ? ` • ${distLabel}` : ''}
          </span>
        </div>
        {(showOnline || member.is_online) && member.is_online && <span className="online-dot" />}
      </Link>
    );
  };

  return (
    <DashboardLayout>
      <div className="row g-3">

        {/* ── Main Column ── */}
        <div className="col-12 col-xl-9">
          <div className="row g-3">

            {/* Profile Overview Card */}
            <div className="col-12 col-md-5 col-xl-4">
              <div className="profile-card h-100 d-flex flex-column justify-content-between">
                <div className="d-flex gap-3 align-items-center mb-3">
                  <div className="profile-img2" style={{ overflow: 'visible' }}>
                    <img
                      src={getPhoto(user)}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(user?.gender); }}
                      alt={user?.username || 'avatar'}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div className="percent">{completionPercent}%</div>
                  </div>
                  <div className="min-w-0">
                    <h5 className="fw-bold mb-1 text-truncate">
                      <Link className="text-white text-decoration-none" to="/profile">
                        {user?.username || ''}
                      </Link>
                    </h5>
                    {user?.age && <p className="mb-0 text-white-50 small">{user.age} years old</p>}
                    {(user?.city || user?.state) && (
                      <p className="mb-0 text-white-50 small text-truncate">{[user.city, user.state].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                </div>
                <button className="btn-edit w-100" onClick={() => navigate('/profile')}>
                  <i className="bi bi-pencil me-2" /> Edit Profile
                </button>
              </div>
            </div>

            {/* Search Filter Card */}
            <div className="col-12 col-md-7 col-xl-8">
              <div className="search-card h-100 d-flex flex-column justify-content-between">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-search text-danger fs-5" />
                  <h5 className="fw-bold mb-0">Search</h5>
                </div>
                <div className="row g-2 align-items-end">
                  <div className="col-6 col-sm-4">
                    <label>Marital status</label>
                    <select className="form-select" value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)}>
                      <option value="">Any</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="in_relationship">In Relationship</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="col-12 col-sm-4 order-last order-sm-0">
                    <label className="text-truncate">
                      Age: {ageRange[0]} – {ageRange[1] >= 80 ? '80+' : ageRange[1]}
                    </label>
                    <div className="py-2">
                      <Slider
                        range min={18} max={80} value={ageRange} onChange={setAgeRange}
                        trackStyle={[{ backgroundColor: '#c40000', height: 6 }]}
                        handleStyle={[
                          { borderColor: '#c40000', backgroundColor: '#c40000', width: 18, height: 18, marginTop: -6, opacity: 1 },
                          { borderColor: '#c40000', backgroundColor: '#c40000', width: 18, height: 18, marginTop: -6, opacity: 1 },
                        ]}
                        railStyle={{ backgroundColor: '#f5dada', height: 6 }}
                      />
                    </div>
                  </div>
                  <div className="col-6 col-sm-4">
                    <label>Connection</label>
                    <select className="form-select" value={connectionStatus} onChange={e => setConnectionStatus(e.target.value)}>
                      <option value="">Any</option>
                      <option value="online">Online now</option>
                      <option value="verified">Verified only</option>
                    </select>
                  </div>
                  <div className="col-6 col-sm-6">
                    <label>Distance</label>
                    <select className="form-select" value={distance} onChange={e => setDistance(e.target.value)}>
                      <option value="10">Within 10 km</option>
                      <option value="25">Within 25 km</option>
                      <option value="50">Within 50 km</option>
                      <option value="100">Within 100 km</option>
                      <option value="250">Within 250 km</option>
                      <option value="all">Any distance</option>
                    </select>
                  </div>
                  <div className="col-6 col-sm-6">
                    <button className="btn-search-red" onClick={handleSearch}>Search</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-Time Nearby Members Carousel */}
            <div className="col-12">
              <section className="members-section">
                <div className="section-head flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-geo-alt-fill text-danger fs-5" />
                    <h5 className="fw-bold mb-0">Nearby Members</h5>
                    {geoStatus === 'granted' && (
                      <span className="badge bg-success-subtle text-success rounded-pill" style={{ fontSize: 11 }}>
                        <i className="bi bi-broadcast me-1" />Live GPS Active
                      </span>
                    )}
                    {geoStatus === 'detecting' && (
                      <span className="badge bg-warning-subtle text-dark rounded-pill" style={{ fontSize: 11 }}>
                        Locate in progress...
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      onClick={() => detectAndSyncLocation(true)}
                      className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1"
                      style={{ fontSize: 12 }}
                    >
                      <i className="bi bi-crosshair me-1" />
                      {geoStatus === 'granted' ? 'Refresh Location' : 'Enable Live Location'}
                    </button>
                    <Link to={`/search?distance=${distance}`} className="view-btn">
                      View all <i className="bi bi-chevron-right" />
                    </Link>
                  </div>
                </div>

                {(geoStatus === 'denied' || geoStatus === 'unavailable') && !userCoords && (
                  <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 px-3 mb-3 rounded-3 small">
                    <div>
                      <i className="bi bi-exclamation-triangle-fill me-2" />
                      {geoStatus === 'denied'
                        ? 'Location permission is blocked in your browser. Enable location access to discover members near your current position.'
                        : 'Live GPS location is currently unavailable. Click Retry or set your city in Profile settings.'}
                    </div>
                    <button
                      type="button"
                      onClick={() => detectAndSyncLocation(true)}
                      className="btn btn-sm btn-dark rounded-pill px-3"
                    >
                      Retry Location
                    </button>
                  </div>
                )}

                <div className="d-flex align-items-center gap-2">
                  <button className="arrow-btn flex-shrink-0 d-none d-md-flex" onClick={() => scroll(nearbyRef, -320)} aria-label="Previous">
                    <i className="bi bi-chevron-left" />
                  </button>
                  <div className="member-row flex-grow-1" ref={nearbyRef}>
                    {nearbyLoading ? (
                      <div className="text-center py-4 w-100">
                        <div className="spinner-border spinner-border-sm text-danger me-2" /> Finding nearby members...
                      </div>
                    ) : nearbyMembers.length === 0 ? (
                      <div className="text-muted p-4 text-center w-100">
                        {distance !== 'all'
                          ? `No members found within ${distance} km. Try increasing the distance filter above.`
                          : 'No nearby members found yet. Enable live location to see members near you.'}
                      </div>
                    ) : (
                      nearbyMembers.map(m => <MemberCard key={m.id} member={m} showOnline={true} showDistance={true} />)
                    )}
                  </div>
                  <button className="arrow-btn flex-shrink-0 d-none d-md-flex" onClick={() => scroll(nearbyRef, 320)} aria-label="Next">
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </section>
            </div>

            {/* New Members Carousel */}
            <div className="col-12">
              <section className="members-section">
                <div className="section-head">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-person-plus-fill text-danger fs-5" />
                    <h5 className="fw-bold mb-0">New Members</h5>
                  </div>
                  <Link to="/members" className="view-btn">View all <i className="bi bi-chevron-right" /></Link>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button className="arrow-btn flex-shrink-0 d-none d-md-flex" onClick={() => scroll(newRef, -320)} aria-label="Previous">
                    <i className="bi bi-chevron-left" />
                  </button>
                  <div className="member-row flex-grow-1" ref={newRef}>
                    {loading ? (
                      <div className="text-center py-4 w-100">
                        <div className="spinner-border spinner-border-sm text-danger me-2" /> Loading...
                      </div>
                    ) : newMembers.length === 0 ? (
                      <div className="text-muted p-4 text-center w-100">No new members yet.</div>
                    ) : (
                      newMembers.map(m => <MemberCard key={m.id} member={m} showOnline={false} />)
                    )}
                  </div>
                  <button className="arrow-btn flex-shrink-0 d-none d-md-flex" onClick={() => scroll(newRef, 320)} aria-label="Next">
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </section>
            </div>

            {/* Online Members Carousel */}
            <div className="col-12">
              <section className="members-section">
                <div className="section-head">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-circle-fill text-success" style={{ fontSize: 10 }} />
                    <h5 className="fw-bold mb-0">Online Members</h5>
                  </div>
                  <Link to="/members?is_online=true" className="view-btn">View all <i className="bi bi-chevron-right" /></Link>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button className="arrow-btn flex-shrink-0 d-none d-md-flex" onClick={() => scroll(onlineRef, -320)} aria-label="Previous">
                    <i className="bi bi-chevron-left" />
                  </button>
                  <div className="member-row flex-grow-1" ref={onlineRef}>
                    {loading ? (
                      <div className="text-center py-4 w-100">
                        <div className="spinner-border spinner-border-sm text-danger me-2" /> Loading...
                      </div>
                    ) : onlineMembers.length === 0 ? (
                      <div className="text-muted p-4 text-center w-100">No members online right now.</div>
                    ) : (
                      onlineMembers.map(m => <MemberCard key={m.id} member={m} showOnline={true} />)
                    )}
                  </div>
                  <button className="arrow-btn flex-shrink-0 d-none d-md-flex" onClick={() => scroll(onlineRef, 320)} aria-label="Next">
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </section>
            </div>

          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="col-12 col-xl-3">
          <RightBar />
        </div>

      </div>
    </DashboardLayout>
  );
}
