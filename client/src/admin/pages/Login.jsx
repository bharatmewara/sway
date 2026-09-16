import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Login() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="login-logo">
            <span>S</span>WAY
          </div>
          <div style={{ color: '#999', fontSize: 13 }}>Administration Console</div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#fff3e0',
              color: '#e65100',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 600,
              marginTop: 10,
            }}
          >
            <i className="bi bi-shield-lock-fill" />
            Restricted Access
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Alert */}
          {error && (
            <div
              style={{
                background: '#fce4ec',
                border: '1px solid #f48fb1',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#c62828',
                fontSize: 13,
              }}
            >
              <i className="bi bi-exclamation-circle-fill" />
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <div className="form-label-admin">Email Address</div>
            <div style={{ position: 'relative' }}>
              <i
                className="bi bi-envelope"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#aaa',
                  fontSize: 16,
                }}
              />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-input-admin"
                placeholder="admin@swayapp.com"
                style={{ paddingLeft: 42 }}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 28 }}>
            <div className="form-label-admin">Password</div>
            <div style={{ position: 'relative' }}>
              <i
                className="bi bi-lock"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#aaa',
                  fontSize: 16,
                }}
              />
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-input-admin"
                placeholder="••••••••"
                style={{ paddingLeft: 42, paddingRight: 42 }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#aaa',
                  padding: 0,
                  fontSize: 16,
                }}
              >
                <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#ccc' : '#e53935',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '14px',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Poppins, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" />
                Authenticating...
              </>
            ) : (
              <>
                <i className="bi bi-shield-lock" />
                Sign In to Admin Panel
              </>
            )}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            color: '#bbb',
            fontSize: 12,
            borderTop: '1px solid #f0f0f0',
            paddingTop: 20,
          }}
        >
          <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
          Only authorized admins can access this panel.
        </div>
      </div>
    </div>
  );
}
