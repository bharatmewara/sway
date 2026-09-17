import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import DashboardLayout from '../../components/DashboardLayout';
import RightBar from '../../components/RightBar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [newMembers, setNewMembers] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filter states
  const [savedSearch, setSavedSearch] = useState('');
  const [ageRange, setAgeRange] = useState([18, 65]);
  const [maritalStatus, setMaritalStatus] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [distance, setDistance] = useState('10');

  const newMembersScrollRef = useRef(null);
  const onlineMembersScrollRef = useRef(null);

  const fetchMembers = async () => {
    try {
      const [newRes, onlineRes] = await Promise.all([
        api.get('/users/members?limit=20'),
        api.get('/users/members?is_online=true&limit=20'),
      ]);

      const fetchedNew = newRes.data?.users || newRes.data?.data?.users || [];
      const fetchedOnline = onlineRes.data?.users || onlineRes.data?.data?.users || [];

      setNewMembers(fetchedNew);
      setOnlineMembers(fetchedOnline);
    } catch {
      setNewMembers([]);
      setOnlineMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Real-time socket online status updates
  useEffect(() => {
    if (!socket) return;

    const handleStatus = ({ userId, user_id, isOnline, is_online }) => {
      const targetId = userId ?? user_id;
      const statusOnline = isOnline ?? is_online;

      setNewMembers((prev) =>
        prev.map((m) => (String(m.id) === String(targetId) ? { ...m, is_online: statusOnline } : m))
      );

      setOnlineMembers((prev) => {
        const exists = prev.some((m) => String(m.id) === String(targetId));
        if (statusOnline && !exists) {
          const found = newMembers.find((m) => String(m.id) === String(targetId));
          if (found) return [{ ...found, is_online: true }, ...prev];
        }
        if (!statusOnline && exists) {
          return prev.filter((m) => String(m.id) !== String(targetId));
        }
        return prev.map((m) => (String(m.id) === String(targetId) ? { ...m, is_online: statusOnline } : m));
      });
    };

    socket.on('online_status', handleStatus);
    socket.on('user_online', ({ user_id }) => handleStatus({ user_id, is_online: true }));
    socket.on('user_offline', ({ user_id }) => handleStatus({ user_id, is_online: false }));

    return () => {
      socket.off('online_status', handleStatus);
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket, newMembers]);

  const scrollContainer = (ref, offset) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleSearchConfirm = () => {
    const params = new URLSearchParams();
    params.append('min_age', ageRange[0]);
    params.append('max_age', ageRange[1]);
    if (savedSearch) params.append('saved', savedSearch);
    if (maritalStatus) params.append('marital_status', maritalStatus);
    if (connectionStatus) params.append('connection_status', connectionStatus);
    if (distance) params.append('distance', distance);
    navigate(`/search?${params.toString()}`);
  };

  const getPhotoUrl = (member) => {
    if (!member) return '/img/profile-man.png';
    if (member.profile_photo?.startsWith('http') || member.profile_photo?.startsWith('/')) {
      return member.profile_photo;
    }
    if (member.profile_photo) {
      return `http://localhost:5000${member.profile_photo}`;
    }
    return member.gender === 'female' ? '/img/girl.png' : '/img/profile-man.png';
  };

  // Calculate real profile completion percentage based on DB fields
  const calculateCompletion = () => {
    let score = 20; // Active registered user
    if (user?.profile_photo) score += 25;
    if (user?.bio) score += 15;
    if (user?.age || user?.date_of_birth) score += 15;
    if (user?.city || user?.state) score += 15;
    if (user?.marital_status) score += 10;
    return Math.min(100, Math.max(35, score));
  };

  const completionPercent = calculateCompletion();

  return (
    <DashboardLayout>
      <div className="row g-3">
        {/* Main Feed Column (9 cols on lg) */}
        <div className="col-12 col-lg-9">
          <div className="row g-4">
            
            {/* 1. Real Profile Completion Card (4 cols on lg) */}
            <div className="col-lg-4">
              <div className="profile-card h-100 d-flex flex-column justify-content-between">
                <div className="d-flex gap-3 align-items-center mb-4">
                  <div className="profile-img2" style={{ overflow: 'visible' }}>
                    <img 
                      src={user?.profile_photo?.startsWith('http') || user?.profile_photo?.startsWith('/') ? user.profile_photo : (user?.profile_photo ? `http://localhost:5000${user.profile_photo}` : (user?.gender === 'female' ? '/img/girl.png' : '/img/profile-man.png'))}
                      alt={user?.username || 'avatar'}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div className="percent">{completionPercent}%</div>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-2">
                      <Link className="text-white text-decoration-none" to="/profile">
                        {user?.username || 'Member'}
                      </Link>
                    </h5>
                    <p className="mb-0 text-white-50">{user?.age ? `${user.age} years old` : 'Age unset'}</p>
                    <p className="mb-0 text-white-50">{user?.city || 'Location unset'}</p>
                    <p className="mb-0 text-white-50">{user?.state || user?.country || ''}</p>
                  </div>
                </div>
                <button className="btn-edit w-100" onClick={() => navigate('/profile')}>
                  <i className="bi bi-pencil me-2"></i> Edit Profile
                </button>
              </div>
            </div>

            {/* 2. Advanced Search Filter Card (8 cols on lg) */}
            <div className="col-lg-8">
              <div className="search-card h-100 d-flex flex-column justify-content-between">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="icon-circle text-danger"><i className="bi bi-search"></i></div>
                  <h5 className="fw-bold mb-0">Search</h5>
                </div>
                
                <div className="row align-items-end">
                  {/* Saved Search */}
                  <div className="col-md-4 mb-3">
                    <label className="fw-semibold mb-2 text-muted small">Saved Search</label>
                    <select 
                      className="form-select" 
                      value={savedSearch} 
                      onChange={(e) => setSavedSearch(e.target.value)}
                    >
                      <option value="">My saved search</option>
                      <option value="verified">Verified Profiles</option>
                      <option value="nearby">Nearby Singles</option>
                      <option value="online">Online Members</option>
                    </select>
                  </div>

                  {/* Age Range Slider */}
                  <div className="col-md-4 mb-3">
                    <label className="fw-semibold mb-2 text-muted small text-truncate d-block">
                      Aged between : {ageRange[0]} & {ageRange[1] >= 80 ? '80+' : ageRange[1]} years old
                    </label>
                    <div className="py-2">
                      <Slider
                        range
                        min={18}
                        max={80}
                        value={ageRange}
                        onChange={(val) => setAgeRange(val)}
                        trackStyle={[{ backgroundColor: '#c40000', height: 6 }]}
                        handleStyle={[
                          { borderColor: '#c40000', backgroundColor: '#c40000', width: 18, height: 18, marginTop: -6, opacity: 1, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' },
                          { borderColor: '#c40000', backgroundColor: '#c40000', width: 18, height: 18, marginTop: -6, opacity: 1, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' },
                        ]}
                        railStyle={{ backgroundColor: '#f5dada', height: 6 }}
                      />
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div className="col-md-4 mb-3">
                    <label className="fw-semibold mb-2 text-muted small">Marital status</label>
                    <select 
                      className="form-select" 
                      value={maritalStatus} 
                      onChange={(e) => setMaritalStatus(e.target.value)}
                    >
                      <option value="">Select an option</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="in_relationship">In Relationship</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>

                  {/* Connection Status */}
                  <div className="col-md-4 mb-3">
                    <label className="fw-semibold mb-2 text-muted small">Connection status</label>
                    <select 
                      className="form-select" 
                      value={connectionStatus} 
                      onChange={(e) => setConnectionStatus(e.target.value)}
                    >
                      <option value="">Select an option</option>
                      <option value="online">Online now</option>
                      <option value="verified">Verified only</option>
                      <option value="new">New members</option>
                    </select>
                  </div>

                  {/* Radius / Distance */}
                  <div className="col-md-4 mb-3">
                    <label className="fw-semibold mb-2 text-muted small">In an area of</label>
                    <select 
                      className="form-select" 
                      value={distance} 
                      onChange={(e) => setDistance(e.target.value)}
                    >
                      <option value="10">10km</option>
                      <option value="25">25km</option>
                      <option value="50">50km</option>
                      <option value="100">100km</option>
                      <option value="all">Any distance</option>
                    </select>
                  </div>

                  {/* Confirm Action Button */}
                  <div className="col-md-4 mb-3">
                    <button className="btn-red w-100" onClick={handleSearchConfirm}>
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Real Members Carousel Container (12 cols on lg) */}
            <div className="col-lg-12">
              
              {/* 3A. New Members Section */}
              <section className="members-section mb-4">
                <div className="section-head">
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-circle text-danger"><i className="bi bi-person-plus-fill"></i></div>
                    <h5 className="fw-bold mb-0">New Members</h5>
                  </div>
                  <Link to="/members" className="view-btn">
                    View all <i className="bi bi-chevron-double-right ms-2"></i>
                  </Link>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="arrow-btn flex-shrink-0" 
                    onClick={() => scrollContainer(newMembersScrollRef, -320)}
                    title="Previous"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>

                  <div className="member-row flex-grow-1" ref={newMembersScrollRef}>
                    {loading ? (
                      <div className="text-center py-4 w-100">
                        <div className="spinner-border spinner-border-sm text-danger me-2" />
                        Loading members...
                      </div>
                    ) : newMembers.length === 0 ? (
                      <div className="text-muted p-4 text-center w-100">No new members registered yet.</div>
                    ) : (
                      newMembers.map((member) => (
                        <Link 
                          to={`/view-profile/${member.id}`} 
                          className="member-card" 
                          key={member.id}
                        >
                          <img 
                            src={getPhotoUrl(member)} 
                            className="img-fluid" 
                            alt={member.username} 
                          />
                          <div className="member-info">
                            <b>{member.username}</b>
                            {member.state || member.city || member.country || 'India'}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  <button 
                    className="arrow-btn flex-shrink-0" 
                    onClick={() => scrollContainer(newMembersScrollRef, 320)}
                    title="Next"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </section>

              {/* 3B. Online Members Section */}
              <section className="members-section">
                <div className="section-head">
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-circle text-danger"><i className="bi bi-circle-fill"></i></div>
                    <h5 className="fw-bold mb-0">Online Members</h5>
                  </div>
                  <Link to="/members" className="view-btn">
                    View all <i className="bi bi-chevron-double-right ms-2"></i>
                  </Link>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="arrow-btn flex-shrink-0" 
                    onClick={() => scrollContainer(onlineMembersScrollRef, -320)}
                    title="Previous"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>

                  <div className="member-row flex-grow-1" ref={onlineMembersScrollRef}>
                    {loading ? (
                      <div className="text-center py-4 w-100">
                        <div className="spinner-border spinner-border-sm text-danger me-2" />
                        Loading online members...
                      </div>
                    ) : onlineMembers.length === 0 ? (
                      <div className="text-muted p-4 text-center w-100">No members online right now.</div>
                    ) : (
                      onlineMembers.map((member) => (
                        <Link 
                          to={`/view-profile/${member.id}`} 
                          className="member-card" 
                          key={member.id}
                        >
                          <img 
                            src={getPhotoUrl(member)} 
                            className="img-fluid" 
                            alt={member.username} 
                          />
                          <div className="member-info">
                            <b>{member.username}</b>
                            {member.state || member.city || member.country || 'India'}
                          </div>
                          <span className="online-dot"></span>
                        </Link>
                      ))
                    )}
                  </div>

                  <button 
                    className="arrow-btn flex-shrink-0" 
                    onClick={() => scrollContainer(onlineMembersScrollRef, 320)}
                    title="Next"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </section>

            </div>

          </div>
        </div>

        {/* Right Sidebar Column (3 cols on lg) */}
        <div className="col-12 col-lg-3">
          <RightBar />
        </div>

      </div>
    </DashboardLayout>
  );
}
