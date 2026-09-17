import React, { useEffect, useRef } from 'react'
import Avatar from '../common/Avatar'
import Message from './Message'
import MessageInput from './MessageInput'
import TypingIndicator from './TypingIndicator'

export default function ChatWindow({
  activeUser,
  messages = [],
  currentUserId,
  onSendMessage,
  isTyping = false,
  onTyping
}) {
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  if (!activeUser) {
    return (
      <div className="h-100 d-flex flex-column align-items-center justify-content-center text-secondary p-4 text-center">
        <i className="bi bi-chat-dots fs-1 mb-2 text-wine opacity-50" />
        <h5>Select a Conversation</h5>
        <p className="small">Choose someone from the list to start talking.</p>
      </div>
    )
  }

  return (
    <div className="d-flex flex-column h-100 bg-white rounded-4 shadow-sm overflow-hidden border">
      {/* Header */}
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light">
        <div className="d-flex align-items-center gap-3">
          <Avatar
            src={activeUser.profile_photo}
            alt={activeUser.username}
            size={42}
            isOnline={activeUser.is_online}
          />
          <div>
            <h6 className="fw-bold mb-0">{activeUser.username}</h6>
            <span className="small text-secondary">
              {activeUser.is_online ? 'Active now' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-grow-1 p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {messages.map((m) => (
          <Message key={m.id} message={m} isOwn={m.sender_id === currentUserId} />
        ))}
        {isTyping && <TypingIndicator username={activeUser.username} />}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={onSendMessage} onTyping={onTyping} />
    </div>
  )
}
