import React from 'react'
import Avatar from '../common/Avatar'

export default function ProfileCard({ profile, onClick }) {
  if (!profile) return null

  return (
    <div
      onClick={onClick}
      className="card rounded-4 border-0 shadow-sm overflow-hidden h-100 cursor-pointer profile-card-hover"
      style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
    >
      <div className="position-relative" style={{ height: '260px' }}>
        <img
          src={profile.profile_photo || (profile.gender === 'female' ? '/img/girl.png' : '/img/boy.png')}
          alt={profile.username}
          className="w-100 h-100"
          style={{ objectFit: 'cover' }}
        />
        <div
          className="position-absolute bottom-0 start-0 w-100 p-3 text-white"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
        >
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0 fw-bold">{profile.username}</h5>
            {profile.age && <span className="fs-6 opacity-75">{profile.age}</span>}
            {profile.verification_status === 'verified' && (
              <i className="bi bi-patch-check-fill text-info" />
            )}
          </div>
          {profile.city && (
            <div className="small opacity-75">
              <i className="bi bi-geo-alt me-1" />
              {profile.city}, {profile.country || 'India'}
            </div>
          )}
        </div>
      </div>
      <div className="card-body p-3">
        <p className="card-text text-secondary small mb-2 text-truncate">
          {profile.bio || 'Looking for meaningful conversations...'}
        </p>
        {profile.interests && (
          <div className="d-flex flex-wrap gap-1">
            {profile.interests.split(',').slice(0, 3).map((item, idx) => (
              <span key={idx} className="badge bg-light text-dark fw-normal rounded-pill px-2 py-1 small">
                {item.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
