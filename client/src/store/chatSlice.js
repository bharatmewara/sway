export const initialChatState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  unreadCount: 0,
  typingUsers: {},
  loading: false
}

export const chatActions = {
  SET_CONVERSATIONS: (state, payload) => ({
    ...state,
    conversations: payload,
    unreadCount: payload.reduce((acc, c) => acc + (c.unread_count || 0), 0),
    loading: false
  }),
  SET_ACTIVE_CONVERSATION: (state, conversationId) => ({
    ...state,
    activeConversationId: conversationId
  }),
  SET_MESSAGES: (state, { conversationId, messages }) => ({
    ...state,
    messages: { ...state.messages, [conversationId]: messages }
  }),
  ADD_MESSAGE: (state, { conversationId, message }) => {
    const list = state.messages[conversationId] || []
    return {
      ...state,
      messages: { ...state.messages, [conversationId]: [...list, message] }
    }
  },
  SET_TYPING: (state, { userId, isTyping }) => ({
    ...state,
    typingUsers: { ...state.typingUsers, [userId]: isTyping }
  })
}
