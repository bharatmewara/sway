import api from './api'

export const discoveryService = {
  getDiscover:  (params) => api.get('/discovery/feed', { params }),
  swipe:        (data)   => api.post('/discovery/swipe', data),
  getNearby:    (params) => api.get('/users/members', { params }),
}
