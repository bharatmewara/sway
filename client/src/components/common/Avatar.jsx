import React, { useState } from 'react'

export default function Avatar({
  src,
  alt = 'User',
  size = 48,
  isOnline = false,
  hasStory = false,
  className = '',
  gender = 'male'
}) {
  const fallback = gender === 'female' ? '/img/girl.png' : '/img/boy.png'
  const [imgSrc, setImgSrc] = useState(src || fallback)

  return (
    <div
      className={`position-relative d-inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className={`w-100 h-100 rounded-circle overflow-hidden ${
          hasStory ? 'p-1 border border-danger border-2' : ''
        }`}
      >
        <img
          src={imgSrc}
          alt={alt}
          onError={() => setImgSrc(fallback)}
          className="w-100 h-100 rounded-circle"
          style={{ objectFit: 'cover' }}
        />
      </div>
      {isOnline && (
        <span
          className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
          style={{
            width: Math.max(10, Math.floor(size * 0.25)),
            height: Math.max(10, Math.floor(size * 0.25))
          }}
        />
      )}
    </div>
  )
}
