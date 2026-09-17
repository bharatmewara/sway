import React from 'react'

export default function Loader({ fullScreen = false, size = 'md', text = 'Loading...' }) {
  const sizePixels = size === 'sm' ? 24 : size === 'lg' ? 48 : 36

  const spinner = (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3">
      <div
        className="spinner-border spinner-border-wine"
        role="status"
        style={{ width: sizePixels, height: sizePixels }}
      >
        <span className="visually-hidden">{text}</span>
      </div>
      {text && <div className="text-secondary small fw-medium">{text}</div>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="spinner-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 z-3">
        {spinner}
      </div>
    )
  }

  return <div className="py-4 text-center">{spinner}</div>
}
