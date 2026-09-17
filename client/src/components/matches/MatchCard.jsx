import React from 'react'
import Avatar from '../common/Avatar'

export default function MatchCard({ match, onClick, onChat }) {
  if (!match) return null

  return (
    <div
      onClick={onClick}
      className="card border-0 rounded-4 shadow-sm p-3 h-100 cursor-pointer d-flex flex-column align-items-center text-center match-card-hover"
      style={{ transition: 'transform 0.15s ease' }}
    >
      <Avatar
        src={match.profile_photo}
        alt={match.username}
        size={80}
        isOnline={match.is_online}
        className="mb-2"
      />
      <h6 className="fw-bold mb-0 text-truncate w-100">{match.username}</h6>
      <span className="small text-secondary mb-2">{match.city || 'India'}</span>

      {onChat && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onChat(match)
          }}
          className="btn btn-sm btn-wine rounded-pill px-3 mt-auto"
        >
          <i className="bi bi-chat-dots-fill me-1" /> Message
        </button>
      )}
    </div>
  )
}
