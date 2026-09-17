import React from 'react'

export default function ProfilePreferences({ preferences, onChange, onSave, loading = false }) {
  if (!preferences) return null

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
      <h5 className="fw-bold mb-3">Dating & Discovery Preferences</h5>

      <div className="mb-4">
        <label className="form-label fw-semibold small text-secondary">
          Age Range: {preferences.preferred_age_min || 18} - {preferences.preferred_age_max || 60} years
        </label>
        <div className="d-flex gap-3 align-items-center">
          <input
            type="range"
            min="18"
            max="70"
            value={preferences.preferred_age_min || 18}
            onChange={(e) => onChange('preferred_age_min', parseInt(e.target.value, 10))}
            className="form-range"
          />
          <input
            type="range"
            min="18"
            max="70"
            value={preferences.preferred_age_max || 60}
            onChange={(e) => onChange('preferred_age_max', parseInt(e.target.value, 10))}
            className="form-range"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold small text-secondary">
          Maximum Distance: {preferences.preferred_distance || 50} km
        </label>
        <input
          type="range"
          min="5"
          max="200"
          value={preferences.preferred_distance || 50}
          onChange={(e) => onChange('preferred_distance', parseInt(e.target.value, 10))}
          className="form-range"
        />
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold small text-secondary">Interested In</label>
        <div className="d-flex gap-2">
          {['female', 'male', 'both'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange('interested_in', type)}
              className={`btn btn-sm rounded-pill px-3 text-capitalize ${
                preferences.interested_in === type ? 'btn-wine' : 'btn-outline-secondary'
              }`}
            >
              {type === 'both' ? 'Everyone' : type}
            </button>
          ))}
        </div>
      </div>

      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="btn btn-wine btn-sm rounded-pill px-4"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      )}
    </div>
  )
}
