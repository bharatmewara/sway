import React, { useState } from 'react'
import MatchCard from './MatchCard'

export default function MatchList({ matches = [], onSelectMatch, onChat }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = matches.filter((m) =>
    (m.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text bg-light border-0">
            <i className="bi bi-search text-secondary" />
          </span>
          <input
            type="text"
            className="form-control bg-light border-0"
            placeholder="Search matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-heartbreak text-secondary fs-1 mb-2 d-block" />
          <h5 className="fw-semibold">No matches found</h5>
          <p className="text-secondary small">
            Keep exploring the Discovery feed to find new connections!
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((match) => (
            <div key={match.id || match.match_id} className="col-6 col-md-4 col-lg-3">
              <MatchCard
                match={match}
                onClick={() => onSelectMatch?.(match)}
                onChat={onChat}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
