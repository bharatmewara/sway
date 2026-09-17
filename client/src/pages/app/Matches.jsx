import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import MatchList from '../../components/matches/MatchList'
import MatchProfile from '../../components/matches/MatchProfile'
import Loader from '../../components/common/Loader'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function Matches() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)

  const fetchMatches = async () => {
    try {
      const res = await api.get('/matches')
      setMatches(res.data?.data?.matches || [])
    } catch {
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  const handleStartChat = (match) => {
    navigate(`/chat/${match.id}`)
  }

  const handleUnmatch = async (match) => {
    try {
      await api.delete(`/matches/${match.id}`)
      toast.success(`Unmatched with ${match.username}`)
      setMatches((prev) => prev.filter((m) => m.id !== match.id))
      setSelectedMatch(null)
    } catch {
      toast.error('Failed to unmatch')
    }
  }

  return (
    <MainLayout>
      <div className="container py-4">
        <h4 className="fw-bold mb-3">Your Matches</h4>
        {loading ? (
          <Loader text="Loading matches..." />
        ) : (
          <MatchList
            matches={matches}
            onSelectMatch={(m) => setSelectedMatch(m)}
            onChat={handleStartChat}
          />
        )}

        <MatchProfile
          match={selectedMatch}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onStartChat={handleStartChat}
          onUnmatch={handleUnmatch}
        />
      </div>
    </MainLayout>
  )
}
