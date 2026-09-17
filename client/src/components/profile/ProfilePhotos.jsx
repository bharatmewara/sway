import React, { useRef } from 'react'

export default function ProfilePhotos({ photos = [], onUpload, onDelete }) {
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && onUpload) {
      const formData = new FormData()
      formData.append('photo', file)
      onUpload(formData)
    }
  }

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Photos & Gallery</h5>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-sm btn-outline-wine rounded-pill"
        >
          <i className="bi bi-plus-lg me-1" /> Add Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="d-none"
          onChange={handleFileSelect}
        />
      </div>

      <div className="row g-3">
        {photos.map((p) => (
          <div key={p.id} className="col-4 col-md-3">
            <div className="position-relative rounded-3 overflow-hidden shadow-sm ratio ratio-1x1 group">
              <img src={p.photo_url} alt="User upload" className="w-100 h-100 object-fit-cover" />
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1 lh-1"
                  style={{ width: 24, height: 24 }}
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <div className="col-12 py-4 text-center text-secondary small">
            No additional photos yet. Upload photos to enhance your profile!
          </div>
        )}
      </div>
    </div>
  )
}
