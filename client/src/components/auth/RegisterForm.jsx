import React, { useState } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'

export default function RegisterForm({ onSubmit, loading = false, error = null }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    gender: 'female',
    dob: '',
    city: 'Mumbai',
    country: 'India'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 rounded-4 shadow-sm border-0">
      <h3 className="fw-bold text-center mb-1" style={{ color: '#76000b' }}>
        Join SWAY
      </h3>
      <p className="text-secondary text-center small mb-4">
        Discover verified, meaningful dating experiences
      </p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="row g-2">
        <div className="col-12">
          <Input
            label="Username"
            name="username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            required
          />
        </div>
        <div className="col-12">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            required
          />
        </div>
        <div className="col-12">
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            required
          />
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="form-select"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>
        <div className="col-md-6">
          <Input
            label="Date of Birth"
            name="dob"
            type="date"
            value={formData.dob}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <Input
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <Input
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <Button type="submit" variant="wine" loading={loading} className="w-100 py-2 mt-3">
        Create Account
      </Button>
    </form>
  )
}
