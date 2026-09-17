import React, { useState } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'

export default function LoginForm({ onSubmit, loading = false, error = null }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ identifier, password })
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 rounded-4 shadow-sm border-0">
      <h3 className="fw-bold text-center mb-1" style={{ color: '#76000b' }}>
        Welcome Back
      </h3>
      <p className="text-secondary text-center small mb-4">
        Log in to continue finding meaningful connections
      </p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <Input
        label="Email or Username"
        name="identifier"
        autoComplete="username"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Enter your email or username"
        required
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
      />

      <div className="d-flex justify-content-between align-items-center mb-4 small">
        <label className="d-flex align-items-center gap-2 cursor-pointer">
          <input type="checkbox" className="form-check-input mt-0" /> Remember me
        </label>
        <a href="/forgot-password" className="text-decoration-none fw-semibold" style={{ color: '#76000b' }}>
          Forgot password?
        </a>
      </div>

      <Button type="submit" variant="wine" loading={loading} className="w-100 py-2">
        Log In
      </Button>
    </form>
  )
}
