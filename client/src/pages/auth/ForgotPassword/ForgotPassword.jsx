import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/axios'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('Reset link sent if email exists.')
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg fixed-top">
        <div className="container">
          <Link className="navbar-brand logo" to="/"><img src="/img/logo.png" alt="logo" /></Link>
        </div>
      </nav>

      <section className="login_page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-5">
              <div className="card register-card">
                <div className="p-4 p-md-5 text-center">
                  {sent ? (
                    <>
                      <i className="bi bi-envelope-check-fill text-success fs-1 mb-3 d-block" />
                      <h4 className="fw-bold">Check Your Email</h4>
                      <p className="text-muted">If this email exists in our system, a reset link has been sent.</p>
                      <Link to="/login" className="btn btn-wine mt-2">Back to Login</Link>
                    </>
                  ) : (
                    <>
                      <h3 className="fw-bold mb-1">Forgot Password</h3>
                      <p className="text-muted mb-4">Enter your email to receive a reset link.</p>
                      <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                          <div className="col-12 text-start">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-control" placeholder="Enter your email"
                              value={email} onChange={e => setEmail(e.target.value)} required />
                          </div>
                          <div className="col-12">
                            <button type="submit" className="btn btn-wine w-100" disabled={loading}>
                              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                              Send Reset Link
                            </button>
                          </div>
                          <div className="col-12">
                            <Link to="/login" className="text-decoration-none text-muted small">← Back to Login</Link>
                          </div>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
