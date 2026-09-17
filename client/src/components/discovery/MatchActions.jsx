import React from 'react'

export default function MatchActions({ onPass, onLike, onSuperLike, onRewind, disabled = false }) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-3 py-3">
      {onRewind && (
        <button
          type="button"
          onClick={onRewind}
          disabled={disabled}
          className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center text-warning"
          style={{ width: '48px', height: '48px' }}
          title="Rewind"
        >
          <i className="bi bi-arrow-counterclockwise fs-5" />
        </button>
      )}

      <button
        type="button"
        onClick={onPass}
        disabled={disabled}
        className="btn btn-light rounded-circle shadow d-flex align-items-center justify-content-center text-danger"
        style={{ width: '60px', height: '60px' }}
        title="Pass"
      >
        <i className="bi bi-x-lg fs-3" />
      </button>

      {onSuperLike && (
        <button
          type="button"
          onClick={onSuperLike}
          disabled={disabled}
          className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center text-info"
          style={{ width: '48px', height: '48px' }}
          title="Super Like"
        >
          <i className="bi bi-star-fill fs-5" />
        </button>
      )}

      <button
        type="button"
        onClick={onLike}
        disabled={disabled}
        className="btn btn-light rounded-circle shadow d-flex align-items-center justify-content-center text-success"
        style={{ width: '60px', height: '60px' }}
        title="Like"
      >
        <i className="bi bi-heart-fill fs-3" />
      </button>
    </div>
  )
}
