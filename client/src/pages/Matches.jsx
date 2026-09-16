import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/matching/matches').then(r => setMatches(r.data.matches)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center gap-3 mb-4">
        <h3 className="fw-bold mb-0">💚 Matches</h3>
        <span className="badge rounded-pill" style={{ background: '#76000b' }}>{matches.length}</span>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#76000b' }}></div>
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="text-center py-5 text-muted">
          <div style={{ fontSize: 72 }}>💔</div>
          <h5 className="mt-3">No matches yet</h5>
          <p>Start swiping in Discover to find matches!</p>
          <a href="/discover" className="btn btn-wine rounded-pill px-4 mt-2">Go to Discover</a>
        </div>
      )}

      <div className="row g-3">
        {matches.map(m => (
          <div key={m.id} className="col-md-4 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
              <div className="position-relative">
                <img
                  src={m.profile_photo ? `/uploads/profiles/${m.profile_photo}` : (m.gender === 'female' ? '/img/girl.png' : '/img/boy.png')}
                  className="w-100"
                  style={{ height: 200, objectFit: 'cover' }}
                />
                <div className="position-absolute top-0 end-0 m-2">
                  <div className="badge text-white fw-bold" style={{ background: 'linear-gradient(135deg, #76000b, #d8a83f)', padding: '6px 10px', borderRadius: 20 }}>
                    {m.compatibility_score}%
                  </div>
                </div>
                {m.is_online && (
                  <div className="position-absolute bottom-0 start-0 m-2">
                    <span className="badge bg-success rounded-pill">● Online</span>
                  </div>
                )}
              </div>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-1">{m.username}, {m.age}</h6>
                <p className="text-muted small mb-3">{m.city}</p>
                <div className="d-flex gap-2">
                  <a href={`/chats/${m.match_user_id}`} className="btn btn-wine btn-sm flex-grow-1 rounded-pill">
                    <i className="bi bi-chat"></i> Chat
                  </a>
                  <a href={`/view-profile/${m.match_user_id}`} className="btn btn-outline-secondary btn-sm rounded-pill">
                    <i className="bi bi-person"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
