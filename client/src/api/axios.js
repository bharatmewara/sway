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
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password');
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/forgot-password';

      // Do not perform a full-page reload/redirect if the user is already on an auth page or performing login
      if (!isAuthEndpoint && !isAuthPage) {
        if (window.location.pathname.startsWith('/admin')) {
          localStorage.removeItem('admin_token');
          if (window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        } else {
          localStorage.removeItem('sway_token');
          localStorage.removeItem('sway_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
)

export default instance
