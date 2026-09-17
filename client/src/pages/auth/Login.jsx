import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import LoginForm from '../../components/auth/LoginForm'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/auth.service'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (credentials) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authService.login(credentials)
      const data = res.data?.data || res.data
      const user = data.user
      const token = data.token

      login(user, token)
      toast.success('Welcome back!')
      navigate('/home')
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.data?.errors && err.response.data.errors[0]?.msg) ||
        err.message ||
        'Invalid credentials. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
      <div className="text-center mt-3 text-secondary small">
        Don't have an account?{' '}
        <Link to="/register" className="fw-semibold text-decoration-none" style={{ color: '#76000b' }}>
          Create an Account
        </Link>
      </div>
    </AuthLayout>
  )
}
