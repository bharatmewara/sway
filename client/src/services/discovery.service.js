import api from './api'

export const discoveryService = {
  getDiscover:  (params) => api.get('/matching/discover', { params }),
  swipe:        (data)   => api.post('/matching/swipe', data),
  getNearby:    (params) => api.get('/users/members', { params }),
}
