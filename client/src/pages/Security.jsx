import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Security() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [twoFAStatus, setTwoFAStatus] = useState({ enabled: false, secret: null, qr_code: null });
  const [twoFAToken, setTwoFAToken] = useState('');
  const [tab, setTab] = useState('sessions');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/security/sessions').then(r => setSessions(r.data.sessions)).catch(() => {});
    api.get('/security/login-history').then(r => setLoginHistory(r.data.history)).catch(() => {});
  }, []);

  const revokeSession = async (id) => {
    await api.delete(`/security/sessions/${id}`);
    setSessions(s => s.filter(sess => sess.id !== id));
    toast.success('Session revoked');
  };

  const revokeAll = async () => {
    await api.delete('/security/sessions');
    setSessions(s => s.filter(sess => sess.is_current));
    toast.success('All other sessions revoked');
  };

  const setup2FA = async () => {
    setLoading(true);
    try {
      const res = await api.post('/security/2fa/enable');
      setTwoFAStatus({ ...twoFAStatus, secret: res.data.secret, qr_code: res.data.qr_code });
    } catch { toast.error('Failed to setup 2FA'); }
    setLoading(false);
  };

  const verify2FA = async () => {
    try {
      await api.post('/security/2fa/verify', { token: twoFAToken });
      toast.success('2FA enabled successfully!');
      setTwoFAStatus({ enabled: true, secret: null, qr_code: null });
      setTwoFAToken('');
    } catch { toast.error('Invalid code'); }
  };

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 className="fw-bold mb-0"><i className="bi bi-shield-check me-2" style={{ color: '#76000b' }}></i>Security</h3>
      </div>

      {/* Tab navigation */}
      <div className="d-flex gap-2 mb-4">
        {['sessions', 'login-history', '2fa'].map(t => (
          <button
            key={t}
            className={`btn rounded-pill px-4 ${tab === t ? 'btn-wine' : 'btn-outline-secondary'}`}
            onClick={() => setTab(t)}
          >
            {t === 'sessions' ? '💻 Sessions' : t === 'login-history' ? '📋 Login History' : '🔐 Two-Factor Auth'}
          </button>
        ))}
      </div>

      {/* Sessions */}
      {tab === 'sessions' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <p className="text-muted mb-0">{sessions.length} active session(s)</p>
            {sessions.length > 1 && (
              <button className="btn btn-sm btn-outline-danger" onClick={revokeAll}>Revoke All Others</button>
            )}
          </div>
          {sessions.map(s => (
            <div key={s.id} className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row align-items-center gap-3">
              <div style={{ fontSize: 36 }}>{s.device_type === 'mobile' ? '📱' : '💻'}</div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0 fw-bold">{s.device_name || s.browser || 'Unknown Device'}</h6>
                  {s.is_current && <span className="badge bg-success" style={{ fontSize: 10 }}>Current</span>}
                </div>
                <p className="text-muted mb-0 small">{s.ip_address} · {s.location_city || 'Unknown'} · Last active: {new Date(s.last_active).toLocaleString()}</p>
              </div>
              {!s.is_current && (
                <button className="btn btn-sm btn-outline-danger" onClick={() => revokeSession(s.id)}>Revoke</button>
              )}
            </div>
          ))}
        </>
      )}

      {/* Login History */}
      {tab === 'login-history' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <table className="table mb-0">
            <thead className="table-light">
              <tr><th>Date</th><th>IP Address</th><th>Location</th><th>Device</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loginHistory.map(h => (
                <tr key={h.id}>
                  <td>{new Date(h.created_at).toLocaleString()}</td>
                  <td>{h.ip_address}</td>
                  <td>{h.location || 'Unknown'}</td>
                  <td>{h.device_name || 'Unknown'}</td>
                  <td>
                    <span className={`badge bg-${h.status === 'success' ? 'success' : 'danger'}`}>{h.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2FA */}
      {tab === '2fa' && (
        <div className="row">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-3">Two-Factor Authentication (2FA)</h5>
              <p className="text-muted">Add an extra layer of security to your account. Once enabled, you'll need to enter a 6-digit code from your authenticator app on each login.</p>

              {!twoFAStatus.secret && !twoFAStatus.enabled && (
                <button className="btn btn-wine rounded-pill px-4" onClick={setup2FA} disabled={loading}>
                  {loading ? 'Setting up...' : 'Enable 2FA'}
                </button>
              )}

              {twoFAStatus.enabled && (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Two-Factor Authentication is enabled!
                </div>
              )}

              {twoFAStatus.qr_code && (
                <div className="mt-3">
                  <p className="fw-semibold mb-2">Scan this QR code with Google Authenticator:</p>
                  <img src={twoFAStatus.qr_code} alt="2FA QR Code" className="mb-3 rounded" style={{ maxWidth: 200 }} />
                  <p className="text-muted small">Or enter manually: <code>{twoFAStatus.secret}</code></p>
                  <div className="d-flex gap-2 mt-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      value={twoFAToken}
                      onChange={e => setTwoFAToken(e.target.value)}
                      style={{ maxWidth: 160 }}
                    />
                    <button className="btn btn-wine" onClick={verify2FA}>Verify</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-3">🔒 Security Tips</h5>
              <ul className="list-unstyled" style={{ fontSize: 14 }}>
                <li className="mb-3 d-flex gap-2"><span>✓</span><span>Use a strong, unique password for your account</span></li>
                <li className="mb-3 d-flex gap-2"><span>✓</span><span>Enable 2FA for maximum account protection</span></li>
                <li className="mb-3 d-flex gap-2"><span>✓</span><span>Review and revoke sessions from unknown devices</span></li>
                <li className="mb-3 d-flex gap-2"><span>✓</span><span>Never share your login credentials with anyone</span></li>
                <li className="mb-3 d-flex gap-2"><span>✓</span><span>Log out from public or shared computers</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
