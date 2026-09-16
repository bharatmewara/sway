import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import RightBar from '../components/RightBar';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ViewProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/profile/${id}`);
        // Profile API returns either res.data.user or res.data depending on structure
        setProfile(res.data.user || res.data);
      } catch(e) {
        toast.error('Failed to load profile');
      }
    };
    fetchProfile();
  }, [id]);

  const sendCrush = async () => {
    try {
      await api.post('/crushes', { user_id: id });
      toast.success('Crush sent! (-5 credits)');
    } catch(e) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Failed to send crush');
    }
  };

  const sendRequest = async () => {
    try {
      await api.post('/requests', { user_id: id });
      toast.success('Request sent! (-5 credits)');
    } catch(e) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Failed to send request');
    }
  };

  const blockUser = async () => {
    if (!window.confirm("Are you sure you want to block this user?")) return;
    try {
      await api.post('/social/block', { blocked_id: id, reason: 'Blocked from profile' });
      toast.success('User blocked successfully.');
      navigate('/home');
    } catch (e) {
      toast.error('Failed to block user');
    }
  };

  const reportUser = async () => {
    const reason = window.prompt("Why are you reporting this user?");
    if (!reason) return;
    try {
      await api.post('/social/report', { reported_id: id, reason, description: 'Reported from profile page' });
      toast.success('Report submitted. Our team will review it.');
    } catch (e) {
      toast.error('Failed to report user');
    }
  };

  const startChat = () => {
    navigate(`/chat/${id}`);
  };

  const renderArrayValues = (str) => {
    if (!str) return <li>Not specified</li>;
    try {
      let arr = Array.isArray(str) ? str : JSON.parse(str);
      if (arr.length === 0) return <li>Not specified</li>;
      return arr.map((item, idx) => <li key={idx}>{item}</li>);
    } catch (e) {
      return <li>{str}</li>;
    }
  };

  if (!profile) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <section className="content">
        <div className="row g-3">
          <div className="col-12 col-lg-9">
            <div className="row g-4">
              {/* LEFT PROFILE */}
              <div className="col-lg-4">
                <div className="profile-card2">
                  <div className="text-center mb-4">
                    <div className="position-relative d-inline-block">
                      <img 
                        src={profile.profile_photo ? `http://localhost:5000${profile.profile_photo}` : (profile.gender === 'female' ? '/img/girl.png' : '/img/boy.png')} 
                        className="profile-avatar" 
                        alt="Profile" 
                        style={{objectFit: 'cover'}}
                      />
                      {profile.is_online && <span className="online-dot"></span>}
                    </div>

                    <h4 className="mt-3 fw-bold">{profile.username}</h4>

                    <div className={profile.is_online ? "text-success" : "text-muted"}>
                      ● {profile.is_online ? 'Online' : 'Offline'}
                    </div>
                  </div>

                  <div className="mb-4 profile-list">
                    <div className="item">
                      <button onClick={sendCrush} className="text-black tdn bg-transparent border-0 p-0 text-start w-100">
                        <i className="bi bi-heart-fill me-2 text-danger"></i> Send a crush alert
                      </button>
                    </div>
                    <div className="item">
                      <button onClick={blockUser} className="text-black tdn bg-transparent border-0 p-0 text-start w-100">
                        <i className="bi bi-ban-fill me-2"></i> Block this profile
                      </button>
                    </div>
                    <div className="item">
                      <button onClick={reportUser} className="text-black tdn bg-transparent border-0 p-0 text-start w-100">
                         <i className="bi bi-flag-fill me-2 text-warning"></i> Report abusive user
                      </button>
                    </div>
                    <div>
                      <div className="row mt-3 mb-3"> 
                        <button onClick={startChat} className="btn-red w-100 mb-3">
                          <i className="bi bi-chat-quote-fill me-3"></i>
                          Chat
                        </button>
                      
                        <button onClick={sendRequest} className="btn-red w-100">
                          <i className="bi bi-envelope-fill me-3"></i>
                          Send Connection Request
                        </button> 
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHAT / INFO */}
              <div className="col-lg-8">
                {profile.bio && (
                  <div className="profile-card2 h-auto mb-4">
                    <h5 className="fw-bold mb-4">INTRODUCTION PARAGRAPH</h5>
                    <p style={{whiteSpace: 'pre-wrap'}}>{profile.bio}</p>
                  </div>
                )}
                
                <div className="profile-card2 h-auto mb-4">
                  <h5 className="fw-bold mb-4">Personal Information</h5>
                  <div className="d-flex justify-content-between mb-2">
                    <label className="form-label small">Age</label>
                    <div>{profile.age || 'Not specified'}</div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <label className="form-label small">Gender</label>
                    <div className="text-capitalize">{profile.gender || 'Not specified'}</div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <label className="form-label small">Marital Status</label>
                    <div>{profile.marital_status || 'Not specified'}</div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <label className="form-label small">Children</label>
                    <div>{profile.children || 'Not specified'}</div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <label className="form-label small">Occupation</label>
                    <div>{profile.profession || 'Not specified'}</div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <label className="form-label small">Height</label>
                    <div>{profile.height ? `${profile.height} cm` : 'Not specified'}</div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <label className="form-label small">Body Type</label>
                    <div>{profile.body_type || 'Not specified'}</div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <label className="form-label small">Ethnicity</label>
                    <div>{profile.ethnicity || 'Not specified'}</div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <label className="form-label small">Smoker</label>
                    <div>{profile.smoker || 'Not specified'}</div>
                  </div>
                </div>
              
                <div className="profile-card2 h-auto">
                  
                  {profile.personality_traits && (
                    <div className="mb-4">
                      <h5 className="fw-bold text-dark mb-4">My Personality</h5>
                      <div className="row">
                        <div className="col-md-12">
                            <ul className="list-unstyled personality-list d-flex flex-wrap gap-4">
                                {renderArrayValues(profile.personality_traits)}
                            </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.relationship_expectations && (
                    <div className="mb-4">
                        <h5 className="fw-bold text-dark mb-4">Relationship Sought</h5>
                        <div className="row">
                            <div className="col-md-12">
                                <ul className="list-unstyled personality-list d-flex flex-wrap gap-4">
                                    {renderArrayValues(profile.relationship_expectations)}
                                </ul>
                            </div>
                        </div>
                    </div>
                  )}

                  {profile.sports && (
                    <div className="mb-4">
                        <h5 className="fw-bold text-dark mb-4">Sports</h5>
                        <div className="row">
                            <div className="col-md-12">
                                <ul className="list-unstyled personality-list d-flex flex-wrap gap-4">
                                    {renderArrayValues(profile.sports)}
                                </ul>
                            </div>
                        </div>
                    </div>
                  )}
                  
                  {profile.hobbies && (
                    <div className="mb-4">
                        <h5 className="fw-bold text-dark mb-4">Hobbies</h5>
                        <div className="row">
                            <div className="col-md-12">
                                <ul className="list-unstyled personality-list d-flex flex-wrap gap-4">
                                    {renderArrayValues(profile.hobbies)}
                                </ul>
                            </div>
                        </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-lg-3">
             <RightBar />
          </div>

        </div>
      </section>
    </DashboardLayout>
  );
}