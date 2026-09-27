import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { authService } from '../services/auth.service'
import { userService } from '../services/user.service'
import { storage } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => storage.getToken())
  const [loading, setLoading] = useState(true)
  const [counts,  setCounts]  = useState({ messages: 0, requests: 0, notifications: 0 })
  const [activeChatUserId, setActiveChatUserId] = useState(null)
  const [insufficientConnectsModal, setInsufficientConnectsModal] = useState(null)
  const socketRef = useRef(null)

  const showInsufficientConnects = useCallback((opts = {}) => {
    setInsufficientConnectsModal({
      open: true,
      message: opts.message || '',
      requiredConnects: opts.requiredConnects ?? opts.required_connects ?? 5,
      currentConnects: opts.currentConnects ?? opts.credits ?? undefined,
      returnTo: opts.returnTo || undefined,
    })
  }, [])

  const hideInsufficientConnects = useCallback(() => {
    setInsufficientConnectsModal(null)
  }, [])

  // ── Verify token on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const t = storage.getToken()
    if (t) verifyToken(t)
    else   setLoading(false)
  }, [])

  const verifyToken = async (t) => {
    try {
      const res = await authService.me()
      setUser(res.data.user || res.data)
      setToken(t)
    } catch {
      storage.clear()
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch counts from backend ──────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    if (!storage.getToken()) return
    try {
      const res = await userService.getCounts()
      if (res.data?.success) setCounts(res.data.counts)
    } catch {}
  }, [])

  // ── Poll counts every 15s when logged in ──────────────────────────────────
  useEffect(() => {
    if (!user || !token) return
    fetchCounts()
    const interval = setInterval(fetchCounts, 15000)
    return () => clearInterval(interval)
  }, [user, token, fetchCounts])

  // ── Socket: connect when user is logged in, refresh counts on events ──────
  useEffect(() => {
    if (!user || !token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }

    const socket = io('/', { auth: { token }, transports: ['websocket'] })
    socketRef.current = socket

    // Increment counts immediately on real-time events
    socket.on('new_message', () => {
      setCounts(prev => ({ ...prev, messages: prev.messages + 1 }))
    })

    socket.on('new_request', () => {
      setCounts(prev => ({ ...prev, requests: prev.requests + 1 }))
    })

    socket.on('new_notification', () => {
      setCounts(prev => ({ ...prev, notifications: prev.notifications + 1 }))
    })

    // Re-fetch accurate counts on any of these events
    socket.on('messages_read', fetchCounts)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user, token, fetchCounts])

  const login = (userData, t) => {
    storage.setToken(t)
    storage.setUser(userData)
    setToken(t)
    setUser(userData)
  }

  const logout = () => {
    storage.clear()
    socketRef.current?.disconnect()
    socketRef.current = null
    setToken(null)
    setUser(null)
    setCounts({ messages: 0, requests: 0, notifications: 0 })
  }

  const updateUser = (data) => {
    const updated = { ...user, ...data }
    setUser(updated)
    storage.setUser(updated)
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading, counts,
      login, logout, updateUser, fetchCounts,
      activeChatUserId, setActiveChatUserId,
      insufficientConnectsModal, showInsufficientConnects, hideInsufficientConnects,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
