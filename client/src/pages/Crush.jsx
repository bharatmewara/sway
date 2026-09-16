import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import RightBar from '../components/RightBar';
import api from '../api/axios';

export default function Crush() {
  const [crushes, setCrushes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrushes();
  }, []);

  const fetchCrushes = async () => {
    try {
      const res = await api.get('/crushes');
      setCrushes(res.data.crushes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to remove this crush?')) return;
    try {
      await api.delete(`/crushes/${id}`);
      setCrushes(crushes.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete crush');
    }
  };

  const getAvatar = (photo, gender) => {
    if (photo) return `http://localhost:5000${photo}`;
    return gender === 'female' ? '/img/girl.png' : '/img/boy.png';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
             <h4 className="fw-bold mb-0">Crushes Received</h4>
             {/* If we add tabs later, they go here */}
          </div>
          
          <div className="row">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : crushes.length === 0 ? (
              <div className="col-12">
                <p className="text-muted">You haven't received any crushes yet.</p>
              </div>
            ) : (
              crushes.map(c => (
                <div className="col-12 col-lg-4" key={c.id}>
                  <div className="card border-0 shadow-sm conversation-card mb-3 position-relative">
                    <button className="trash-btn mb-2" onClick={(e) => handleDelete(e, c.id)}>
                      <i className="bi bi-trash-fill"></i>
                    </button>
                    <Link to={`/view-profile/${c.sender_id}`} className="card-body p-4 text-center text-decoration-none">
                      <div>
                        <img 
                          src={getAvatar(c.profile_photo, c.gender)}
                          className="profile-img-private-chat"
                          style={{width: 80, height: 80, objectFit: 'cover', borderRadius: '50%'}}
                          alt={c.username}
                        />
                        <div className="mt-3">
                          <h5 className="mb-1 fw-bold text-dark d-flex align-items-center justify-content-center gap-2">
                            {c.username} {c.is_online && <span className="status-dot" style={{width: 12, height: 12, backgroundColor: '#28a745', borderRadius: '50%', display: 'inline-block'}}></span>}
                          </h5>
                          {c.is_mutual && (
                            <small className="text-danger fw-bold"><i className="bi bi-arrow-through-heart-fill"></i> Mutual Crush!</small>
                          )}
                        </div>
                      </div>
                      
                      <div className="d-inline-flex gap-2 mt-3 align-items-center">
                        <div className="fw-bold text-dark">
                          {formatDate(c.created_at)}
                        </div>
                        <div className="text-muted">
                          {formatTime(c.created_at)}
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="col-12 col-lg-3">
          <RightBar />
        </div>
      </div>
    </DashboardLayout>
  );
}