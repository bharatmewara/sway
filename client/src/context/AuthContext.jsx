import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/auth.service'
import { userService } from '../services/user.service'
import { storage } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(storage.getToken)
  const [loading, setLoading] = useState(true)
  const [counts,  setCounts]  = useState({ messages: 0, requests: 0, notifications: 0 })
  const [activeChatUserId, setActiveChatUserId] = useState(null)

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

  const login = (userData, t) => {
    storage.setToken(t)
    storage.setUser(userData)
    setToken(t)
    setUser(userData)
  }

  const logout = () => {
    storage.clear()
    setToken(null)
    setUser(null)
  }

  const updateUser = (data) => {
    const updated = { ...user, ...data }
    setUser(updated)
    storage.setUser(updated)
  }

  const fetchCounts = useCallback(async () => {
    if (!token) return
    try {
      const res = await userService.getCounts()
      if (res.data?.success) setCounts(res.data.counts)
    } catch {}
  }, [token])

  useEffect(() => {
    if (!user || !token) return
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [user, token, fetchCounts])

  return (
    <AuthContext.Provider value={{
      user, token, loading, counts,
      login, logout, updateUser, fetchCounts,
      activeChatUserId, setActiveChatUserId,
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
