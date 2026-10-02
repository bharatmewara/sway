import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [consentError, setConsentError] = useState('')

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
    if (!termsAccepted) {
      setConsentError('Please accept the Terms & Conditions and Privacy Policy to continue.')
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
      terms_accepted: true,
      privacy_policy_accepted: true,
      terms_version: '1.0',
      privacy_policy_version: '1.0',
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

      {/* Legal Consent Checkbox */}
      <div className="mt-3 text-start">
        <div className="form-check d-flex align-items-start gap-2">
          <input
            className="form-check-input mt-1"
            type="checkbox"
            id="termsConsent"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked)
              if (e.target.checked) setConsentError('')
            }}
            style={{
              cursor: 'pointer',
              borderColor: consentError ? '#dc3545' : '#76000b',
              minWidth: '18px',
              minHeight: '18px',
            }}
          />
          <label className="form-check-label small text-muted" htmlFor="termsConsent" style={{ cursor: 'pointer', lineHeight: 1.45, fontSize: '12.5px' }}>
            I agree to the{' '}
            <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="fw-semibold text-decoration-none" style={{ color: '#76000b' }}>
              Terms &amp; Conditions
            </Link>{' '}
            and acknowledge the{' '}
            <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="fw-semibold text-decoration-none" style={{ color: '#76000b' }}>
              Privacy Policy
            </Link>.
          </label>
        </div>
        {consentError && (
          <div className="text-danger small mt-1 ps-4" style={{ fontSize: '11.5px' }}>
            <i className="bi bi-exclamation-circle me-1" />
            {consentError}
          </div>
        )}
      </div>

      <Button type="submit" variant="wine" loading={loading} className="w-100 py-2 mt-3">
        Register & Proceed to Live Verification
      </Button>
    </form>
  )
}

