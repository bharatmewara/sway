import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function BasicInfo() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    profession: '',
    education: '',
    height: 175,
    marital_status: 'single'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = async (e) => {
    e.preventDefault()
    try {
      await api.put('/profile/me', formData)
    } catch {}
    navigate('/onboarding/preferences')
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <div className="card border-0 rounded-4 shadow p-4" style={{ maxWidth: '440px', width: '100%' }}>
        <h4 className="fw-bold text-center mb-1">About You</h4>
        <p className="text-secondary small text-center mb-4">Step 1 of 3: Tell us a bit about your lifestyle</p>

        <form onSubmit={handleNext}>
          <Input
            label="Profession"
            name="profession"
            value={formData.profession}
            onChange={handleChange}
            placeholder="e.g. Software Engineer, Designer"
          />

          <Input
            label="Education"
            name="education"
            value={formData.education}
            onChange={handleChange}
            placeholder="e.g. Bachelor's in Architecture"
          />

          <div className="mb-3">
            <label className="form-label small text-secondary fw-semibold">
              Height: {formData.height} cm
            </label>
            <input
              type="range"
              min="140"
              max="220"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value, 10) })}
              className="form-range"
            />
          </div>

          <div className="mb-4">
            <label className="form-label small text-secondary fw-semibold">Relationship Status</label>
            <select
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              className="form-select rounded-3"
            >
              <option value="single">Single</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          <Button type="submit" variant="wine" className="w-100 py-2 rounded-pill">
            Continue &rarr;
          </Button>
        </form>
      </div>
    </div>
  )
}
