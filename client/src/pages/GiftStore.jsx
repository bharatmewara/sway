import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function GiftCard({ gift, onSend }) {
  return (
    <motion.div
      className="card border-0 shadow-sm rounded-4 text-center p-4 h-100"
      style={{ cursor: 'pointer' }}
      whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(118,0,11,0.15)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onSend}
    >
      <div style={{ fontSize: 48 }}>{gift.emoji}</div>
      <h6 className="fw-bold mt-2 mb-1">{gift.name}</h6>
      <div className="d-flex align-items-center justify-content-center gap-1">
        <span style={{ color: '#d8a83f', fontSize: 13, fontWeight: 700 }}>{gift.credit_cost} credits</span>
      </div>
      <span className="badge mt-2" style={{ background: gift.category === 'premium' ? 'linear-gradient(135deg, #d8a83f, #c17a00)' : '#f5f5f5', color: gift.category === 'premium' ? '#fff' : '#555', fontSize: 10 }}>
        {gift.category}
      </span>
    </motion.div>
  );
}

function GiftAnimation({ gift, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="position-fixed d-flex align-items-center justify-content-center"
      style={{ inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center text-white"
        initial={{ scale: 0.3, opacity: 0, y: 50 }}
        animate={{ scale: 1.2, opacity: 1, y: -20 }}
        transition={{ type: 'spring', bounce: 0.6 }}
      >
        <div style={{ fontSize: 100 }}>{gift.emoji}</div>
        <h3 className="fw-bold mt-3">{gift.name} Sent! 🎉</h3>
        <p className="opacity-75">They'll love it!</p>
      </motion.div>
    </motion.div>
  );
}

export default function GiftStore({ userId, username }) {
  const [gifts, setGifts] = useState([]);
  const [received, setReceived] = useState([]);
  const [tab, setTab] = useState('store');
  const [animation, setAnimation] = useState(null);
  const [sendToId, setSendToId] = useState(userId || '');
  const [message, setMessage] = useState('');
  const { user, updateUser } = useAuth();

  useEffect(() => {
    api.get('/gifts/catalog').then(r => setGifts(r.data.gifts)).catch(() => {});
    api.get('/gifts/received').then(r => setReceived(r.data.gifts)).catch(() => {});
  }, []);

  const sendGift = async (gift) => {
    if (!sendToId) return toast.error('Select a recipient first');
    try {
      await api.post('/gifts/send', { receiver_id: sendToId, gift_id: gift.id, message });
      setAnimation(gift);
      updateUser({ ...user, connect_credits: user.connect_credits - gift.credit_cost });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to send gift');
    }
  };

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 className="fw-bold mb-0"><i className="bi bi-gift me-2" style={{ color: '#76000b' }}></i>Gift Store</h3>
        <div className="credit-badge">
          <i className="bi bi-coin"></i> {user?.connect_credits} Credits
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        {['store', 'received'].map(t => (
          <button
            key={t}
            className={`btn rounded-pill px-4 ${tab === t ? 'btn-wine' : 'btn-outline-secondary'}`}
            onClick={() => setTab(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t === 'store' ? '🎁 Gift Store' : '📩 Received'}
          </button>
        ))}
      </div>

      {tab === 'store' && (
        <>
          {/* Recipient selector */}
          {!userId && (
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <label className="fw-semibold mb-2">Send to (User ID)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Enter recipient user ID"
                value={sendToId}
                onChange={e => setSendToId(e.target.value)}
              />
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Add a message (optional)"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
          )}

          <div className="row g-3">
            {gifts.map(g => (
              <div key={g.id} className="col-6 col-md-4 col-lg-3">
                <GiftCard gift={g} onSend={() => sendGift(g)} />
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'received' && (
        <div className="row g-3">
          {received.map(r => (
            <div key={r.id} className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center gap-3">
                <div style={{ fontSize: 48 }}>{r.emoji}</div>
                <div>
                  <h6 className="fw-bold mb-1">{r.name}</h6>
                  <p className="text-muted mb-0 small">From: <strong>{r.sender_name}</strong></p>
                  {r.message && <p className="text-muted mb-0 small fst-italic">"{r.message}"</p>}
                  <small className="text-muted">{new Date(r.created_at).toLocaleDateString()}</small>
                </div>
              </div>
            </div>
          ))}
          {received.length === 0 && (
            <div className="col-12 text-center py-5 text-muted">
              <div style={{ fontSize: 64 }}>🎁</div>
              <p>No gifts received yet</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {animation && <GiftAnimation gift={animation} onComplete={() => setAnimation(null)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
