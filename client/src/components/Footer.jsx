import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="contact">
      <div className="container mb-3">
        <div className="row g-4">
          <div className="col-md-4">
            <div className="logo mb-3">
              <img src="/img/logo.png" alt="SWAY Logo" style={{ height: 55 }} />
            </div>
            <p>Verified people. Private conversations. Real discretion.</p>
          </div>
          <div className="col-md-3">
            <h4 className="mb-3">Quick Links</h4>
            <ul className="footer_manu p-0 m-0">
              <li><Link to="/">Home</Link></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
          <div className="col-md-3">
            <h4 className="mb-3">Support</h4>
            <ul className="footer_manu p-0 m-0">
              <li><a href="#">Terms &amp; Conditions</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div className="col-md-2">
            <h4 className="mb-3">Social Media</h4>
            <div className="social_media">
              <a href="#"><i className="bi bi-facebook"></i></a>
              <a href="#"><i className="bi bi-instagram"></i></a>
              <a href="#"><i className="bi bi-twitter-x"></i></a>
            </div>
          </div>
        </div>
      </div>
      <hr />
      <div className="text-center mt-4">
        &copy; Copyright 2026. All Rights Reserved, Develop By AiMindBlock
      </div>
    </footer>
  )
}
