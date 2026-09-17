import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <div className="card border-0 rounded-4 shadow-lg p-5 text-center" style={{ maxWidth: '480px' }}>
        <div className="mb-4">
          <img src="/img/logo.png" alt="SWAY" style={{ height: '48px' }} />
        </div>
        <h2 className="fw-bold mb-2" style={{ color: '#76000b' }}>
          Welcome to SWAY
        </h2>
        <p className="text-secondary mb-4">
          A premium, verified dating community built on respect, authentic connections, and genuine privacy.
        </p>

        <div className="d-flex flex-column gap-3 mb-4 text-start small">
          <div className="d-flex align-items-center gap-3 p-2 rounded-3 bg-light">
            <i className="bi bi-shield-check text-wine fs-4" />
            <div>
              <div className="fw-bold">100% Verified Profiles</div>
              <div className="text-secondary">Face verification protects every member</div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3 p-2 rounded-3 bg-light">
            <i className="bi bi-incognito text-wine fs-4" />
            <div>
              <div className="fw-bold">Privacy Controls</div>
              <div className="text-secondary">Blur face photos and control visibility</div>
            </div>
          </div>
        </div>

        <Button
          variant="wine"
          className="w-100 py-2 rounded-pill"
          onClick={() => navigate('/onboarding/basic-info')}
        >
          Get Started
        </Button>
      </div>
    </div>
  )
}
