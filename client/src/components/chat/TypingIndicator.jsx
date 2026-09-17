import React from 'react'

export default function TypingIndicator({ username = 'Typing' }) {
  return (
    <div className="d-flex align-items-center gap-2 px-3 py-2 text-secondary small">
      <span className="fst-italic">{username} is typing</span>
      <span className="spinner-grow spinner-grow-sm text-wine" role="status" style={{ width: 6, height: 6 }} />
      <span className="spinner-grow spinner-grow-sm text-wine" role="status" style={{ width: 6, height: 6 }} />
      <span className="spinner-grow spinner-grow-sm text-wine" role="status" style={{ width: 6, height: 6 }} />
    </div>
  )
}
