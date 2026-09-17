import React from 'react'

export default function DiscoverCard({ profile }) {
  if (!profile) return null

  return (
    <div className="w-100 h-100 position-relative rounded-4 overflow-hidden shadow-lg bg-dark text-white">
      <img
        src={profile.profile_photo || (profile.gender === 'female' ? '/img/girl.png' : '/img/boy.png')}
        alt={profile.username}
        className="w-100 h-100 object-fit-cover"
      />

      <div
        className="position-absolute bottom-0 start-0 w-100 p-4"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}
      >
        <div className="d-flex align-items-center gap-2 mb-1">
          <h2 className="fw-bold mb-0">{profile.username}</h2>
          <span className="fs-4 opacity-75">{profile.age || 24}</span>
          {profile.verification_status === 'verified' && (
            <i className="bi bi-patch-check-fill text-info fs-5" />
          )}
        </div>

        <p className="small opacity-75 mb-2">
          <i className="bi bi-geo-alt me-1" />
          {profile.city || 'India'}, {profile.country || 'India'}
        </p>

        {profile.bio && (
          <p className="small mb-3 text-light" style={{ maxWidth: '90%' }}>
            {profile.bio}
          </p>
        )}

        {profile.interests && (
          <div className="d-flex flex-wrap gap-1">
            {profile.interests.split(',').map((interest, idx) => (
              <span key={idx} className="badge bg-white bg-opacity-25 rounded-pill px-2 py-1 small fw-normal">
                {interest.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
