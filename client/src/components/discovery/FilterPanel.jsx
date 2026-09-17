import React from 'react'

export default function FilterPanel({ isOpen, onClose, filters, onFilterChange }) {
  if (!isOpen) return null

  return (
    <div className="card border-0 rounded-4 shadow-lg p-4 mb-4 bg-white position-relative">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Discovery Filters</h5>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small text-secondary fw-semibold">Show Me</label>
          <select
            value={filters.interested_in || 'both'}
            onChange={(e) => onFilterChange('interested_in', e.target.value)}
            className="form-select form-select-sm rounded-pill"
          >
            <option value="both">Everyone</option>
            <option value="female">Women</option>
            <option value="male">Men</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label small text-secondary fw-semibold">
            Max Distance ({filters.distance || 50} km)
          </label>
          <input
            type="range"
            min="5"
            max="150"
            value={filters.distance || 50}
            onChange={(e) => onFilterChange('distance', parseInt(e.target.value, 10))}
            className="form-range"
          />
        </div>
      </div>
    </div>
  )
}
