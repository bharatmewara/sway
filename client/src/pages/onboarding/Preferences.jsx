import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import api from '../../services/api'

export default function Preferences() {
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState({
    interested_in: 'both',
    preferred_age_min: 21,
    preferred_age_max: 35,
    preferred_distance: 50
  })

  const handleNext = async (e) => {
    e.preventDefault()
    try {
      await api.put('/users/preferences', prefs)
    } catch {}
    navigate('/onboarding/profile-setup')
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <div className="card border-0 rounded-4 shadow p-4" style={{ maxWidth: '440px', width: '100%' }}>
        <h4 className="fw-bold text-center mb-1">Match Preferences</h4>
        <p className="text-secondary small text-center mb-4">Step 2 of 3: Who are you hoping to meet?</p>

        <form onSubmit={handleNext}>
          <div className="mb-4">
            <label className="form-label small text-secondary fw-semibold">Looking to Meet</label>
            <div className="d-flex gap-2">
              {['female', 'male', 'both'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPrefs({ ...prefs, interested_in: type })}
                  className={`btn btn-sm flex-grow-1 rounded-pill text-capitalize ${
                    prefs.interested_in === type ? 'btn-wine' : 'btn-outline-secondary'
                  }`}
                >
                  {type === 'both' ? 'Everyone' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small text-secondary fw-semibold">
              Age Range: {prefs.preferred_age_min} - {prefs.preferred_age_max}
            </label>
            <div className="d-flex gap-2">
              <input
                type="range"
                min="18"
                max="60"
                value={prefs.preferred_age_min}
                onChange={(e) => setPrefs({ ...prefs, preferred_age_min: parseInt(e.target.value, 10) })}
                className="form-range"
              />
              <input
                type="range"
                min="18"
                max="60"
                value={prefs.preferred_age_max}
                onChange={(e) => setPrefs({ ...prefs, preferred_age_max: parseInt(e.target.value, 10) })}
                className="form-range"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small text-secondary fw-semibold">
              Max Distance: {prefs.preferred_distance} km
            </label>
            <input
              type="range"
              min="5"
              max="150"
              value={prefs.preferred_distance}
              onChange={(e) => setPrefs({ ...prefs, preferred_distance: parseInt(e.target.value, 10) })}
              className="form-range"
            />
          </div>

          <Button type="submit" variant="wine" className="w-100 py-2 rounded-pill">
            Continue &rarr;
          </Button>
        </form>
      </div>
    </div>
  )
}
