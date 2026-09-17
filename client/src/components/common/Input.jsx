import React, { useState } from 'react'

export default function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  icon,
  required = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const computedType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label fw-semibold text-secondary small">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="input-group">
        {icon && <span className="input-group-text bg-light border-end-0">{icon}</span>}
        <input
          id={name}
          name={name}
          type={computedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`form-control ${icon ? 'border-start-0' : ''} ${error ? 'is-invalid' : ''}`}
          required={required}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="btn btn-outline-secondary border-start-0"
            onClick={() => setShowPassword(!showPassword)}
          >
            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
          </button>
        )}
        {error && <div className="invalid-feedback d-block">{error}</div>}
      </div>
    </div>
  )
}
