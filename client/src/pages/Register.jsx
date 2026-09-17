import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';

export default function Register() {
  const [formData, setFormData] = useState({ 
    gender: 'female', 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    dob: '', 
    city: '', 
    state: '', 
    country: '' 
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.gender) return toast.error('Please select your gender');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    if (!acceptedTerms) return toast.error('You must accept the terms and conditions');
    if (!acceptedPrivacy) return toast.error('You must accept the privacy policy');

    try {
      const res = await api.post('/auth/register', formData);
      localStorage.setItem('sway_token', res.data.token);
      localStorage.setItem('sway_user', JSON.stringify(res.data.user));
      window.location.href = '/home';
    } catch (err) {
      if (err.response?.data?.errors) {
        toast.error(err.response.data.errors[0].msg);
      } else {
        toast.error(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
      }
    }
  };

  return (
    <>
      <PublicNavbar />
      <section className="login_page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card register-card"> 
                <div className="p-4 p-md-5">
                  <h3 className="fw-bold mb-1">Register Now</h3>
                  <p className="text-muted mb-4">Please fill your details below.</p>

                  <form onSubmit={handleSubmit}>
                    <div className="gender-select mb-5">
                      <label className={`gender-card ${formData.gender === 'female' ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="gender" 
                          value="female" 
                          checked={formData.gender === 'female'} 
                          onChange={() => setFormData({...formData, gender: 'female'})} 
                          style={{display: 'none'}} 
                        />
                        <span className="title girl">Female</span>
                        <img src="/img/girl.png" alt="Girl" />
                      </label>

                      <label className={`gender-card ${formData.gender === 'male' ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="gender" 
                          value="male" 
                          checked={formData.gender === 'male'} 
                          onChange={() => setFormData({...formData, gender: 'male'})} 
                          style={{display: 'none'}} 
                        />
                        <span className="title boy">Male</span>
                        <img src="/img/boy.png" alt="Boy" />
                      </label>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Username</label>
                        <input type="text" className="form-control" placeholder="Enter Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-control" placeholder="Enter email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                      </div>                  

                      <div className="col-md-6">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-control" placeholder="Create password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Confirm Password</label>
                        <input type="password" className="form-control" placeholder="Confirm password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">Country</label>
                        <input type="text" className="form-control" placeholder="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} required />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">State</label>
                        <input type="text" className="form-control" placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required />
                      </div> 

                      <div className="col-md-4">
                        <label className="form-label">City</label>
                        <input type="text" className="form-control" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                      </div> 

                      <div className="col-md-12">
                        <label className="form-label">Date of birth</label>
                        <input type="date" className="form-control" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} required />
                      </div> 

                      <div className="col-md-6">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="terms" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                          <label className="form-check-label" htmlFor="terms">
                           I have read and accept the terms & conditions
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="privacy" checked={acceptedPrivacy} onChange={e => setAcceptedPrivacy(e.target.checked)} />
                          <label className="form-check-label" htmlFor="privacy">
                           I have read and accept the privacy policy
                          </label>
                        </div>
                      </div>

                      <div className="col-12 mt-4">
                        <button type="submit" className="btn btn-wine btn-main w-100">
                          Create Account
                        </button>
                      </div>

                      <div className="col-12 text-center mt-3">
                        <p className="mb-0 text-muted">
                          Already have an account?{' '}
                          <Link to="/login" className="text-decoration-none fw-semibold">Login</Link>
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
      <Footer />
    </>
  );
}