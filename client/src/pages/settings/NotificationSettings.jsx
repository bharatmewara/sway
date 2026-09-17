import React, { useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import toast from 'react-hot-toast'

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    matches: true,
    messages: true,
    likes: true,
    marketing: false
  })

  const toggle = (key) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      toast.success('Notification preference saved')
      return next
    })
  }

  return (
    <MainLayout>
      <div className="container py-4" style={{ maxWidth: '640px' }}>
        <h4 className="fw-bold mb-4">Notification Preferences</h4>

        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
          <div className="list-group list-group-flush">
            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
              <div>
                <h6 className="fw-bold mb-1">New Matches</h6>
                <p className="text-secondary small mb-0">Get alerted immediately when you receive a mutual match.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={settings.matches}
                  onChange={() => toggle('matches')}
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
              <div>
                <h6 className="fw-bold mb-1">Chat Messages</h6>
                <p className="text-secondary small mb-0">Receive instant push notifications for incoming messages.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={settings.messages}
                  onChange={() => toggle('messages')}
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center py-3">
              <div>
                <h6 className="fw-bold mb-1">Likes & Roses</h6>
                <p className="text-secondary small mb-0">Get notified when someone sends you a crush or like.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={settings.likes}
                  onChange={() => toggle('likes')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
