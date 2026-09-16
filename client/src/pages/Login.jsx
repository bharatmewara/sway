import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { identifier: username, password });
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      if (res.data.user.verification_status === 'verified') {
        navigate('/home');
      } else {
        navigate('/verify');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        toast.error(err.response.data.errors[0].msg);
      } else {
        toast.error(err.response?.data?.error || err.response?.data?.message || 'Login failed');
      }
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg fixed-top">
        <div className="container">
          <Link className="navbar-brand logo" to="/"> <img src="/img/logo.png" alt="logo"/></Link>
          
          <div className="collapse navbar-collapse" id="menu">
            <div className="d-flex gap-3 align-items-center ms-auto">
              <Link className="btn btn-outline-light" to="/register">Register</Link>
              <Link className="btn btn-wine" to="/login">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="login_page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card register-card"> 
                <div className="p-4 p-md-5">
                  <h3 className="fw-bold mb-1">Login Now</h3>
                  <p className="text-muted mb-4">Please fill your details below.</p>

                  <form onSubmit={handleSubmit}> 
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label">Username</label>
                        <input type="text" className="form-control" placeholder="Enter Username" value={username} onChange={e => setUsername(e.target.value)} required />
                      </div>            

                      <div className="col-md-12">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-control" placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} required />
                      </div> 
                      
                      <div className="col-12">
                        <button type="submit" className="btn btn-wine btn-main w-100">
                         login
                        </button>
                      </div>

                      <div className="col-12 text-center">
                        <p className="mb-0 text-muted"> 
                          <Link to="/forgot-password" className="text-decoration-none fw-semibold">Forgot Password</Link>
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
              </div> 
            </div>
          </div>
        </div>
      </section>
      
      <footer id="contact">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="logo mb-3"> <img src="/img/logo.png" alt="logo"/></div>
              <p>Verified people. Private conversations. Real discretion.</p>
            </div>
            <div className="col-md-2"><h6>Quick Links</h6><p>Home<br/>Verification<br/>Membership</p></div>
            <div className="col-md-3"><h6>Support</h6><p>Terms & Conditions<br/>Privacy Policy<br/>Help Center</p></div>
            <div className="col-md-3">
              <h6>Social Media</h6>
              <div className="social_media">
                 <a href="#"><i className="bi bi-facebook"></i></a>
                 <a href="#"><i className="bi bi-instagram"></i></a>
                 <a href="#"><i className="bi bi-twitter-x"></i></a> 
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}