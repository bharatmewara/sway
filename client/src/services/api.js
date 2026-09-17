import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const isAdmin = window.location.pathname.startsWith('/admin')
  const token   = isAdmin ? localStorage.getItem('admin_token') : localStorage.getItem('sway_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ''
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password')
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/forgot-password'

      // Do not perform a full-page reload/redirect if the user is already attempting to log in or on an auth page
      if (!isAuthEndpoint && !isAuthPage) {
        const isAdmin = window.location.pathname.startsWith('/admin')
        if (isAdmin) {
          localStorage.removeItem('admin_token')
          if (window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login'
          }
        } else {
          localStorage.removeItem('sway_token')
          localStorage.removeItem('sway_user')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
