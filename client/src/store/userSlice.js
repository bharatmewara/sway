export const initialUserState = {
  profile: null,
  preferences: null,
  privacy: null,
  loading: false,
  error: null
}

export const userActions = {
  SET_PROFILE: (state, payload) => ({ ...state, profile: payload, loading: false }),
  SET_PREFERENCES: (state, payload) => ({ ...state, preferences: payload }),
  SET_PRIVACY: (state, payload) => ({ ...state, privacy: payload }),
  SET_USER_LOADING: (state, payload) => ({ ...state, loading: payload }),
  SET_USER_ERROR: (state, payload) => ({ ...state, error: payload, loading: false })
}
