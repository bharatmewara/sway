import React from 'react'
import Avatar from '../common/Avatar'
import Button from '../common/Button'

export default function ProfileHeader({ user, onEdit, onUploadPhoto }) {
  if (!user) return null

  return (
    <div className="card border-0 rounded-4 shadow-sm overflow-hidden mb-4">
      <div
        className="profile-cover position-relative"
        style={{ height: '180px', backgroundColor: '#76000b' }}
      >
        <div className="position-absolute bottom-0 start-0 w-100 p-4 d-flex align-items-end justify-content-between">
          <div className="d-flex align-items-end gap-3 translate-middle-y mt-5">
            <Avatar
              src={user.profile_photo}
              alt={user.username}
              size={96}
              isOnline={user.is_online}
              gender={user.gender}
              className="border border-4 border-white shadow"
            />
            <div className="text-white mt-4">
              <h3 className="fw-bold mb-0 d-flex align-items-center gap-2">
                {user.username}, {user.age || 25}
                {user.verification_status === 'verified' && (
                  <i className="bi bi-patch-check-fill text-info fs-5" />
                )}
              </h3>
              <p className="opacity-75 small mb-0">
                <i className="bi bi-geo-alt me-1" />
                {user.city || 'India'}
              </p>
            </div>
          </div>
          {onEdit && (
            <Button
              variant="light"
              size="sm"
              onClick={onEdit}
              className="rounded-pill shadow-sm"
              icon={<i className="bi bi-pencil" />}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>
      <div className="card-body pt-5 px-4 pb-3">
        <div className="row text-center border-top pt-3 mt-2">
          <div className="col-4 border-end">
            <div className="fw-bold text-wine fs-5">{user.connect_credits || 0}</div>
            <div className="text-secondary small">Connects</div>
          </div>
          <div className="col-4 border-end">
            <div className="fw-bold fs-5 text-capitalize">{user.role || 'Member'}</div>
            <div className="text-secondary small">Status</div>
          </div>
          <div className="col-4">
            <div className="fw-bold fs-5 text-capitalize">{user.verification_status || 'Pending'}</div>
            <div className="text-secondary small">Verification</div>
          </div>
        </div>
      </div>
    </div>
  )
}
