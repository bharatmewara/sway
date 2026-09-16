import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

export default function useSocket() {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('sway_token')
    if (!token) return

    const socket = io('/', {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    return () => {
      socket.disconnect()
    }
  }, [])

  return { socket: socketRef.current, connected }
}
