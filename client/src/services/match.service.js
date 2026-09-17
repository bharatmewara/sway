import api from './api'

export const matchService = {
  getMatches:       (params) => api.get('/matching/matches', { params }),
  sendRequest:      (id, data)=> api.post(`/requests/${id}`, data),
  respondRequest:   (id, data)=> api.put(`/requests/${id}`, data),
  getRequests:      ()        => api.get('/requests'),
  sendCrush:        (id)      => api.post(`/crushes/${id}`),
  getCrushes:       ()        => api.get('/crushes'),
  getVisitors:      ()        => api.get('/visitors'),
}
