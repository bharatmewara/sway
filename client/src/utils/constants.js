export const CREDIT_COSTS = {
  SEND_CRUSH:        5,
  SEND_REQUEST:      5,
  VIEW_PRIVATE:      10,
  FIRST_MESSAGE:     5,
}

export const CREDIT_PACKS = [
  { id: 'pack_25',  name: 'Pack 25',  credits: 25,  price: 1500 },
  { id: 'pack_100', name: 'Pack 100', credits: 100, price: 4200 },
  { id: 'pack_400', name: 'Pack 400', credits: 400, price: 9600 },
]

export const GENDER = { MALE: 'male', FEMALE: 'female' }

export const VERIFICATION_STATUS = {
  PENDING:      'pending',
  UNDER_REVIEW: 'under_review',
  VERIFIED:     'verified',
  REJECTED:     'rejected',
}

export const ROLES = { USER: 'user', ADMIN: 'admin', SUPERADMIN: 'superadmin' }

export const STORAGE_KEYS = {
  TOKEN: 'sway_token',
  USER:  'sway_user',
  ADMIN_TOKEN: 'admin_token',
}
