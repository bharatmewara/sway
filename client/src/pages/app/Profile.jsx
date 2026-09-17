import React, { useState, useEffect } from 'react'
import MainLayout from '../../layouts/MainLayout'
import ProfileHeader from '../../components/profile/ProfileHeader'
import ProfilePhotos from '../../components/profile/ProfilePhotos'
import ProfilePreferences from '../../components/profile/ProfilePreferences'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../hooks/useAuth'
import { profileService } from '../../services/profile.service'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState(null)
  const [photos, setPhotos] = useState([])
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profRes, photosRes, prefRes] = await Promise.all([
          profileService.getMyProfile(),
          profileService.getPhotos(),
          api.get('/users/preferences')
        ])
        setProfileData(profRes.data?.data?.profile || user)
        setPhotos(photosRes.data?.data?.photos || [])
        setPreferences(prefRes.data?.data?.preferences || {})
      } catch {
        setProfileData(user)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [user])

  const handleUploadPhoto = async (formData) => {
    try {
      await profileService.uploadPhoto(formData)
      toast.success('Photo uploaded!')
      const res = await profileService.getPhotos()
      setPhotos(res.data?.data?.photos || [])
    } catch {
      toast.error('Upload failed')
    }
  }

  const handleDeletePhoto = async (photoId) => {
    try {
      await profileService.deletePhoto(photoId)
      toast.success('Photo removed')
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleSavePreferences = async () => {
    try {
      await api.put('/users/preferences', preferences)
      toast.success('Preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-5">
          <Loader text="Loading profile..." />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container py-4" style={{ maxWidth: '800px' }}>
        <ProfileHeader user={profileData || user} />

        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
          <h5 className="fw-bold mb-2">About Me</h5>
          <p className="text-secondary small mb-3">
            {profileData?.bio || 'Add a bio to introduce yourself to matches.'}
          </p>
          {profileData?.interests && (
            <div>
              <span className="fw-semibold small text-secondary d-block mb-1">Interests</span>
              <div className="d-flex flex-wrap gap-1">
                {profileData.interests.split(',').map((interest, idx) => (
                  <span key={idx} className="badge bg-light text-dark rounded-pill px-3 py-2 small fw-normal">
                    {interest.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <ProfilePhotos
          photos={photos}
          onUpload={handleUploadPhoto}
          onDelete={handleDeletePhoto}
        />

        <ProfilePreferences
          preferences={preferences}
          onChange={(k, v) => setPreferences({ ...preferences, [k]: v })}
          onSave={handleSavePreferences}
        />
      </div>
    </MainLayout>
  )
}
