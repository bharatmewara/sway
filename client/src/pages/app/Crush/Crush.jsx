import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import RightBar from '../../../components/RightBar';
import api from '../../../api/axios';
import './Crush.css';

const getFallback = (gender) => gender === 'female' ? '/img/girl.png' : '/img/boy.png';

const getAvatar = (photo, gender) => {
  if (!photo) return getFallback(gender);
  return photo.startsWith('http') || photo.startsWith('/') || photo.startsWith('data:') ? photo : `/${photo}`;
};

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold mb-0">Crushes Received</h4>
          </div>

          <div className="row g-2 g-md-3">
            {loading ? (
              <div className="text-center py-5 w-100">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : crushes.length === 0 ? (
              <div className="col-12 text-center py-5 text-muted">
                <i className="bi bi-heartbreak display-4 d-block mb-2 opacity-50" />
                You haven't received any crushes yet.
              </div>
            ) : (
              crushes.map(c => (
                <div className="col-6 col-sm-6 col-md-4" key={c.id}>
                  <div className="card border-0 shadow-sm conversation-card crush-card mb-2 mb-md-3 position-relative">
                    <button className="trash-btn" onClick={(e) => handleDelete(e, c.id)} title="Remove crush">
                      <i className="bi bi-trash-fill" />
                    </button>
                    <Link to={`/view-profile/${c.sender_id}`} className="card-body p-3 p-md-4 text-center text-decoration-none">
                      <div>
                        <img
                          src={getAvatar(c.profile_photo, c.gender)}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(c.gender); }}
                          className="profile-img-private-chat"
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%' }}
                          alt={c.username}
                        />
                        <div className="mt-2 mt-md-3">
                          <h5 className="mb-1 fw-bold text-dark d-flex align-items-center justify-content-center gap-1 gap-md-2 text-truncate">
                            <span className="text-truncate">{c.username}</span>
                            {c.is_online && <span className="status-dot flex-shrink-0" />}
                          </h5>
                          {c.is_mutual && (
                            <span className="mutual-crush-badge mt-1">
                              <i className="bi bi-arrow-through-heart-fill" /> Mutual
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="d-inline-flex gap-2 mt-2 mt-md-3 align-items-center text-muted small">
                        <span className="fw-semibold text-dark">{formatDate(c.created_at)}</span>
                        <span className="d-none d-sm-inline">{formatTime(c.created_at)}</span>
                      </div>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-12 col-xl-3">
          <RightBar />
        </div>
      </div>
    </DashboardLayout>
  );
}