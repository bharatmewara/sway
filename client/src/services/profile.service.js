import api from './api'

export const profileService = {
  getMyProfile: () => api.get('/profile/me'),
  getProfile: (id) => api.get(`/profile/${id}`),
  updateProfile: (data) => api.put('/profile/me', data),
  uploadPhoto: (formData) => api.post('/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPhotos: (userId) => api.get(userId ? `/profile/photos?userId=${userId}` : '/profile/photos'),
  deletePhoto: (photoId) => api.delete(`/profile/photos/${photoId}`)
}
