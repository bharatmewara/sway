import React, { useState, useRef } from 'react'

export default function MessageInput({ onSend, onTyping, disabled = false }) {
  const [text, setText] = useState('')
  const typingTimeoutRef = useRef(null)

  const handleChange = (e) => {
    setText(e.target.value)
    if (onTyping) {
      onTyping(true)
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false)
      }, 1500)
    }
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
    if (onTyping) onTyping(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  return (
    <form onSubmit={handleSend} className="p-3 border-top bg-white d-flex align-items-center gap-2">
      <input
        type="text"
        className="form-control rounded-pill border-0 bg-light px-3 py-2"
        placeholder="Type a message..."
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="btn btn-wine rounded-circle p-2 d-flex align-items-center justify-content-center"
        style={{ width: '42px', height: '42px' }}
      >
        <i className="bi bi-send-fill text-white fs-6" />
      </button>
    </form>
  )
}
