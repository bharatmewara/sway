import React from 'react'

export default function Message({ message, isOwn }) {
  if (!message) return null

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`d-flex flex-column mb-3 ${isOwn ? 'align-items-end' : 'align-items-start'}`}>
      <div
        className={`px-3 py-2 rounded-4 shadow-sm text-break ${
          isOwn ? 'bg-wine text-white rounded-bottom-end-0' : 'bg-light text-dark rounded-bottom-start-0'
        }`}
        style={{ maxWidth: '75%' }}
      >
        {message.media_url && (
          <img
            src={message.media_url}
            alt="Attachment"
            className="rounded-3 mb-2 w-100 object-fit-cover"
            style={{ maxHeight: '200px' }}
          />
        )}
        <div>{message.content}</div>
      </div>
      <div className="d-flex align-items-center gap-1 mt-1 px-1 text-secondary" style={{ fontSize: '0.75rem' }}>
        <span>{formatTime(message.created_at)}</span>
        {isOwn && (
          <i
            className={`bi ${
              message.is_read ? 'bi-check2-all text-primary' : 'bi-check2 text-secondary'
            }`}
          />
        )}
      </div>
    </div>
  )
}
