import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Story Ring component shown in sidebar/topbar
export function StoryRing({ user, onClick, size = 60 }) {
  const hasUnviewed = user.stories?.some(s => !s.has_viewed);
  return (
    <motion.div
      onClick={onClick}
      className="d-flex flex-column align-items-center text-center"
      style={{ cursor: 'pointer', gap: 4 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div style={{
        padding: 2,
        borderRadius: '50%',
        background: hasUnviewed
          ? 'linear-gradient(135deg, #76000b, #d8a83f, #ff4d6d)'
          : '#ddd',
      }}>
        <div style={{
          padding: 2,
          borderRadius: '50%',
          background: '#fff',
        }}>
          <img
            src={user.profile_photo ? `/uploads/profiles/${user.profile_photo}` : '/img/profile.jpg'}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
            alt={user.username}
          />
        </div>
      </div>
      <small className="text-muted" style={{ fontSize: 11, maxWidth: size }}>
        {user.username.length > 8 ? user.username.slice(0, 7) + '…' : user.username}
      </small>
    </motion.div>
  );
}

// Full story viewer overlay
function StoryViewer({ stories, initialIdx, onClose }) {
  const [storyIdx, setStoryIdx] = useState(initialIdx);
  const [userIdx, setUserIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const allStories = stories.flatMap(u => u.stories.map(s => ({ ...s, username: u.username, profile_photo: u.profile_photo })));
  const current = allStories[storyIdx];
  const duration = (current?.duration || 5) * 1000;

  useEffect(() => {
    if (!current) { onClose(); return; }
    api.post(`/stories/${current.id}/view`).catch(() => {});

    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          if (storyIdx < allStories.length - 1) setStoryIdx(i => i + 1);
          else onClose();
          return 0;
        }
        return p + (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [storyIdx]);

  if (!current) return null;

  return (
    <div className="position-fixed" style={{ inset: 0, background: '#000', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Progress bars */}
      <div className="position-absolute top-0 start-0 end-0 p-3 d-flex gap-1" style={{ zIndex: 2 }}>
        {allStories.map((_, i) => (
          <div key={i} className="flex-grow-1 rounded-pill overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.3)' }}>
            <div style={{
              height: '100%',
              background: '#fff',
              width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
              transition: i === storyIdx ? 'none' : '0.1s'
            }} />
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="position-absolute top-0 start-0 end-0 d-flex align-items-center gap-3 p-4 pt-5" style={{ zIndex: 2 }}>
        <img src={current.profile_photo ? `/uploads/profiles/${current.profile_photo}` : '/img/profile.jpg'}
          style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <span className="text-white fw-bold">{current.username}</span>
        <span className="text-white opacity-50 ms-auto small">{new Date(current.created_at).toLocaleTimeString()}</span>
        <button className="btn p-0 text-white" onClick={onClose} style={{ fontSize: 24 }}>✕</button>
      </div>

      {/* Story media */}
      <div className="w-100 h-100 d-flex align-items-center justify-content-center">
        {current.media_type === 'video' ? (
          <video src={`/uploads/profiles/${current.media_url}`} autoPlay muted className="h-100" style={{ maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <img src={`/uploads/profiles/${current.media_url}`} className="h-100" style={{ maxWidth: '100%', objectFit: 'contain' }} />
        )}
      </div>

      {/* Caption */}
      {current.caption && (
        <div className="position-absolute bottom-0 start-0 end-0 p-4 text-white text-center" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', zIndex: 2 }}>
          {current.caption}
        </div>
      )}

      {/* Navigation */}
      <div className="position-absolute" style={{ left: 0, top: 0, bottom: 0, width: '40%', cursor: 'pointer', zIndex: 3 }}
        onClick={() => setStoryIdx(i => Math.max(0, i - 1))} />
      <div className="position-absolute" style={{ right: 0, top: 0, bottom: 0, width: '40%', cursor: 'pointer', zIndex: 3 }}
        onClick={() => setStoryIdx(i => i < allStories.length - 1 ? i + 1 : (onClose(), i))} />
    </div>
  );
}

export default function Stories() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [viewingIdx, setViewingIdx] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef();

  useEffect(() => {
    api.get('/stories').then(res => {
      setStories(res.data.stories);
      setMyStories(res.data.my_stories);
    }).catch(() => {});
  }, []);

  const uploadStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('media', file);
      await api.post('/stories', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Story posted!');
      window.location.reload();
    } catch (err) {
      toast.error('Failed to post story');
    }
    setUploading(false);
  };

  return (
    <div>
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
        <div className="d-flex align-items-center gap-4 overflow-auto pb-2">
          {/* Add my story */}
          <motion.div
            className="d-flex flex-column align-items-center text-center"
            style={{ cursor: 'pointer', gap: 4, minWidth: 72 }}
            onClick={() => fileRef.current.click()}
            whileHover={{ scale: 1.05 }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f5f5f5', border: '2px dashed #76000b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#76000b' }}>
              {uploading ? <div className="spinner-border spinner-border-sm" style={{ color: '#76000b' }}></div> : '+'}
            </div>
            <small className="text-muted" style={{ fontSize: 11 }}>Your Story</small>
          </motion.div>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="d-none" onChange={uploadStory} />

          {/* My active stories */}
          {myStories.length > 0 && (
            <StoryRing
              user={{ username: 'You', profile_photo: user?.profile_photo, stories: myStories.map(s => ({ ...s, has_viewed: true })) }}
              onClick={() => setViewingIdx(0)}
            />
          )}

          {/* Others' stories */}
          {stories.map((u, i) => (
            <StoryRing
              key={u.user_id}
              user={{ ...u, username: u.username }}
              onClick={() => setViewingIdx(i)}
            />
          ))}

          {stories.length === 0 && myStories.length === 0 && (
            <p className="text-muted ms-4 my-auto">No stories yet. Be the first!</p>
          )}
        </div>
      </div>

      {viewingIdx !== null && (
        <StoryViewer
          stories={stories}
          initialIdx={0}
          onClose={() => setViewingIdx(null)}
        />
      )}
    </div>
  );
}
