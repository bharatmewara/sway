import React, { useState, useEffect } from 'react'
import MainLayout from '../../layouts/MainLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function PrivacySettings() {
  const [privacy, setPrivacy] = useState({
    hide_distance: false,
    hide_age: false,
    incognito_mode: false,
    blur_face: false
  })

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const res = await api.get('/users/privacy')
        if (res.data?.data?.privacy) {
          setPrivacy(res.data.data.privacy)
        }
      } catch {}
    }
    fetchPrivacy()
  }, [])

  const handleToggle = async (key) => {
    const updated = { ...privacy, [key]: !privacy[key] }
    setPrivacy(updated)
    try {
      await api.put('/users/privacy', updated)
      toast.success('Privacy settings saved')
    } catch {
      toast.error('Failed to update privacy')
    }
  }

  return (
    <MainLayout>
      <div className="container py-4" style={{ maxWidth: '640px' }}>
        <h4 className="fw-bold mb-4">Privacy & Visibility</h4>

        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
          <div className="list-group list-group-flush">
            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
              <div>
                <h6 className="fw-bold mb-1">Incognito Browsing</h6>
                <p className="text-secondary small mb-0">Only people you like will be able to see your profile.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={privacy.incognito_mode}
                  onChange={() => handleToggle('incognito_mode')}
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
              <div>
                <h6 className="fw-bold mb-1">Blur Face Photos</h6>
                <p className="text-secondary small mb-0">Blur primary photos until you choose to reveal them.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={privacy.blur_face}
                  onChange={() => handleToggle('blur_face')}
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
              <div>
                <h6 className="fw-bold mb-1">Hide Distance</h6>
                <p className="text-secondary small mb-0">Do not display your exact distance to other members.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={privacy.hide_distance}
                  onChange={() => handleToggle('hide_distance')}
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center py-3">
              <div>
                <h6 className="fw-bold mb-1">Hide Age</h6>
                <p className="text-secondary small mb-0">Keep your age confidential on your public profile card.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={privacy.hide_age}
                  onChange={() => handleToggle('hide_age')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
