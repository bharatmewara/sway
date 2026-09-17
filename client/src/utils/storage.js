import { STORAGE_KEYS } from './constants'

export const storage = {
  getToken:  ()      => localStorage.getItem(STORAGE_KEYS.TOKEN),
  setToken:  (t)     => localStorage.setItem(STORAGE_KEYS.TOKEN, t),
  removeToken: ()    => localStorage.removeItem(STORAGE_KEYS.TOKEN),

  getUser:   ()      => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) } catch { return null } },
  setUser:   (u)     => localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u)),
  removeUser: ()     => localStorage.removeItem(STORAGE_KEYS.USER),

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  },
}
