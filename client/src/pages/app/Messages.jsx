import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import ChatList from '../../components/chat/ChatList'
import ChatWindow from '../../components/chat/ChatWindow'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../hooks/useAuth'
import { useSocket } from '../../hooks/useSocket'
import api from '../../services/api'

export default function Messages() {
  const { userId: routeUserId } = useParams()
  const { user } = useAuth()
  const { socket } = useSocket()

  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations')
      const list = res.data?.data?.conversations || []
      setConversations(list)

      if (routeUserId && list.length > 0) {
        const found = list.find((c) => String(c.other_user_id) === String(routeUserId))
        if (found) setActiveConv(found)
      } else if (list.length > 0 && !activeConv) {
        setActiveConv(list[0])
      }
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [routeUserId])

  useEffect(() => {
    if (!activeConv?.id) return
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/conversations/${activeConv.id}/messages`)
        setMessages(res.data?.data?.messages || [])
      } catch {
        setMessages([])
      }
    }
    fetchMessages()
  }, [activeConv?.id])

  // Real-time socket message handler
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function') return
    const handleNewMessage = (msg) => {
      if (activeConv && String(msg.conversation_id) === String(activeConv.id)) {
        setMessages((prev) => [...prev, msg])
      }
    }
    socket.on('new_message', handleNewMessage)
    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off('new_message', handleNewMessage)
      }
    }
  }, [socket, activeConv])

  const handleSendMessage = async (content) => {
    if (!activeConv) return
    try {
      const res = await api.post('/messages/messages', {
        receiver_id: activeConv.other_user_id,
        content
      })
      const sentMsg = res.data?.data?.message
      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg])
      }
    } catch {}
  }

  return (
    <MainLayout>
      <div className="container py-4">
        <h4 className="fw-bold mb-3">Messages</h4>
        {loading ? (
          <Loader text="Loading conversations..." />
        ) : (
          <div className="row g-3" style={{ minHeight: '600px' }}>
            <div className="col-12 col-md-4">
              <div className="card border-0 rounded-4 shadow-sm p-2 h-100 bg-white">
                <ChatList
                  conversations={conversations}
                  activeId={activeConv?.id}
                  onSelect={(conv) => setActiveConv(conv)}
                />
              </div>
            </div>
            <div className="col-12 col-md-8">
              <ChatWindow
                activeUser={activeConv}
                messages={messages}
                currentUserId={user?.id}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
