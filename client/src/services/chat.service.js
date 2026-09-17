import api from './api'

export const chatService = {
  getConversations:    ()                    => api.get('/messages/conversations'),
  getMessages:         (userId, params)      => api.get(`/messages/${userId}`, { params }),
  sendMessage:         (data)                => api.post('/messages/send', data),
  deleteConversation:  (userId)              => api.delete(`/messages/conversation/${userId}`),
}
