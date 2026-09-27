import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import './Login.css'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password,   setPassword]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!identifier || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { identifier, password })
      const { user, token } = res.data
      login(user, token)
      const isVerified = ['verified', 'VERIFIED'].includes(user?.verification_status)
      const isCompleted = !!user?.profile_completed || user?.onboarding_status === 'PROFILE_COMPLETED'
      if (!isVerified) {
        toast.success('Please complete AI selfie verification to continue.')
        navigate('/verify')
      } else if (!isCompleted) {
        toast.success('Please complete your profile setup.')
        navigate('/profile')
      } else {
        toast.success('Welcome back!')
        navigate('/home')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login_page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="register-card card p-5">
              <div className="text-center mb-4">
                <img src="/img/logo-black.png" alt="SWAY" style={{ height: 50 }} />
                <h4 className="fw-bold mt-3">Welcome Back</h4>
                <p className="text-muted small">Sign in to your account</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email or Username</label>
                  <input type="text" className="form-control" placeholder="Enter email or username" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Password</label>
                  <input type="password" className="form-control" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-wine w-100 py-3" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <div className="text-center mt-3">
                <Link to="/forgot-password" className="text-muted small">Forgot password?</Link>
              </div>
              <hr />
              <div className="text-center small">
                Don't have an account? <Link to="/register" className="text-wine fw-semibold">Create Account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
