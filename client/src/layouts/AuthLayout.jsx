import React from 'react'

export default function AuthLayout({ children }) {
  return (
    <div className="login_page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-7">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
