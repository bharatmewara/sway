import { createContext, useContext, useState, useEffect } from 'react'
import axios from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('sway_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('sway_token')
    if (storedToken) {
      verifyToken(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (tkn) => {
    try {
      const res = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${tkn}` }
      })
      setUser(res.data.user || res.data)
      setToken(tkn)
    } catch {
      localStorage.removeItem('sway_token')
      localStorage.removeItem('sway_user')
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (userData, tkn) => {
    localStorage.setItem('sway_token', tkn)
    localStorage.setItem('sway_user', JSON.stringify(userData))
    setToken(tkn)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('sway_token')
    localStorage.removeItem('sway_user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (data) => {
    const updated = { ...user, ...data }
    setUser(updated)
    localStorage.setItem('sway_user', JSON.stringify(updated))
  }

  const [counts, setCounts] = useState({ messages: 0, requests: 0, notifications: 0 });
  const [activeChatUserId, setActiveChatUserId] = useState(null);

  const fetchCounts = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/users/counts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to fetch counts', err);
    }
  };

  useEffect(() => {
    let interval;
    if (user && token) {
      fetchCounts();
      interval = setInterval(fetchCounts, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading, counts, fetchCounts, activeChatUserId, setActiveChatUserId }}>
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
