import React from 'react'
import Avatar from '../common/Avatar'

export default function ChatList({ conversations = [], activeId, onSelect }) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-secondary small">
        <i className="bi bi-chat-heart fs-2 d-block mb-2 text-wine opacity-50" />
        No active conversations yet. Match with someone to start chatting!
      </div>
    )
  }

  return (
    <div className="list-group list-group-flush">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId
        return (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv)}
            className={`list-group-item list-group-item-action border-0 px-3 py-3 d-flex align-items-center gap-3 rounded-3 mb-1 ${
              isActive ? 'bg-light fw-bold' : ''
            }`}
          >
            <Avatar
              src={conv.profile_photo}
              alt={conv.username}
              size={48}
              isOnline={conv.is_online}
            />
            <div className="flex-grow-1 text-start overflow-hidden">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-truncate">{conv.username}</span>
                {conv.message_time && (
                  <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                    {new Date(conv.message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="text-secondary small mb-0 text-truncate">
                {conv.last_message || 'Draft conversation...'}
              </p>
            </div>
            {conv.unread_count > 0 && (
              <span className="badge bg-wine rounded-pill">{conv.unread_count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
