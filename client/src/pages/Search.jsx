import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useSocket from '../hooks/useSocket';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export default function Search() {
  const { socket } = useSocket();
  const [results, setResults] = useState([]);
  
  // Search Filters
  const [ageRange, setAgeRange] = useState([18, 60]);
  const [heightRange, setHeightRange] = useState([150, 220]);
  const [maritalStatus, setMaritalStatus] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [onlineStatus, setOnlineStatus] = useState('');
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('');

  // Rightbar state
  const [convos, setConvos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [visitors, setVisitors] = useState([]);

  useEffect(() => {
    const fetchRightbar = async () => {
      try {
        const [cRes, rRes, vRes] = await Promise.all([
          api.get('/messages/conversations'),
          api.get('/requests'),
          api.get('/visitors')
        ]);
        if(cRes.data.success) setConvos(cRes.data.conversations);
        if(rRes.data.success) setRequests(rRes.data.requests || []);
        if(vRes.data.success) setVisitors(vRes.data.visitors);
      } catch (e) {}
    };
    fetchRightbar();
    // Fetch initial search automatically
    handleSearch();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleOnline = ({ user_id }) => {
        setResults(prev => prev.map(u => u.id === user_id ? { ...u, is_online: true } : u));
        setConvos(prev => prev.map(c => c.other_user_id === user_id ? { ...c, other_is_online: true } : c));
      };
      const handleOffline = ({ user_id }) => {
        setResults(prev => prev.map(u => u.id === user_id ? { ...u, is_online: false } : u));
        setConvos(prev => prev.map(c => c.other_user_id === user_id ? { ...c, other_is_online: false } : c));
      };

      socket.on('user_online', handleOnline);
      socket.on('user_offline', handleOffline);

      return () => {
        socket.off('user_online', handleOnline);
        socket.off('user_offline', handleOffline);
      };
    }
  }, [socket]);

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      params.append('min_age', ageRange[0]);
      params.append('max_age', ageRange[1]);
      params.append('min_height', heightRange[0]);
      params.append('max_height', heightRange[1]);
      if (maritalStatus) params.append('marital_status', maritalStatus);
      if (relationshipType) params.append('relationship_type', relationshipType);
      if (onlineStatus) params.append('is_online', onlineStatus === 'online' ? 'true' : 'false');
      if (city) params.append('city', city);
      
      const res = await api.get(`/users/members?${params.toString()}`);
      if (res.data.success) setResults(res.data.users);
    } catch(e) {
      toast.error('Search failed');
    }
  };

  return (
    <DashboardLayout>
      <section className="content">
        <div className="row g-3">
          
          {/* MAIN COLUMN */}
          <div className="col-12 col-lg-9">
            
            <div className="d-flex gap-2 mb-4 align-items-center justify-content-between">
              <h4 className="fw-bold mb-0">Search</h4>
              <div className="custom-search">
                <div className="search-wrapper d-flex gap-3">
                  <select className="form-select search-select">
                    <option defaultValue>My saved search</option>
                    <option>Profile Search</option>
                    <option>Advanced Search</option>
                    <option>Recent Search</option>
                  </select>
                  <button className="search-btn btn-red" onClick={handleSearch}>
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="search-card mb-3">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="icon-circle text-danger"><i className="bi bi-search"></i></div>
                <h5 className="fw-bold mb-0">Search Parameters</h5>
              </div>
              <div className="row align-items-end">
                
                <div className="col-md-6 mb-4 mt-2">
                  <label className="fw-semibold mb-3">Age</label>
                  <Slider 
                    range 
                    min={18} 
                    max={99} 
                    value={ageRange} 
                    onChange={setAgeRange} 
                    trackStyle={[{backgroundColor: '#b80c09', height: 6}]}
                    railStyle={{backgroundColor: '#e9ecef', height: 6}}
                    handleStyle={[
                      {backgroundColor: '#b80c09', borderColor: '#b80c09', height: 22, width: 22, marginTop: -8, opacity: 1, boxShadow: 'none'},
                      {backgroundColor: '#b80c09', borderColor: '#b80c09', height: 22, width: 22, marginTop: -8, opacity: 1, boxShadow: 'none'}
                    ]}
                  />
                </div>
                
                <div className="col-md-6 mb-4 mt-2">
                  <label className="fw-semibold mb-3">Height</label>
                  <Slider 
                    range
                    min={120} 
                    max={250} 
                    value={heightRange} 
                    onChange={setHeightRange} 
                    trackStyle={[{backgroundColor: '#b80c09', height: 6}]}
                    railStyle={{backgroundColor: '#e9ecef', height: 6}}
                    handleStyle={[
                      {backgroundColor: '#b80c09', borderColor: '#b80c09', height: 22, width: 22, marginTop: -8, opacity: 1, boxShadow: 'none'},
                      {backgroundColor: '#b80c09', borderColor: '#b80c09', height: 22, width: 22, marginTop: -8, opacity: 1, boxShadow: 'none'}
                    ]}
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="fw-semibold mb-2">Marital status:</label>
                  <select className="form-select" value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)}>
                    <option value="">Select options</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="fw-semibold mb-2">Type of relationship</label>
                  <select className="form-select" value={relationshipType} onChange={e => setRelationshipType(e.target.value)}>
                    <option value="">Select an option</option>
                    <option value="friends">Friends</option>
                    <option value="dating">Dating</option>
                    <option value="marriage">Marriage</option>
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="fw-semibold mb-2">Online status</label>
                  <select className="form-select" value={onlineStatus} onChange={e => setOnlineStatus(e.target.value)}>
                    <option value="">No preference</option>
                    <option value="online">Online now</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                
              </div> 
            </div>

            <div className="search-card mb-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="icon-circle text-danger"><i className="bi bi-map"></i></div>
                <h5 className="fw-bold mb-0">LOCATION</h5>
              </div>
              <div className="row align-items-end">
                <div className="col-md-6 mb-3">
                  <label className="fw-semibold mb-2">Country:</label>
                  <select className="form-select" value={country} onChange={e => setCountry(e.target.value)}>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="fw-semibold mb-2">City or post code:</label>
                  <input type="text" className="form-control" placeholder="e.g. Jaipur" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="col-md-12 mb-3">
                  <button className="btn-red w-100 py-2 rounded-3" onClick={handleSearch}>Search Members</button>
                </div>
              </div> 
            </div>

            {/* SEARCH RESULTS */}
            <h5 className="fw-bold mb-3">Search Results ({results.length})</h5>
            <div className="row g-3">
              {results.length > 0 ? results.map(m => (
                <div className="col-md-4 mb-4" key={m.id}>
                  <Link to={`/view-profile/${m.id}`} className="member-card d-block h-100 rounded-4 overflow-hidden position-relative shadow-sm border-0">
                    <img 
                      src={m.profile_photo ? `http://localhost:5000${m.profile_photo}` : (m.gender === 'female' ? '/img/girl.png' : '/img/boy.png')} 
                      className="w-100 h-100" 
                      style={{objectFit: 'cover', minHeight: '260px'}} 
                      alt="profile"
                    />
                    <div className="position-absolute bottom-0 start-0 p-3 text-white w-100" style={{background: 'linear-gradient(transparent, rgba(0,0,0,0.85))'}}>
                      <h5 className="mb-0 fw-bold">{m.username}, {m.age}</h5>
                      <small><i className="bi bi-geo-alt-fill me-1"></i>{m.city}, {m.state}</small>
                    </div>
                    {m.is_online && <span className="position-absolute top-0 end-0 m-3 badge bg-success rounded-pill">Online</span>}
                  </Link>
                </div>
              )) : (
                <div className="col-12">
                   <div className="alert alert-light text-center py-5">
                      <i className="bi bi-search display-4 text-muted d-block mb-3"></i>
                      <p className="text-muted mb-0">No members found matching your search criteria.</p>
                   </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHTBAR COLUMN */}
          <div className="col-12 col-lg-3">
            
            <div className="rightbar mb-4">
              <div className="d-flex justify-content-between mb-2">
                <h6 className="fw-bold">Active Conversations</h6>
              </div>
              <div className="scrool_right">
                {convos.length > 0 ? convos.map(c => (
                  <Link to={`/chat/${c.other_user_id}`} className="text-decoration-none text-dark" key={c.conversation_id}>
                    <div className="user-row">
                      {c.other_photo ? (
                        <img src={`http://localhost:5000${c.other_photo}`} className="avatar rounded-circle" alt="avatar" style={{objectFit: 'cover'}} />
                      ) : (
                        <div className="avatar bg-secondary rounded-circle"></div>
                      )}
                      <div>
                        <b>{c.other_username}</b><br/>
                        {c.other_is_online ? (
                           <small><span className="small-dot bg-success"></span> Online</small>
                         ) : (
                           <small>Offline</small>
                         )}
                      </div>
                      {c.unread_count > 0 && <span className="badge-dot">{c.unread_count}</span>}
                    </div>
                  </Link>
                )) : (
                  <div className="text-muted small">No active chats</div>
                )}
              </div>
            </div>

            <div className="rightbar mb-4">
              <div className="d-flex justify-content-between mb-2">
                <h6 className="fw-bold">Chat Requests</h6>
              </div>
              <div className="scrool_right">
                {requests.length > 0 ? requests.map(r => (
                  <div className="user-row" key={r.id}>
                    {r.profile_photo ? (
                      <img src={`http://localhost:5000${r.profile_photo}`} className="avatar rounded-circle" alt="avatar" style={{objectFit: 'cover'}} />
                    ) : (
                      <div className="avatar bg-secondary rounded-circle"></div>
                    )}
                    <div>
                      <b>{r.username}</b><br/>
                      <small className="text-danger">Requested</small>
                    </div>
                  </div>
                )) : (
                  <div className="text-muted small">No requests</div>
                )}
              </div>
            </div>

            <div className="rightbar mb-4">
              <div className="d-flex justify-content-between mb-2">
                <h6 className="fw-bold">Who Viewed You</h6>
                {visitors.length > 0 && <Link to="/visitors" className="text-danger small text-decoration-none">See All</Link>}
              </div>
              <div className="d-flex flex-wrap gap-1">
                {visitors.slice(0, 4).map(v => (
                  <img 
                    key={v.visitor_id} 
                    src={v.profile_photo ? `http://localhost:5000${v.profile_photo}` : '/img/profile.jpg'} 
                    className="profile-img d-inline-block rounded-circle" 
                    style={{width:40, height:40, objectFit: 'cover'}} 
                    alt="visitor" 
                  />
                ))}
                {visitors.length > 4 && (
                  <span className="profile-img bg-light text-dark text-center d-flex align-items-center justify-content-center rounded-circle" style={{width:40, height:40, fontSize: '0.8rem'}}>
                    +{visitors.length - 4}
                  </span>
                )}
                {visitors.length === 0 && <span className="text-muted small">No visitors yet</span>}
              </div>
            </div>

          </div>

        </div>
      </section>
    </DashboardLayout>
  );
}