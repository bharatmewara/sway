import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { authService } from '../../services/auth.service'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to request reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="card p-4 rounded-4 shadow-sm border-0">
        <h3 className="fw-bold text-center mb-1" style={{ color: '#76000b' }}>
          Reset Password
        </h3>
        <p className="text-secondary text-center small mb-4">
          Enter your registered email address to receive password reset instructions
        </p>

        {sent ? (
          <div className="alert alert-success py-3 text-center small">
            If an account exists for {email}, a recovery link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
            <Button type="submit" variant="wine" loading={loading} className="w-100 py-2 mt-2">
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="text-center mt-3">
          <Link to="/login" className="small text-decoration-none fw-semibold" style={{ color: '#76000b' }}>
            &larr; Back to Log In
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
