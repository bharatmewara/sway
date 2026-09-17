import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState(['Travel', 'Coffee', 'Fitness'])

  const availableTags = ['Travel', 'Coffee', 'Fitness', 'Music', 'Reading', 'Foodie', 'Art', 'Tech', 'Yoga']

  const toggleTag = (tag) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((t) => t !== tag))
    } else {
      setInterests([...interests, tag])
    }
  }

  const handleFinish = async () => {
    try {
      await api.put('/profile/me', {
        bio,
        interests: interests.join(', ')
      })
    } catch {}
    toast.success('Profile complete!')
    navigate('/home')
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <div className="card border-0 rounded-4 shadow p-4" style={{ maxWidth: '440px', width: '100%' }}>
        <h4 className="fw-bold text-center mb-1">Finish Your Profile</h4>
        <p className="text-secondary small text-center mb-4">Step 3 of 3: Add your bio and interests</p>

        <div className="mb-4">
          <label className="form-label small text-secondary fw-semibold">Bio</label>
          <textarea
            rows="3"
            className="form-control rounded-3"
            placeholder="Share what makes you unique..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label small text-secondary fw-semibold">Interests</label>
          <div className="d-flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`btn btn-sm rounded-pill ${
                  interests.includes(tag) ? 'btn-wine' : 'btn-light border'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleFinish} variant="wine" className="w-100 py-2 rounded-pill">
          Complete Profile &rarr;
        </Button>
      </div>
    </div>
  )
}
