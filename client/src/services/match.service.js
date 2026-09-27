import api from './api'

export const matchService = {
  getMatches:       (params) => api.get('/matches', { params }),
  sendRequest:      (data)   => api.post('/requests', data),
  respondRequest:   (id, data) => api.put(`/requests/${id}`, data),
  getRequests:      ()       => api.get('/requests'),
  sendCrush:        (id)     => api.post(`/crushes/${id}`),
  getCrushes:       ()       => api.get('/crushes'),
  getVisitors:      ()       => api.get('/visitors'),
}
