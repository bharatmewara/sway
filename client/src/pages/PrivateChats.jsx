import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useSocket from '../hooks/useSocket';

export default function PrivateChats() {
  const { socket } = useSocket();
  const [convos, setConvos] = useState([]);
  const [requests, setRequests] = useState([]);
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

  const deleteConvo = async (userId, e) => {
    e.preventDefault();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api.delete(`/messages/conversation/${userId}`);
      setConvos(convos.filter(c => c.other_user_id !== userId));
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error("Failed to delete conversation");
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
            <h4 className="fw-bold mb-3">Private Messages</h4>
            <div className="row">
              {convos.length > 0 ? convos.map(c => (
                <div className="col-12 col-lg-4" key={c.conversation_id}> 
                  <div className="card border-0 shadow-sm conversation-card mb-3 position-relative">
                    <button className="trash-btn mb-2" onClick={(e) => deleteConvo(c.other_user_id, e)}>
                      <i className="bi bi-trash-fill"></i>
                    </button>
                    <Link to={`/chat/${c.other_user_id}`} className="card-body p-4 text-center text-decoration-none text-dark d-block"> 
                      <div className="mb-3"> 
                        <img 
                          src={c.other_photo ? `http://localhost:5000${c.other_photo}` : '/img/profile.jpg'}
                          className="profile-img-private-chat"
                          alt="Profile" 
                          style={{objectFit: 'cover'}}
                        /> 
                        <div className="mt-3">
                          <h5 className="mb-1 fw-bold">
                            {c.other_username}
                            {c.other_is_online && <span className="status-dot ms-2"></span>}
                          </h5>
                          <small className="text-muted">
                            Last active: <span className="fw-semibold">{c.other_is_online ? 'Now' : formatDate(c.other_last_seen)}</span>
                          </small>
                        </div>
                      </div> 
                      
                      <span className="message-bubble d-block text-truncate" style={{maxWidth: '100%'}}>
                        {c.last_message_sender_id !== c.other_user_id ? <strong>You: </strong> : null}
                        "{c.last_message || 'Say Hi!'}"
                      </span> 
                      
                      {c.last_message_at && (
                        <div className="d-inline-flex gap-2 mt-3">
                          <div className="fw-bold">{formatDate(c.last_message_at)}</div>
                          <div className="text-muted mb-2">{formatTime(c.last_message_at)}</div>
                        </div>
                      )}
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="col-12"><p className="text-muted">No conversations yet.</p></div>
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