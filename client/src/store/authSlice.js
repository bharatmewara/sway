export const initialAuthState = {
  token: localStorage.getItem('sway_token') || null,
  user: (() => {
    try {
      return JSON.parse(localStorage.getItem('sway_user'))
    } catch {
      return null
    }
  })(),
  isAuthenticated: !!localStorage.getItem('sway_token'),
  loading: false,
  error: null
}

export const authActions = {
  SET_USER: (state, payload) => {
    localStorage.setItem('sway_user', JSON.stringify(payload))
    return { ...state, user: payload, isAuthenticated: true, loading: false }
  },
  SET_TOKEN: (state, payload) => {
    localStorage.setItem('sway_token', payload)
    return { ...state, token: payload, isAuthenticated: !!payload }
  },
  LOGOUT: (state) => {
    localStorage.removeItem('sway_token')
    localStorage.removeItem('sway_user')
    return { ...state, token: null, user: null, isAuthenticated: false, loading: false }
  },
  SET_LOADING: (state, payload) => ({ ...state, loading: payload }),
  SET_ERROR: (state, payload) => ({ ...state, error: payload, loading: false })
}
