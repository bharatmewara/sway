import React from 'react'
import MainLayout from './MainLayout'

export default function ChatLayout({ children }) {
  return (
    <MainLayout>
      <div className="chat-wrapper">{children}</div>
    </MainLayout>
  )
}
