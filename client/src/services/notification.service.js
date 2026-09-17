import api from './api'

export const notificationService = {
  getAll:      (params) => api.get('/users/notifications', { params }),
  markRead:    (id)     => api.put(`/users/notifications/${id}/read`),
  markAllRead: ()       => api.put('/users/notifications/read-all'),
}
