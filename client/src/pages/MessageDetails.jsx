import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import useSocket from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function MessageDetails() {
  const { userId } = useParams();
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [text, setText] = useState('');
  const chatEndRef = useRef(null);
  
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditModalMessage, setCreditModalMessage] = useState('');

  useEffect(() => {
    const loadChat = async () => {
      try {
        const [pRes, mRes, cRes] = await Promise.all([
          api.get(`/users/profile/${userId}`),
          api.get(`/messages/${userId}`),
          api.get('/messages/conversations')
        ]);
        setOtherUser(pRes.data.user || pRes.data);
        setMessages(mRes.data.messages);
        if(cRes.data.success) setConversations(cRes.data.conversations);
      } catch(e) {
        console.error("Failed to load chat data", e);
        if (e.response?.status === 402) {
          setCreditModalMessage(e.response.data.message || 'You do not have sufficient credit.');
          setShowCreditModal(true);
        }
      }
    };
    if (userId) loadChat();
  }, [userId]);

  useEffect(() => {
    if (socket) {
      const handler = (msg) => {
        if (msg.sender_id == userId || msg.sender_id == user.id) {
          setMessages(prev => [...prev, msg]);
        }
      };
      
      const handleOnline = ({ user_id }) => {
        setConversations(prev => prev.map(c => c.other_user_id === user_id ? { ...c, other_is_online: true } : c));
        if (user_id === parseInt(userId, 10)) {
          setOtherUser(prev => prev ? { ...prev, is_online: true } : prev);
        }
      };
      
      const handleOffline = ({ user_id }) => {
        setConversations(prev => prev.map(c => c.other_user_id === user_id ? { ...c, other_is_online: false } : c));
        if (user_id === parseInt(userId, 10)) {
          setOtherUser(prev => prev ? { ...prev, is_online: false } : prev);
        }
      };
      
      const handleSocketError = (data) => {
        setCreditModalMessage(data.message || 'You do not have sufficient credit.');
        setShowCreditModal(true);
      };

      socket.on('receive_message', handler);
      socket.on('user_online', handleOnline);
      socket.on('user_offline', handleOffline);
      socket.on('error', handleSocketError);
      
      return () => {
        socket.off('receive_message', handler);
        socket.off('user_online', handleOnline);
        socket.off('user_offline', handleOffline);
        socket.off('error', handleSocketError);
      };
    }
  }, [socket, userId, user.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await api.post('/messages/send', { receiver_id: userId, content: text });
      const sentMessage = res.data?.data || res.data?.sent_message;
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
      }
      if (res.data.remaining_credits !== undefined) {
        updateUser({ connect_credits: res.data.remaining_credits });
      }
      setText('');
    } catch(e) {
      if (e.response?.status === 402) {
        setCreditModalMessage(e.response?.data?.message || 'You do not have sufficient credit.');
        setShowCreditModal(true);
      } else {
        toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to send');
      }
    }
  };

  const handleRequestPrivate = async () => {
    try {
      const res = await api.post(`/private-photos/request-access/${userId}`);
      if(res.data.success) toast.success('Private photo access requested');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to request access');
    }
  };

  const handleSendCrush = async () => {
    try {
      const res = await api.post('/crushes', { user_id: userId });
      if(res.data.success) toast.success('Crush sent successfully!');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to send crush');
    }
  };

  const formatTime = (isoString) => {
    if(!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

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
                        src={otherUser?.profile_photo ? `http://localhost:5000${otherUser.profile_photo}` : '/img/profile.jpg'} 
                        className="profile-avatar" 
                        alt="avatar" 
                        style={{objectFit: 'cover'}}
                      />
                      {otherUser?.is_online && <span className="online-dot"></span>}
                    </div>
                    <h4 className="mt-3 fw-bold">{otherUser?.username || 'Loading...'}</h4>
                    <div className={otherUser?.is_online ? "text-success" : "text-muted"}>
                      ● {otherUser?.is_online ? 'Online' : 'Offline'}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-3">
                      <i className="bi bi-person me-2"></i>
                      {otherUser?.age ? `${otherUser.age} years old` : 'Age unknown'}
                    </div>
                    <div className="mb-3">
                      <i className="bi bi-geo-alt me-2"></i>
                      {otherUser?.city ? `${otherUser.city}, ${otherUser.state || ''}` : 'Location unknown'}
                    </div>
                    <div>
                      <i className="bi bi-clock me-2"></i>
                      Last activity: {otherUser?.is_online ? 'Just now' : (otherUser?.last_seen ? new Date(otherUser.last_seen).toLocaleString() : 'Unknown')}
                    </div>
                  </div>

                  <div className="profile-list mb-4">
                    <div className="item">
                      <span>Marital status</span>
                      <span>{otherUser?.marital_status || '---'}</span>
                    </div>
                    <div className="item">
                      <span>Height</span>
                      <span>{otherUser?.height ? `${otherUser.height} cm` : '---'}</span>
                    </div>
                    <div className="item">
                      <span>Ethnicity</span>
                      <span>{otherUser?.ethnicity || '---'}</span>
                    </div>
                    <div className="item">
                      <span>Occupation</span>
                      <span>{otherUser?.profession || '---'}</span>
                    </div>
                  </div>

                  <button className="btn btn-outline-custom w-100" onClick={() => toast('User blocked (stub)')}>
                    <i className="bi bi-slash-circle me-2"></i>
                    Block / Report
                  </button>
                </div>
              </div>

              {/* CHAT */}
              <div className="col-lg-8">
                <div className="chat-wrapper">
                  
                  {/* HEADER */}
                  <div className="chat-header text-center p-2"> 
                    <span className="text-muted">
                      Show previous messages
                    </span>
                  </div>

                  {/* BODY */}
                  <div className="chat-body">
                    {messages.map((m, i) => {
                      const isMine = m.sender_id === user.id;
                      return (
                        <div key={m.id || i} className={`message-row ${isMine ? 'right' : ''}`}>
                          <div className={`message ${isMine ? 'message-right' : 'message-left'}`}>
                            {m.content}
                            <span className="message-time">
                                {formatTime(m.created_at)} {isMine && '✓✓'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* FOOTER */}
                  <div className="chat-footer">
                    <form onSubmit={send} className="row g-3 align-items-center">
                      <div className="col">
                        <div className="message-box">
                          <div className="input-group">
                            <input 
                              type="text"
                              className="form-control"
                              placeholder="Type your message here..."
                              value={text}
                              onChange={e => setText(e.target.value)}
                            /> 
                          </div>
                        </div>
                      </div>
                      <div className="col-auto">
                         <button type="submit" className="btn btn-wine btn-icon"><i className="bi bi-send"></i></button>
                      </div>
                      <div className="col-auto">
                         <button type="button" className="btn btn-outline-secondary btn-icon" title="Request Private Photos" onClick={handleRequestPrivate}>
                           <i className="bi bi-images"></i>
                         </button>
                      </div>
                      <div className="col-auto">
                         <button type="button" className="btn btn-outline-danger btn-icon" title="Send Crush" onClick={handleSendCrush}>
                           <i className="bi bi-heart"></i>
                         </button>
                      </div>
                    </form>
                    {user.gender === 'male' && <div className="text-center mt-2"><small className="text-muted">Cost: 1 Credit / Message</small></div>}
                  </div>
                  
                </div>
              </div>

            </div>
          </div>
          
          {/* CONVERSATIONS RIGHTBAR */}
          <div className="col-12 col-lg-3">
             <div className="rightbar mb-4">
               <div className="d-flex justify-content-between mb-2">
                 <h6 className="fw-bold">Active Conversations</h6> 
               </div>
               <div className="scrool_right">
                 {conversations.length > 0 ? conversations.map(c => (
                   <Link to={`/chat/${c.other_user_id}`} className="text-decoration-none text-dark" key={c.conversation_id}>
                     <div className={`user-row ${c.other_user_id == userId ? 'bg-light' : ''}`}>
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
          </div>

        </div>
      </section>

      {/* Insufficient Credit Modal */}
      {showCreditModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{borderRadius: '16px'}}>
              <div className="modal-body text-center p-5">
                <div className="mb-4 text-danger">
                  <i className="bi bi-exclamation-circle-fill" style={{fontSize: '3rem'}}></i>
                </div>
                <h4 className="fw-bold mb-3">Insufficient Credits</h4>
                <p className="text-muted mb-4">{creditModalMessage}</p>
                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn btn-light px-4" onClick={() => setShowCreditModal(false)}>Close</button>
                  <Link to="/premium" className="btn btn-wine px-4">Buy Credits</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
