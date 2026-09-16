import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useSocket from '../hooks/useSocket';

export default function Requests() {
  const { socket } = useSocket();
  const [requests, setRequests] = useState([]);
  const [convos, setConvos] = useState([]);
  const [visitors, setVisitors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, rRes, vRes] = await Promise.all([
          api.get('/messages/conversations'),
          api.get('/requests'),
          api.get('/visitors')
        ]);
        if(cRes.data.success) setConvos(cRes.data.conversations);
        if(rRes.data.success) setRequests(rRes.data.requests || []);
        if(vRes.data.success) setVisitors(vRes.data.visitors);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleOnline = ({ user_id }) => {
        setConvos(prev => prev.map(c => c.other_user_id === user_id ? { ...c, other_is_online: true } : c));
      };
      const handleOffline = ({ user_id }) => {
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

  const accept = async (id, e) => {
    e.preventDefault();
    try {
      await api.put(`/requests/${id}/accept`);
      setRequests(requests.filter(r => r.id !== id));
      toast.success("Request accepted!");
    } catch (err) {
      toast.error("Failed to accept request");
    }
  };

  const reject = async (id, e) => {
    e.preventDefault();
    if (!window.confirm("Delete this request?")) return;
    try {
      await api.delete(`/requests/${id}`);
      setRequests(requests.filter(r => r.id !== id));
      toast.success("Request deleted");
    } catch (err) {
      toast.error("Failed to delete request");
    }
  };

  const formatTime = (iso) => {
    if(!iso) return '';
    return new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };
  
  const formatDate = (iso) => {
    if(!iso) return '';
    return new Date(iso).toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <section className="content">
        <div className="row g-3">
          
          <div className="col-12 col-lg-9">
            <h4 className="fw-bold mb-3">Requests</h4>
            <div className="row">
              {requests.length > 0 ? requests.map(r => (
                <div className="col-12 col-lg-4" key={r.id}> 
                  <div className="card border-0 shadow-sm conversation-card mb-3 position-relative">
                    <button className="trash-btn mb-2" onClick={(e) => reject(r.id, e)}>
                      <i className="bi bi-trash-fill"></i>
                    </button>
                    <Link to={`/view-profile/${r.sender_id}`} className="card-body p-4 text-center text-decoration-none text-dark d-block"> 
                      <div> 
                        <img 
                          src={r.profile_photo ? `http://localhost:5000${r.profile_photo}` : '/img/profile.jpg'}
                          className="profile-img-private-chat"
                          alt="Profile" 
                          style={{objectFit: 'cover'}}
                        /> 
                        <div className="mt-3">
                          <h5 className="mb-1 fw-bold">
                            {r.username}
                          </h5>
                        </div>
                      </div> 
                      
                      <div className="mt-3">
                         <button className="btn btn-wine btn-sm w-100 mb-2" onClick={(e)=>accept(r.id, e)}>Accept</button>
                      </div>

                      <div className="d-inline-flex gap-2 mt-2">
                        <div className="fw-bold ">{formatDate(r.created_at)}</div>
                        <div className="text-muted mb-2">{formatTime(r.created_at)}</div>
                      </div>
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="col-12"><p className="text-muted">No pending requests.</p></div>
              )}
            </div>
          </div>

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