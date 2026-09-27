import React, { useState } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'

export default function RegisterForm({ onSubmit, loading = false, error = null }) {
  const [formData, setFormData] = useState({
    gender: 'female',
    username: '',
    email: '',
    password: '',
    dob: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleGenderSelect = (gender) => {
    setFormData((prev) => ({ ...prev, gender }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!['female', 'male'].includes(formData.gender)) {
      return
    }
    try {
      sessionStorage.setItem('sway_selected_gender', formData.gender)
    } catch {
      // ignore storage errors
    }
    onSubmit({
      ...formData,
      selected_gender: formData.gender,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 rounded-4 shadow-sm border-0">
      <h3 className="fw-bold text-center mb-1" style={{ color: '#76000b' }}>
        Join SWAY
      </h3>
      <p className="text-secondary text-center small mb-3">
        Select your gender and register to proceed to Live Selfie Verification
      </p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* Step 1: Prominent Gender Selection */}
      <div className="mb-3">
        <label className="form-label fw-bold small text-dark d-block mb-2">
          1. Select Your Gender <span className="text-danger">*</span>
        </label>
        <div className="row g-2">
          <div className="col-6">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleGenderSelect('female')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleGenderSelect('female')}
              className="p-3 rounded-3 text-center border"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderColor: formData.gender === 'female' ? '#76000b' : '#dee2e6',
                backgroundColor: formData.gender === 'female' ? '#fff5f7' : '#ffffff',
                boxShadow: formData.gender === 'female' ? '0 0 0 2px rgba(118,0,11,0.18)' : 'none',
              }}
            >
              <i
                className="bi bi-gender-female fs-3 d-block mb-1"
                style={{ color: formData.gender === 'female' ? '#d63384' : '#6c757d' }}
              />
              <div className="fw-bold small" style={{ color: formData.gender === 'female' ? '#76000b' : '#212529' }}>
                Female
              </div>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                Free Chat Access
              </div>
            </div>
          </div>

          <div className="col-6">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleGenderSelect('male')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleGenderSelect('male')}
              className="p-3 rounded-3 text-center border"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderColor: formData.gender === 'male' ? '#76000b' : '#dee2e6',
                backgroundColor: formData.gender === 'male' ? '#fff5f7' : '#ffffff',
                boxShadow: formData.gender === 'male' ? '0 0 0 2px rgba(118,0,11,0.18)' : 'none',
              }}
            >
              <i
                className="bi bi-gender-male fs-3 d-block mb-1"
                style={{ color: formData.gender === 'male' ? '#0d6efd' : '#6c757d' }}
              />
              <div className="fw-bold small" style={{ color: formData.gender === 'male' ? '#76000b' : '#212529' }}>
                Male
              </div>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                Connect-Based Access
              </div>
            </div>
          </div>
        </div>
        <div className="form-text small text-muted mt-1">
          <i className="bi bi-camera-video me-1 text-danger" />
          Your selected gender will be verified using your live camera on the next step.
        </div>
      </div>

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
            label="State"
            name="state"
            value={formData.state}
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
        Register & Proceed to Live Verification
      </Button>
    </form>
  )
}

