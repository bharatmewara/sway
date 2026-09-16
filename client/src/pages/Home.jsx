import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import RightBar from '../components/RightBar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import useSocket from '../hooks/useSocket';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newMembers, setNewMembers] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  
  const [ageRange, setAgeRange] = useState([18, 60]);
  const [maritalStatus, setMaritalStatus] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');

  const newMembersRef = useRef(null);
  const onlineMembersRef = useRef(null);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res1 = await api.get('/users/members?limit=15');
        setNewMembers(res1.data.users || []);
        
        const res2 = await api.get('/users/members?is_online=true&limit=15');
        setOnlineMembers(res2.data.users || []);
      } catch(e) {}
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleStatus = ({ userId, isOnline, lastSeen }) => {
      setNewMembers(prev => prev.map(m => m.id === userId ? { ...m, is_online: isOnline, last_seen: lastSeen } : m));
      
      setOnlineMembers(prev => {
        const existing = prev.find(m => m.id === userId);
        if (isOnline && !existing) {
          const m = newMembers.find(member => member.id === userId);
          if (m) return [{ ...m, is_online: true }, ...prev];
        }
        if (!isOnline && existing) {
          return prev.filter(m => m.id !== userId);
        }
        return prev.map(m => m.id === userId ? { ...m, is_online: isOnline } : m);
      });
    };

    socket.on('online_status', handleStatus);
    return () => socket.off('online_status', handleStatus);
  }, [socket, newMembers]);

  const handleSearchConfirm = () => {
    const params = new URLSearchParams();
    params.append('min_age', ageRange[0]);
    params.append('max_age', ageRange[1]);
    if (maritalStatus) params.append('marital_status', maritalStatus);
    if (connectionStatus === 'online') params.append('is_online', 'true');
    navigate(`/search?${params.toString()}`);
  };

  const scrollLeft = (ref) => {
    if (ref.current) ref.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = (ref) => {
    if (ref.current) ref.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const getAvatar = (m) => m.profile_photo ? `http://localhost:5000${m.profile_photo}` : (m.gender === 'female' ? '/img/girl.png' : '/img/boy.png');

  // Compute profile completion 
  const completion = user?.profile_photo ? 85 : 55;

  return (
    <DashboardLayout>
      <div className="row g-3">
        {/* Main Content Area */}
        <div className="col-12 col-lg-9">
          <div className="row g-4">
            
            {/* Profile Card */}
            <div className="col-lg-4">
              <div className="profile-card">
                <div className="d-flex gap-3 align-items-center mb-4">
                  <div className="profile-img2 position-relative" style={{ background: `conic-gradient(#ec3b79 ${completion}%, #eee ${completion}%)`, borderRadius: '50%', padding: 4, width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="percent" style={{ 
                      background: user?.profile_photo ? `url(http://localhost:5000${user.profile_photo}) center/cover` : '#fff', 
                      borderRadius: '50%', width: '100%', height: '100%'
                    }}></div>
                    <span className="badge bg-danger position-absolute" style={{ bottom: -8, fontSize: '0.7rem', borderRadius: '12px', border: '2px solid white', padding: '3px 6px' }}>
                      {completion}%
                    </span>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-2">
                      <Link className="text-dark text-decoration-none" to={`/view-profile/${user?.id}`}>{user?.username}</Link>
                    </h5>
                    <p className="mb-0">{user?.age || 25} years old</p>
                    <p className="mb-0">{user?.city || 'City'}</p>
                    <p className="mb-0">{user?.state || 'State'}</p>
                  </div>
                </div>
                <button className="btn-edit w-100" onClick={() => navigate('/profile')}>
                  <i className="bi bi-pencil me-2"></i> Edit Profile
                </button>
              </div>
            </div>

            {/* Search Card */}
            <div className="col-lg-8">
              <div className="search-card">
                <div className="d-flex align-items-center gap-3">
                  <div className="icon-circle text-danger"><i className="bi bi-search"></i></div>
                  <h5 className="fw-bold mb-0">Search</h5>
                </div>
                <div className="row align-items-end">
                  <div className="col-md-4 mb-3">
                    <label className="fw-semibold mb-2 text-muted">Aged between : {ageRange[0]} & {ageRange[1]} years old</label>
                    <Slider
                      range
                      min={18}
                      max={100}
                      value={ageRange}
                      onChange={setAgeRange}
                      trackStyle={[{ backgroundColor: '#b80c09', height: 8 }]}
                      handleStyle={[
                        { borderColor: '#b80c09', backgroundColor: '#b80c09', width: 20, height: 20, marginTop: -6 },
                        { borderColor: '#b80c09', backgroundColor: '#b80c09', width: 20, height: 20, marginTop: -6 }
                      ]}
                      railStyle={{ backgroundColor: '#e9ecef', height: 8 }}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="fw-semibold mb-2">Marital status</label>
                    <select className="form-select" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}>
                      <option value="">Select an option</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="fw-semibold mb-2">Connection status</label>
                    <select className="form-select" value={connectionStatus} onChange={(e) => setConnectionStatus(e.target.value)}>
                      <option value="">Select an option</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="fw-semibold mb-2">In an area of</label>
                    <select className="form-select">
                      <option value="">Any distance</option>
                      <option value="10">10km</option>
                      <option value="50">50km</option>
                      <option value="100">100km</option>
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <button className="btn-red w-100" onClick={handleSearchConfirm}>Confirm</button>
                  </div>
                </div>
              </div>
            </div>

            {/* New Members Section */}
            <div className="col-lg-12">
              <section className="members-section mb-4">
                <div className="section-head mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-circle text-danger"><i className="bi bi-person-plus-fill"></i></div>
                    <h5 className="fw-bold mb-0">New Members</h5>
                  </div>
                  <Link to="/members" className="view-btn text-decoration-none">View all <i className="bi bi-chevron-double-right ms-2"></i></Link>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button className="arrow-btn flex-shrink-0" onClick={() => scrollLeft(newMembersRef)}><i className="bi bi-chevron-left"></i></button>

                  <div className="member-row flex-grow-1 overflow-hidden d-flex gap-3 px-2" ref={newMembersRef} style={{ scrollBehavior: 'smooth' }}>
                    {newMembers.map(m => (
                      <Link to={`/view-profile/${m.id}`} className="member-card text-decoration-none position-relative" key={m.id} style={{ minWidth: 140 }}>
                        <img src={getAvatar(m)} className="img-fluid rounded-3" style={{ width: 140, height: 180, objectFit: 'cover' }} alt={m.username} />
                        {m.is_online && <span className="online-dot position-absolute top-0 end-0 m-2" style={{ width: 12, height: 12, background: '#4caf50', borderRadius: '50%', border: '2px solid #fff' }}></span>}
                        <div className="member-info position-absolute bottom-0 start-0 w-100 p-2 text-white" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                          <b className="d-block">{m.username}</b>
                          <small>{m.city || 'Unknown'}</small>
                        </div> 
                      </Link>
                    ))}
                    {newMembers.length === 0 && <p className="text-muted p-3">No new members found.</p>}
                  </div>

                  <button className="arrow-btn flex-shrink-0" onClick={() => scrollRight(newMembersRef)}><i className="bi bi-chevron-right"></i></button>
                </div>
              </section>

              {/* Online Members Section */}
              <section className="members-section">
                <div className="section-head mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-circle text-success"><i className="bi bi-circle-fill"></i></div>
                    <h5 className="fw-bold mb-0">Online Members</h5>
                  </div>
                  <Link to="/search?is_online=true" className="view-btn text-decoration-none">View all <i className="bi bi-chevron-double-right ms-2"></i></Link>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button className="arrow-btn flex-shrink-0" onClick={() => scrollLeft(onlineMembersRef)}><i className="bi bi-chevron-left"></i></button>

                  <div className="member-row flex-grow-1 overflow-hidden d-flex gap-3 px-2" ref={onlineMembersRef} style={{ scrollBehavior: 'smooth' }}>
                    {onlineMembers.map(m => (
                      <Link to={`/view-profile/${m.id}`} className="member-card text-decoration-none position-relative" key={m.id} style={{ minWidth: 140 }}>
                        <img src={getAvatar(m)} className="img-fluid rounded-3" style={{ width: 140, height: 180, objectFit: 'cover' }} alt={m.username} />
                        <span className="online-dot position-absolute top-0 end-0 m-2" style={{ width: 12, height: 12, background: '#4caf50', borderRadius: '50%', border: '2px solid #fff' }}></span>
                        <div className="member-info position-absolute bottom-0 start-0 w-100 p-2 text-white" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                          <b className="d-block">{m.username}</b>
                          <small>{m.city || 'Unknown'}</small>
                        </div>
                      </Link>
                    ))}
                    {onlineMembers.length === 0 && <p className="text-muted p-3">No members online right now.</p>}
                  </div>

                  <button className="arrow-btn flex-shrink-0" onClick={() => scrollRight(onlineMembersRef)}><i className="bi bi-chevron-right"></i></button>
                </div>
              </section>
            </div>

          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-12 col-lg-3">
          <RightBar />
        </div>

      </div>
    </DashboardLayout>
  );
}