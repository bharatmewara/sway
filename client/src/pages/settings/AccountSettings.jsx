import React, { useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export default function AccountSettings() {
  const { user } = useAuth()
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (passwords.next !== passwords.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Password updated successfully')
      setPasswords({ current: '', next: '', confirm: '' })
    }, 600)
  }

  return (
    <MainLayout>
      <div className="container py-4" style={{ maxWidth: '640px' }}>
        <h4 className="fw-bold mb-4">Account Settings</h4>

        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
          <h5 className="fw-bold mb-3">Profile Credentials</h5>
          <div className="mb-3">
            <label className="form-label small text-secondary fw-semibold">Email Address</label>
            <input
              type="text"
              className="form-control bg-light"
              value={user?.email || ''}
              disabled
            />
            <div className="form-text small">Email cannot be changed directly.</div>
          </div>
          <div className="mb-3">
            <label className="form-label small text-secondary fw-semibold">Username</label>
            <input
              type="text"
              className="form-control bg-light"
              value={user?.username || ''}
              disabled
            />
          </div>
        </div>

        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
          <h5 className="fw-bold mb-3">Change Password</h5>
          <form onSubmit={handlePasswordChange}>
            <Input
              label="Current Password"
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              required
            />
            <Button type="submit" variant="wine" loading={loading} className="rounded-pill px-4">
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}
