import api from './api'

export const subscriptionService = {
  getPlans:      ()      => api.get('/payments/plans'),
  createOrder:   (data)  => api.post('/payments/create-order', data),
  verifyPayment: (data)  => api.post('/payments/verify', data),
  getHistory:    (params)=> api.get('/payments/history', { params }),
}
