import { Link } from 'react-router-dom'

export default function PublicNavbar() {
  return (
    <nav className="navbar navbar-expand-lg fixed-top">
      <div className="container">
        <Link className="navbar-brand logo" to="/">
          <img src="/img/logo.png" alt="SWAY Logo" />
        </Link>
        <div className="collapse navbar-collapse" id="navMenu">
          <div className="d-flex gap-3 align-items-center ms-auto">
            <Link className="btn btn-outline-light" to="/register">
              Register
            </Link>
            <Link className="btn btn-wine" to="/login">
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
