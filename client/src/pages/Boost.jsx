import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BOOST_OPTIONS = [
  { type: '30min', label: '30 Minutes', credits: 20, description: 'Quick visibility spike', icon: '⚡' },
  { type: '1hour', label: '1 Hour', credits: 35, description: 'Extended top placement', icon: '🚀', popular: true },
  { type: '24hours', label: '24 Hours', credits: 100, description: 'Full day featured', icon: '👑' },
];

export default function Boost() {
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    api.get('/boost/status').then(r => setStatus(r.data)).catch(() => {});
    api.get('/boost/history').then(r => setHistory(r.data.boosts)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!status?.is_active || !status?.expires_at) return;
    const interval = setInterval(() => {
      const diff = new Date(status.expires_at) - new Date();
      if (diff <= 0) { setTimeLeft('Expired'); clearInterval(interval); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h ? h + 'h ' : ''}${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const activate = async (type) => {
    setLoading(true);
    try {
      const res = await api.post('/boost/activate', { boost_type: type });
      toast.success(`Boost activated! You're now featured for ${res.data.boost_type}`);
      setStatus({ is_active: true, expires_at: res.data.ends_at });
      updateUser({ ...user, connect_credits: user.connect_credits - res.data.credits_charged });
      api.get('/boost/history').then(r => setHistory(r.data.boosts)).catch(() => {});
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to activate boost');
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 className="fw-bold mb-0"><i className="bi bi-lightning-fill me-2" style={{ color: '#d8a83f' }}></i>Profile Boost</h3>
        <div className="credit-badge">
          <i className="bi bi-coin"></i> {user?.connect_credits} Credits
        </div>
      </div>

      {/* Active Boost Status */}
      {status?.is_active && (
        <motion.div
          className="card border-0 rounded-4 p-4 mb-4 text-white"
          style={{ background: 'linear-gradient(135deg, #76000b, #d8a83f)' }}
          initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        >
          <div className="d-flex align-items-center gap-3">
            <div style={{ fontSize: 48 }}>🚀</div>
            <div>
              <h4 className="mb-1 fw-bold">Boost Active!</h4>
              <p className="mb-0 opacity-75">You're featured at the top of search results</p>
              <h3 className="mb-0 mt-2 fw-bold">{timeLeft}</h3>
            </div>
          </div>
        </motion.div>
      )}

      {/* Boost Options */}
      {!status?.is_active && (
        <>
          <p className="text-muted mb-4">Boost your profile to appear at the top of search results and get more views.</p>
          <div className="row g-4 mb-5">
            {BOOST_OPTIONS.map(opt => (
              <div key={opt.type} className="col-md-4">
                <motion.div
                  className={`card border-0 shadow-sm rounded-4 p-4 text-center h-100 position-relative ${opt.popular ? 'border border-2' : ''}`}
                  style={{ borderColor: opt.popular ? '#76000b' : undefined }}
                  whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(118,0,11,0.15)' }}
                >
                  {opt.popular && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <span className="badge" style={{ background: 'linear-gradient(135deg, #76000b, #d8a83f)' }}>Most Popular</span>
                    </div>
                  )}
                  <div style={{ fontSize: 48 }} className="mt-2">{opt.icon}</div>
                  <h5 className="fw-bold mt-2 mb-1">{opt.label}</h5>
                  <p className="text-muted small mb-3">{opt.description}</p>
                  <h3 className="fw-bold mb-3" style={{ color: '#76000b' }}>{opt.credits} <small className="fs-6 text-muted fw-normal">credits</small></h3>
                  <button
                    className="btn btn-wine w-100 rounded-pill"
                    onClick={() => activate(opt.type)}
                    disabled={loading || user?.connect_credits < opt.credits}
                  >
                    {user?.connect_credits < opt.credits ? 'Not enough credits' : loading ? 'Activating...' : 'Activate Boost'}
                  </button>
                </motion.div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Boost History */}
      {history.length > 0 && (
        <>
          <h5 className="fw-bold mb-3">Boost History</h5>
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <table className="table mb-0">
              <thead className="table-light">
                <tr><th>Type</th><th>Started</th><th>Ended</th><th>Credits</th></tr>
              </thead>
              <tbody>
                {history.map(b => (
                  <tr key={b.id}>
                    <td className="text-capitalize">{b.boost_type}</td>
                    <td>{new Date(b.started_at).toLocaleString()}</td>
                    <td>{new Date(b.ends_at).toLocaleString()}</td>
                    <td>{b.credits_charged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
