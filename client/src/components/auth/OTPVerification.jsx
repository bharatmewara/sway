import React, { useState, useRef } from 'react'
import Button from '../common/Button'

export default function OTPVerification({ onVerify, onResend, loading = false }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onVerify(digits.join(''))
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 rounded-4 shadow-sm border-0 text-center">
      <div className="mb-3">
        <i className="bi bi-shield-check fs-1 text-wine" />
      </div>
      <h4 className="fw-bold mb-1">Verify Your Account</h4>
      <p className="text-secondary small mb-4">
        Enter the 6-digit verification code sent to your email or phone
      </p>

      <div className="d-flex justify-content-center gap-2 mb-4">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="form-control text-center fw-bold fs-4 rounded-3 border-2"
            style={{ width: '48px', height: '56px' }}
          />
        ))}
      </div>

      <Button
        type="submit"
        variant="wine"
        loading={loading}
        disabled={digits.some((d) => !d)}
        className="w-100 py-2 mb-3"
      >
        Verify OTP
      </Button>

      <div className="small text-secondary">
        Didn't receive code?{' '}
        <button
          type="button"
          onClick={onResend}
          className="btn btn-link p-0 text-decoration-none text-wine fw-semibold small"
        >
          Resend OTP
        </button>
      </div>
    </form>
  )
}
