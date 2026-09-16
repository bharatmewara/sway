import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ChatPopup({ userId, onClose }) {
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          api.get(`/users/profile/${userId}`),
          api.get(`/messages/${userId}`)
        ]);
        setOtherUser(pRes.data.user || pRes.data);
        setMessages(mRes.data.messages || []);
      } catch (e) {
        if (e.response?.status === 402) {
          toast.error(e.response.data.message || 'Insufficient credits to view this chat.');
          onClose(); // Close popup if they can't afford to view it
        } else {
          console.error("Failed to load chat data", e);
        }
      } finally {
        setLoading(false);
      }
    };
    if (userId) loadChat();
  }, [userId, onClose]);

  useEffect(() => {
    if (socket) {
      const handler = (msg) => {
        if (msg.sender_id == userId || msg.sender_id == user.id) {
          setMessages(prev => [...prev, msg]);
        }
      };
      
      const handleOnline = ({ user_id }) => {
        if (user_id === parseInt(userId, 10)) {
          setOtherUser(prev => prev ? { ...prev, is_online: true } : prev);
        }
      };
      
      const handleOffline = ({ user_id }) => {
        if (user_id === parseInt(userId, 10)) {
          setOtherUser(prev => prev ? { ...prev, is_online: false } : prev);
        }
      };

      const handleSocketError = (data) => {
        toast.error(data.message || 'Insufficient credit.');
        onClose();
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
  }, [socket, userId, user.id, onClose]);

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
        toast.error(e.response?.data?.message || 'You do not have sufficient credit.');
      } else {
        toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to send');
      }
    }
  };

  return (
    <div 
      className="position-fixed shadow rounded-top d-none d-md-flex flex-column"
      style={{
        bottom: 0,
        right: '40px',
        width: '320px',
        backgroundColor: '#fff',
        zIndex: 1050,
        border: '1px solid #76000b',
        borderBottom: 'none'
      }}
    >
      {/* Header */}
      <div 
        className="d-flex align-items-center p-2 text-white" 
        style={{ backgroundColor: '#76000b', cursor: 'pointer', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}
      >
        <div className="position-relative me-2">
          <img 
            src={otherUser?.profile_photo ? `http://localhost:5000${otherUser.profile_photo}` : (otherUser?.gender === 'female' ? '/img/girl.png' : '/img/boy.png')} 
            alt="Avatar" 
            style={{ width: 35, height: 35, borderRadius: '50%', objectFit: 'cover' }}
          />
          {otherUser?.is_online && <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle" style={{ width: 10, height: 10 }}></span>}
        </div>
        <div className="flex-grow-1 fw-bold">
          <Link to={`/view-profile/${userId}`} className="text-white text-decoration-none">{otherUser?.username || 'Loading...'}</Link>
        </div>
        <button className="btn btn-sm text-white border-0 shadow-none" onClick={onClose}><i className="bi bi-dash-lg" style={{fontSize: '1.2rem'}}></i></button>
      </div>

      {/* Body */}
      <div 
        className="p-3 overflow-auto" 
        style={{ height: '280px', backgroundColor: '#fff' }}
      >
        {loading ? (
          <div className="text-center text-muted mt-5">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted mt-5">No messages yet. Say hi!</div>
        ) : (
          messages.map(m => {
            const isMe = m.sender_id === user.id;
            return (
              <div key={m.id} className={`d-flex mb-2 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                <div 
                  className={`p-2 rounded ${isMe ? 'text-white' : 'bg-light border'}`}
                  style={{
                    backgroundColor: isMe ? '#76000b' : '#f8f9fa',
                    maxWidth: '85%',
                    fontSize: '13px'
                  }}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef}></div>
      </div>

      {/* Footer */}
      <form onSubmit={send} className="p-2 border-top d-flex" style={{ backgroundColor: '#e9ecef' }}>
        <input 
          type="text" 
          className="form-control me-2 border-0 shadow-none" 
          placeholder="Type a message..." 
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ fontSize: '13px' }}
        />
        <button type="submit" className="btn text-white rounded px-3" style={{ backgroundColor: '#76000b' }}>
          <i className="bi bi-send-fill"></i>
        </button>
      </form>
    </div>
  );
}
