import React from 'react'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import Button from '../common/Button'

export default function MatchProfile({ match, isOpen, onClose, onStartChat, onUnmatch }) {
  if (!match) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center pb-3">
        <Avatar
          src={match.profile_photo}
          alt={match.username}
          size={110}
          isOnline={match.is_online}
          className="mb-3 border border-4 border-light shadow-sm"
        />
        <h4 className="fw-bold mb-0">
          {match.username}, {match.age || 25}
        </h4>
        <p className="text-secondary small mb-3">
          <i className="bi bi-geo-alt me-1" />
          {match.city || 'India'}
        </p>

        {match.compatibility_score && (
          <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 mb-3">
            {match.compatibility_score}% Compatible Match
          </span>
        )}

        <div className="p-3 bg-light rounded-4 text-start mb-4">
          <h6 className="fw-bold small text-secondary mb-1">About</h6>
          <p className="small mb-0">{match.bio || 'No bio provided yet.'}</p>
        </div>

        <div className="d-flex gap-2 justify-content-center">
          <Button
            variant="wine"
            onClick={() => {
              onClose()
              onStartChat(match)
            }}
            className="rounded-pill px-4"
            icon={<i className="bi bi-chat-dots-fill" />}
          >
            Start Chat
          </Button>
          {onUnmatch && (
            <Button
              variant="outline-danger"
              onClick={() => onUnmatch(match)}
              className="rounded-pill px-3"
            >
              Unmatch
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
