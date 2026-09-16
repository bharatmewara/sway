import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import RightBar from '../components/RightBar';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Members() {
  const [members, setMembers] = useState([]);
  const { setActiveChatUserId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users/members').then(res => setMembers(res.data.users)).catch(e => console.log(e));
  }, []);

  const handleMessage = (e, userId) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveChatUserId(userId);
  };

  const handleCrush = async (e, userId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.post('/crushes', { user_id: userId });
      if (res.data.success) {
        toast.success('Crush sent successfully!');
      }
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to send crush');
    }
  };

  const handleRequest = async (e, userId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.post('/requests', { user_id: userId });
      if (res.data.success) {
        toast.success('Connection request sent!');
      }
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  // Helper to format last active (just a rough estimate based on last_seen if available)
  const formatLastActive = (dateString, isOnline) => {
    if (isOnline) return 'Active now';
    if (!dateString) return 'Active recently';
    
    const diffMs = new Date() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `Last active: ${diffMins} min ago`;
    if (diffHours < 24) return `Last active: ${diffHours} hours ago`;
    return `Last active: ${diffDays} days ago`;
  };

  return (
    <DashboardLayout>
      <div className="row g-4">
        {/* Main Content Area */}
        <div className="col-12 col-lg-9">
          <h3 className="mb-4 fw-bold" style={{ color: '#2b1111' }}>New members</h3>
          
          <div className="row g-4">
            {members.map(m => (
              <div className="col-md-4 col-sm-6" key={m.id}>
                <Link to={`/view-profile/${m.id}`} className="text-decoration-none text-dark">
                  <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                    <div className="card-body text-center d-flex flex-column align-items-center p-4">
                      
                      {/* Avatar */}
                      <div 
                        className="mb-3" 
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          borderRadius: '16px', 
                          border: '2px solid #76000b', 
                          padding: '2px',
                          overflow: 'hidden'
                        }}
                      >
                        <img 
                          src={m.profile_photo ? `http://localhost:5000${m.profile_photo}` : (m.gender === 'female' ? '/img/girl.png' : '/img/boy.png')} 
                          className="w-100 h-100" 
                          style={{ objectFit: 'cover', borderRadius: '12px' }} 
                          alt={m.username}
                        />
                      </div>
                      
                      {/* Name & Online Status */}
                      <h5 className="fw-bold mb-1 d-flex justify-content-center align-items-center gap-2">
                        {m.username}
                        {m.is_online && <span className="bg-danger rounded-circle" style={{ width: '10px', height: '10px', display: 'inline-block' }}></span>}
                      </h5>
                      
                      <p className="text-muted small mb-3">
                        {formatLastActive(m.last_seen, m.is_online)}
                      </p>

                      <div className="text-center small mb-4">
                        <div className="mb-1">{m.age || 25} years old</div>
                        <div className="mb-1">{m.city || 'City'}</div>
                        <div className="mb-1">{m.state || 'State'}</div>
                        <div className="mb-1">{m.country || 'India'}</div>
                      </div>

                      {/* Actions */}
                      <div className="mt-auto d-flex gap-3 justify-content-center w-100">
                        <button 
                          className="btn border-0 rounded" 
                          style={{ backgroundColor: '#fce8e8', color: '#76000b', width: '40px', height: '40px' }}
                          onClick={(e) => handleMessage(e, m.id)}
                          title="Send Message"
                        >
                          <i className="bi bi-envelope-fill"></i>
                        </button>
                        <button 
                          className="btn border-0 rounded" 
                          style={{ backgroundColor: '#fce8e8', color: '#76000b', width: '40px', height: '40px' }}
                          onClick={(e) => handleCrush(e, m.id)}
                          title="Send Crush"
                        >
                          <i className="bi bi-heart-fill"></i>
                        </button>
                        <button 
                          className="btn border-0 rounded" 
                          style={{ backgroundColor: '#fce8e8', color: '#76000b', width: '40px', height: '40px' }}
                          onClick={(e) => handleRequest(e, m.id)}
                          title="Send Request"
                        >
                          <i className="bi bi-chat-left-dots-fill"></i>
                        </button>
                      </div>

                    </div>
                  </div>
                </Link>
              </div>
            ))}
            
            {members.length === 0 && (
              <div className="col-12 text-center mt-5 text-muted">
                No members found.
              </div>
            )}
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