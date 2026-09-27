import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../../layouts/AuthLayout'
import RegisterForm from '../../../components/auth/RegisterForm'
import { useAuth } from '../../../hooks/useAuth'
import { authService } from '../../../services/auth.service'
import toast from 'react-hot-toast'
import './Register.css'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRegister = async (formData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authService.register(formData)
      const data = res.data?.data || res.data
      const user = data.user
      const token = data.token

      login(user, token)
      toast.success('Registration successful! Please complete AI Selfie Verification.')
      navigate('/verify', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || err.message || 'Registration failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <RegisterForm onSubmit={handleRegister} loading={loading} error={error} />
      <div className="text-center mt-3 text-secondary small">
        Already registered?{' '}
        <Link to="/login" className="fw-semibold text-decoration-none" style={{ color: '#76000b' }}>
          Log In
        </Link>
      </div>
    </AuthLayout>
  )
}
