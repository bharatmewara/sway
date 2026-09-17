import React, { useState } from 'react'
import { motion } from 'framer-motion'
import DiscoverCard from './DiscoverCard'

const SWIPE_THRESHOLD = 100

export default function SwipeCard({ profile, onLike, onPass, active = true }) {
  const [dragX, setDragX] = useState(0)

  if (!profile) return null

  const isLiking = dragX > 40
  const isPassing = dragX < -40

  return (
    <motion.div
      className={`position-absolute w-100 h-100 ${active ? '' : 'd-none'}`}
      style={{ cursor: active ? 'grab' : 'default', touchAction: 'none' }}
      drag={active ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDrag={(e, info) => setDragX(info.offset.x)}
      onDragEnd={(e, info) => {
        setDragX(0)
        if (info.offset.x > SWIPE_THRESHOLD) onLike?.()
        else if (info.offset.x < -SWIPE_THRESHOLD) onPass?.()
      }}
      animate={{ x: 0, rotate: 0 }}
      whileDrag={{ rotate: dragX * 0.04 }}
    >
      <div className="w-100 h-100 position-relative">
        <DiscoverCard profile={profile} />

        {/* Dynamic LIKE badge */}
        {isLiking && (
          <div
            className="position-absolute top-0 start-0 m-4 px-3 py-1 rounded-3 border border-success border-3 text-success fw-bold fs-4"
            style={{
              transform: 'rotate(-15deg)',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              zIndex: 10
            }}
          >
            LIKE
          </div>
        )}

        {/* Dynamic PASS badge */}
        {isPassing && (
          <div
            className="position-absolute top-0 end-0 m-4 px-3 py-1 rounded-3 border border-danger border-3 text-danger fw-bold fs-4"
            style={{
              transform: 'rotate(15deg)',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              zIndex: 10
            }}
          >
            PASS
          </div>
        )}
      </div>
    </motion.div>
  )
}
