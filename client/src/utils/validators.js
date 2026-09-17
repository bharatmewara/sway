export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isValidUsername = (u) => /^[a-zA-Z0-9_]{3,30}$/.test(u)

export const isStrongPassword = (p) =>
  p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)

export const isAdult = (dob) => {
  const today = new Date(), birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 18
}
