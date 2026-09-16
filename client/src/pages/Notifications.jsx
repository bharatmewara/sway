import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import RightBar from '../components/RightBar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchCounts } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/users/notifications');
      setNotifications(res.data.notifications || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/users/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      fetchCounts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/users/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      fetchCounts();
      toast.success('All notifications marked as read');
    } catch (e) {
      console.error(e);
      toast.error('Failed to mark all as read');
    }
  };

  const getAvatar = (photo) => {
    if (photo) return `http://localhost:5000${photo}`;
    return '/img/profile.jpg'; // default
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
             <h4 className="fw-bold mb-0">Notifications</h4>
             <button className="btn btn-outline-danger btn-sm" onClick={handleMarkAllRead}>
               <i className="bi bi-check-all"></i> Mark All as Read
             </button>
          </div>
          
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">You have no notifications yet.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {notifications.map(n => (
                    <div key={n.id} className={`list-group-item p-4 border-bottom ${!n.is_read ? 'bg-light' : ''}`}>
                      <div className="d-flex align-items-center gap-3">
                        {n.from_user_id ? (
                          <Link to={`/view-profile/${n.from_user_id}`}>
                            <img 
                              src={getAvatar(n.from_photo)} 
                              alt={n.from_username} 
                              style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} 
                            />
                          </Link>
                        ) : (
                          <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="bi bi-bell-fill text-muted fs-4"></i>
                          </div>
                        )}
                        
                        <div className="flex-grow-1">
                          <p className="mb-1 fw-medium" style={{ fontSize: '15px' }}>
                            {n.message}
                          </p>
                          <small className="text-muted d-block mt-1">
                            {formatDate(n.created_at)}
                          </small>
                        </div>

                        {!n.is_read && (
                          <button 
                            className="btn btn-sm btn-light border" 
                            title="Mark as read"
                            onClick={() => handleMarkAsRead(n.id)}
                          >
                            <i className="bi bi-check2"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-12 col-lg-3">
          <RightBar />
        </div>
      </div>
    </DashboardLayout>
  );
}
