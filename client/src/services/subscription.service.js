import api from './api'

export const subscriptionService = {
  getPlans:      ()      => api.get('/payments/plans'),
  getCreditPacks:()      => api.get('/payments/packs'),
  purchase:      (data)  => api.post('/payments/purchase', data),
}
