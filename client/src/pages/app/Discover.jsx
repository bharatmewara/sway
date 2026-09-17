import React, { useState, useEffect } from 'react'
import MainLayout from '../../layouts/MainLayout'
import SwipeCard from '../../components/discovery/SwipeCard'
import MatchActions from '../../components/discovery/MatchActions'
import FilterPanel from '../../components/discovery/FilterPanel'
import Loader from '../../components/common/Loader'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function Discover() {
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ interested_in: 'both', distance: 50 })

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await api.get('/discovery/feed?limit=25')
      setQueue(res.data?.data?.profiles || [])
      setCurrentIndex(0)
    } catch {
      setQueue([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  const handleSwipe = async (type) => {
    if (currentIndex >= queue.length) return
    const currentProfile = queue[currentIndex]
    setCurrentIndex((prev) => prev + 1)

    try {
      const res = await api.post('/discovery/swipe', {
        target_user_id: currentProfile.id,
        type
      })
      if (res.data?.data?.matched) {
        toast.success(`It's a Match with ${currentProfile.username}! 🎉`)
      }
    } catch {
      // Swipe failure handling
    }
  }

  const currentProfile = queue[currentIndex]

  return (
    <MainLayout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">Discover</h4>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline-secondary btn-sm rounded-pill px-3"
          >
            <i className="bi bi-sliders me-1" /> Filters
          </button>
        </div>

        <FilterPanel
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFilterChange={(k, v) => setFilters({ ...filters, [k]: v })}
        />

        {loading ? (
          <Loader text="Finding amazing people..." />
        ) : !currentProfile ? (
          <div className="card border-0 rounded-4 shadow-sm p-5 text-center my-5">
            <i className="bi bi-stars fs-1 text-wine mb-2" />
            <h4 className="fw-bold">You've reached the end!</h4>
            <p className="text-secondary small mb-4">
              Check back soon for new profiles in your area, or adjust your distance filters.
            </p>
            <button
              type="button"
              onClick={fetchQueue}
              className="btn btn-wine rounded-pill px-4 align-self-center"
            >
              Refresh Feed
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column align-items-center">
            <div
              className="position-relative w-100"
              style={{ maxWidth: '420px', height: '540px' }}
            >
              <SwipeCard
                key={currentProfile.id}
                profile={currentProfile}
                onLike={() => handleSwipe('like')}
                onPass={() => handleSwipe('pass')}
                active
              />
            </div>
            <div className="mt-3" style={{ width: '420px' }}>
              <MatchActions
                onPass={() => handleSwipe('pass')}
                onLike={() => handleSwipe('like')}
                onSuperLike={() => handleSwipe('super_like')}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
