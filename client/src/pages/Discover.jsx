import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SWIPE_THRESHOLD = 100;

function ProfileCard({ profile, onLike, onPass, onSuperLike, active }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

  const getOverlayOpacity = () => Math.min(Math.abs(dragX) / 150, 1);
  const isLiking = dragX > 30;
  const isPassing = dragX < -30;

  return (
    <motion.div
      className={`position-absolute w-100 ${active ? '' : 'd-none'}`}
      style={{ cursor: 'grab', touchAction: 'none' }}
      drag={active ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragStart={() => setIsDragging(true)}
      onDrag={(e, info) => setDragX(info.offset.x)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        setDragX(0);
        if (info.offset.x > SWIPE_THRESHOLD) onLike();
        else if (info.offset.x < -SWIPE_THRESHOLD) onPass();
      }}
      animate={{ x: 0, rotate: 0 }}
      whileDrag={{ rotate: dragX * 0.05 }}
    >
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden position-relative"
        style={{ height: '520px', maxWidth: '400px', margin: '0 auto' }}>
        <img
          src={profile.profile_photo_url || (profile.gender === 'female' ? '/img/girl.png' : '/img/boy.png')}
          className="w-100 h-100" style={{ objectFit: 'cover' }} alt={profile.username}
        />

        {/* Like indicator */}
        {isLiking && (
          <div className="position-absolute top-0 start-0 m-3 px-3 py-2 rounded-3 border border-success border-3 text-success fw-bold fs-5"
            style={{ opacity: getOverlayOpacity(), background: 'rgba(255,255,255,0.9)' }}>
            LIKE 💚
          </div>
        )}

        {/* Pass indicator */}
        {isPassing && (
          <div className="position-absolute top-0 end-0 m-3 px-3 py-2 rounded-3 border border-danger border-3 text-danger fw-bold fs-5"
            style={{ opacity: getOverlayOpacity(), background: 'rgba(255,255,255,0.9)' }}>
            PASS ✕
          </div>
        )}

        {/* Gradient overlay */}
        <div className="position-absolute bottom-0 start-0 end-0 p-4 text-white"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h3 className="mb-0 fw-bold">{profile.username}{!profile.hide_age && profile.age ? `, ${profile.age}` : ''}</h3>
            {profile.verification_status === 'verified' && <i className="bi bi-patch-check-fill text-info"></i>}
            {profile.is_premium && <span className="badge" style={{ background: 'linear-gradient(135deg, #d8a83f, #c17a00)', fontSize: '10px' }}>PREMIUM</span>}
          </div>
          <p className="mb-2 opacity-75"><i className="bi bi-geo-alt"></i> {profile.city}</p>
          {profile.bio && <p className="small opacity-75 text-truncate">{profile.bio}</p>}

          <div className="d-flex gap-2 mt-2">
            <div className="rounded-pill px-3 py-1 text-white text-center"
              style={{ background: 'linear-gradient(135deg, #76000b, #c40000)', fontSize: '12px', fontWeight: 600 }}>
              {profile.compatibility}% Match
            </div>
            {profile.interests && profile.interests.split(',').slice(0, 2).map((tag, i) => (
              <span key={i} className="badge bg-white text-dark rounded-pill" style={{ fontSize: '11px' }}>{tag.trim()}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MatchPopup({ match, onClose }) {
  return (
    <motion.div
      className="position-fixed inset-0 d-flex align-items-center justify-content-center"
      style={{ top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-center text-white p-5"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
      >
        <div className="fs-1 mb-3">🎉</div>
        <h1 className="fw-bold mb-2" style={{ background: 'linear-gradient(135deg, #d8a83f, #ff4d6d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          It's a Match!
        </h1>
        <p className="mb-4 opacity-75">You and your match liked each other!</p>
        {match?.compatibility && (
          <div className="mb-4">
            <div className="fs-3 fw-bold" style={{ color: '#d8a83f' }}>{match.compatibility}%</div>
            <small className="opacity-75">Compatibility Score</small>
          </div>
        )}
        <div className="d-flex gap-3 justify-content-center">
          <button className="btn btn-wine px-4 py-2 rounded-pill" onClick={onClose}>Keep Swiping</button>
          <button className="btn btn-light px-4 py-2 rounded-pill text-dark" onClick={onClose}>Send Message</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Discover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchPopup, setMatchPopup] = useState(null);
  const [stats, setStats] = useState({ likes: 0, passes: 0, matches: 0 });

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const res = await api.get('/matching/feed?limit=30');
      setFeed(res.data.feed);
    } catch (e) {
      toast.error('Could not load profiles');
    }
    setLoading(false);
  };

  const handleAction = async (action) => {
    const profile = feed[currentIdx];
    if (!profile) return;

    try {
      if (action === 'like' || action === 'super_like') {
        const res = await api.post('/matching/like', { liked_id: profile.id, like_type: action });
        if (res.data.isMatch) {
          setMatchPopup(res.data.match);
          setStats(s => ({ ...s, matches: s.matches + 1, likes: s.likes + 1 }));
        } else {
          setStats(s => ({ ...s, likes: s.likes + 1 }));
          if (action === 'super_like') toast.success('Super like sent! ⭐');
        }
      } else {
        await api.post('/matching/like', { liked_id: profile.id, like_type: 'pass' });
        setStats(s => ({ ...s, passes: s.passes + 1 }));
      }
    } catch (e) {
      if (e.response?.status === 402) toast.error(e.response.data.error);
    }

    setCurrentIdx(i => i + 1);
  };

  const current = feed[currentIdx];
  const isDone = !loading && currentIdx >= feed.length;

  return (
    <DashboardLayout>
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h3 className="fw-bold mb-0">Discover</h3>
            <div className="d-flex gap-3 text-center">
              <div><div className="fw-bold text-wine">{stats.likes}</div><small className="text-muted">Likes</small></div>
              <div><div className="fw-bold text-success">{stats.matches}</div><small className="text-muted">Matches</small></div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: '#76000b' }}></div>
              <p className="mt-3 text-muted">Finding great matches for you...</p>
            </div>
          )}

          {isDone && (
            <div className="text-center py-5">
              <div className="mb-4" style={{ fontSize: 80 }}>🌹</div>
              <h4>You've seen everyone nearby!</h4>
              <p className="text-muted">Check back later or expand your search range.</p>
              <button className="btn btn-wine mt-3 rounded-pill px-4" onClick={() => { setCurrentIdx(0); loadFeed(); }}>
                Refresh Feed
              </button>
            </div>
          )}

          {!loading && !isDone && current && (
            <div>
              {/* Card Stack */}
              <div className="position-relative" style={{ height: '540px' }}>
                {feed.slice(currentIdx, currentIdx + 3).reverse().map((profile, i) => (
                  <motion.div
                    key={profile.id}
                    className="position-absolute w-100"
                    style={{
                      top: (2 - i) * 8,
                      transform: `scale(${1 - (2 - i) * 0.03})`,
                      zIndex: i,
                    }}
                    initial={false}
                  >
                    {i === 2 && (
                      <ProfileCard
                        profile={profile}
                        onLike={() => handleAction('like')}
                        onPass={() => handleAction('pass')}
                        onSuperLike={() => handleAction('super_like')}
                        active={true}
                      />
                    )}
                    {i < 2 && (
                      <div className="card border-0 shadow rounded-4 overflow-hidden"
                        style={{ height: '520px', maxWidth: '400px', margin: '0 auto', opacity: 0.5 + i * 0.2 }}>
                        <img src={profile.profile_photo_url || '/img/profile.jpg'} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-center align-items-center gap-4 mt-4">
                <button
                  onClick={() => handleAction('pass')}
                  className="btn rounded-circle d-flex align-items-center justify-content-center shadow"
                  style={{ width: 64, height: 64, background: '#fff', border: '2px solid #ff4d6d', color: '#ff4d6d', fontSize: 26 }}
                >✕</button>

                <button
                  onClick={() => handleAction('super_like')}
                  className="btn rounded-circle d-flex align-items-center justify-content-center shadow"
                  style={{ width: 52, height: 52, background: '#fff', border: '2px solid #d8a83f', color: '#d8a83f', fontSize: 22 }}
                >⭐</button>

                <button
                  onClick={() => handleAction('like')}
                  className="btn rounded-circle d-flex align-items-center justify-content-center shadow"
                  style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #76000b, #c40000)', border: 'none', color: '#fff', fontSize: 26 }}
                >♥</button>

                <button
                  onClick={() => { if (current) navigate(`/view-profile/${current.id}`); }}
                  className="btn rounded-circle d-flex align-items-center justify-content-center shadow"
                  style={{ width: 52, height: 52, background: '#fff', border: '2px solid #76000b', color: '#76000b', fontSize: 22 }}
                ><i className="bi bi-info-circle"></i></button>
              </div>

              <p className="text-center text-muted mt-3 small">
                <i className="bi bi-arrow-left-right"></i> Swipe cards or use buttons
              </p>
            </div>
          )}
        </div>
      </div>

      {matchPopup && <MatchPopup match={matchPopup} onClose={() => setMatchPopup(null)} />}
    </DashboardLayout>
  );
}
