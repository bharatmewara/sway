import React from 'react'

export default function Button({
  children,
  type = 'button',
  variant = 'wine',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  icon = null,
  ...props
}) {
  const baseClass = 'btn d-inline-flex align-items-center justify-content-center gap-2 fw-medium'
  const variantClass = variant === 'wine' ? 'btn-wine' : `btn-${variant}`
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      ) : (
        icon && <span className="btn-icon">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  )
}
