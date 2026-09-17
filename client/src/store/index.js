import { useState, useEffect } from 'react'
import { initialAuthState, authActions } from './authSlice'
import { initialUserState, userActions } from './userSlice'
import { initialMatchState, matchActions } from './matchSlice'
import { initialChatState, chatActions } from './chatSlice'

// Centralized reactive state store
let state = {
  auth: initialAuthState,
  user: initialUserState,
  match: initialMatchState,
  chat: initialChatState
}

const listeners = new Set()

export const getState = () => state

export const dispatch = (actionType, payload) => {
  if (authActions[actionType]) {
    state = { ...state, auth: authActions[actionType](state.auth, payload) }
  } else if (userActions[actionType]) {
    state = { ...state, user: userActions[actionType](state.user, payload) }
  } else if (matchActions[actionType]) {
    state = { ...state, match: matchActions[actionType](state.match, payload) }
  } else if (chatActions[actionType]) {
    state = { ...state, chat: chatActions[actionType](state.chat, payload) }
  }
  listeners.forEach((listener) => listener(state))
}

export const useStore = (selector = (s) => s) => {
  const [selectedState, setSelectedState] = useState(() => selector(state))

  useEffect(() => {
    const handler = (newState) => setSelectedState(selector(newState))
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [selector])

  return [selectedState, dispatch]
}

export default { getState, dispatch, useStore }
