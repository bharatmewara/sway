import api from './api'

export const userService = {
  getMembers:               (params) => api.get('/users/members', { params }),
  getProfile:               (id)     => api.get(`/users/profile/${id}`),
  updateProfile:            (data)   => api.put('/users/profile', data),
  uploadPhoto:              (form)   => api.post('/users/profile/photo', form),
  getCounts:                ()       => api.get('/users/counts'),
  getNotifications:         (params) => api.get('/users/notifications', { params }),
  markNotificationRead:     (id)     => api.put(`/users/notifications/${id}/read`),
  markAllNotificationsRead: ()       => api.put('/users/notifications/read-all'),
}
