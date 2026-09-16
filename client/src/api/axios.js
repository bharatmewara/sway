import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
})

instance.interceptors.request.use(
  (config) => {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const token = isAdminRoute ? localStorage.getItem('admin_token') : localStorage.getItem('sway_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('admin_token')
        window.location.href = '/admin/login'
      } else {
        localStorage.removeItem('sway_token')
        localStorage.removeItem('sway_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default instance
