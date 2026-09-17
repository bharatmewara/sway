export const initialMatchState = {
  queue: [],
  matches: [],
  currentProfile: null,
  loading: false,
  error: null
}

export const matchActions = {
  SET_QUEUE: (state, payload) => ({
    ...state,
    queue: payload,
    currentProfile: payload.length > 0 ? payload[0] : null,
    loading: false
  }),
  POP_QUEUE: (state) => {
    const nextQueue = state.queue.slice(1)
    return {
      ...state,
      queue: nextQueue,
      currentProfile: nextQueue.length > 0 ? nextQueue[0] : null
    }
  },
  SET_MATCHES: (state, payload) => ({ ...state, matches: payload, loading: false }),
  ADD_MATCH: (state, payload) => ({ ...state, matches: [payload, ...state.matches] }),
  REMOVE_MATCH: (state, targetUserId) => ({
    ...state,
    matches: state.matches.filter((m) => m.id !== targetUserId)
  }),
  SET_MATCH_LOADING: (state, payload) => ({ ...state, loading: payload })
}
