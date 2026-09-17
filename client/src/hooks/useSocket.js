import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

let globalSocket = null

export const useSocket = () => {
  const [socket, setSocket] = useState(globalSocket)
  const [connected, setConnected] = useState(globalSocket?.connected || false)

  useEffect(() => {
    const token = localStorage.getItem('sway_token')
    if (!token) return

    if (!globalSocket) {
      globalSocket = io('/', { auth: { token }, transports: ['websocket'] })
    }

    const s = globalSocket

    const handleConnect = () => setConnected(true)
    const handleDisconnect = () => setConnected(false)

    s.on('connect', handleConnect)
    s.on('disconnect', handleDisconnect)

    setSocket(s)
    setConnected(s.connected)

    return () => {
      s.off('connect', handleConnect)
      s.off('disconnect', handleDisconnect)
    }
  }, [])

  return { socket, connected }
}

export default useSocket
