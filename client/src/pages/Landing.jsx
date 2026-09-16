import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';

export default function Landing() {
  return (
    <>
      <PublicNavbar />

      <section className="hero">
        <div className="container">
          <div className="col-lg-6">
            <h1>Where Privacy <br /><span>Meets Chemistry</span></h1>
            <p className="my-4">A private and AI-verified platform for married individuals seeking meaningful, discreet and secure connections.</p>
            <div className="d-flex gap-4 mb-4">
              <span><i className="bi bi-shield-check text-warning"></i> AI Verified</span>
              <span><i className="bi bi-lock text-warning"></i> 100% Private</span>
              <span><i className="bi bi-eye-slash text-warning"></i> Complete Discretion</span>
            </div>
            <Link to="/register" className="btn btn-wine me-3">Start Verification <i className="bi bi-arrow-right"></i></Link>
            <a className="btn btn-outline-light">Learn More</a>
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <div className="container">
          <div className="trust-inner row">
            <div className="col-md trust-item"><i className="bi bi-shield-check"></i><b>AI Verified<br />Members</b></div>
            <div className="col-md trust-item"><i className="bi bi-person-check"></i><b>Profile<br />Authenticated</b></div>
            <div className="col-md trust-item"><i className="bi bi-trash3"></i><b>Data Deleted<br />After Verification</b></div>
            <div className="col-md trust-item"><i className="bi bi-lock"></i><b>End-to-End<br />Privacy</b></div>
            <div className="col-md trust-item"><i className="bi bi-patch-check"></i><b>Verified Members<br />Only Platform</b></div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-4">
              <div className="title-small">More Than A Platform</div>
              <h2 className="section-title">Rediscover <span>Connection</span></h2>
              <p>SWAY provides a secure and private environment where verified members can build genuine connections with people who understand them.</p>
              <a className="btn btn-wine mt-3">Learn More About SWAY</a>
            </div>

            <div className="col-lg-8">
              <div className="row g-4">
                <div className="col-md-3">
                  <div className="feature-card">
                    <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600" alt="Feature" />
                    <div className="icon"><i className="bi bi-heart"></i></div>
                    <div className="p-3"><h6>Genuine Connections</h6><p className="small">Meet like-minded people privately.</p></div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="feature-card">
                    <img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=600" alt="Feature" />
                    <div className="icon"><i className="bi bi-chat-heart"></i></div>
                    <div className="p-3"><h6>Private Conversations</h6><p className="small">Secure messaging with verified members only.</p></div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="feature-card">
                    <img src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=600" alt="Feature" />
                    <div className="icon"><i className="bi bi-lock"></i></div>
                    <div className="p-3"><h6>Discretion</h6><p className="small">Your privacy always stays protected.</p></div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="feature-card">
                    <img src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600" alt="Feature" />
                    <div className="icon"><i className="bi bi-people"></i></div>
                    <div className="p-3"><h6>Compatibility</h6><p className="small">Smart matching for better privacy.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="verify-section">
        <div className="container">
          <div className="text-center mb-5">
            <h1 className="main-title">
              <span>The Balanced Vault:</span> Eradicating Fraud <br />
              Through Asymmetrical Verification.
            </h1>
            <p className="sub-title">
              Secure Gender Validation for Women. Full Identity Authentication for Men.
              Parallel Security for Shared Peace of Mind.
            </p>
          </div>

          <div className="row g-4 align-items-stretch">
            <div className="col-lg-6">
              <div className="security-card women-card">
                <div className="d-flex gap-4 align-items-start mb-4">
                  <div className="card-icon women-icon">
                    <i className="bi bi-person-heart"></i>
                  </div>
                  <div>
                    <h3 className="section-heading">The Veil: Women's Absolute Anonymity</h3>
                    <ul className="feature-list">
                      <li><i className="bi bi-circle-fill"></i> Zero ID Requirement</li>
                      <li><i className="bi bi-circle-fill"></i> Data Sovereign Identity Controls</li>
                      <li><i className="bi bi-circle-fill"></i> AI Gender Authenticity Check</li>
                      <li><i className="bi bi-circle-fill"></i> Guaranteed Anonymous Female Privacy</li>
                    </ul>
                  </div>
                </div>

                <div className="process-box">
                  <div className="row align-items-center g-3">
                    <div className="col-4 process-item">
                      <i className="bi bi-person-bounding-box"></i>
                      <small>SELFIE SCAN</small>
                    </div>
                    <div className="col-2 arrow">
                      <i className="bi bi-arrow-right"></i>
                    </div>
                    <div className="col-6 process-item">
                      <div className="badge-round">
                        BIOMETRIC<br />GENDER<br />MATCH
                      </div>
                    </div>
                  </div>
                  <div className="bottom-note text-center">
                    Identity remains 100% private.<br />
                    No Aadhaar/ID cards needed.
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="security-card men-card">
                <div className="d-flex gap-4 align-items-start mb-4">
                  <div className="card-icon men-icon">
                    <i className="bi bi-shield-lock"></i>
                  </div>
                  <div>
                    <h3 className="section-heading">The Shield: Men's Trusted Validation</h3>
                    <ul className="feature-list">
                      <li><i className="bi bi-circle-fill"></i> Mandatory Government-ID Mapping</li>
                      <li><i className="bi bi-circle-fill"></i> True Identity Authenticated</li>
                      <li><i className="bi bi-circle-fill"></i> Bot & Extortionist Elimination</li>
                      <li><i className="bi bi-circle-fill"></i> High-Intent Premium Community</li>
                    </ul>
                  </div>
                </div>

                <div className="process-box">
                  <div className="row align-items-center g-3">
                    <div className="col-3 process-item">
                      <i className="bi bi-person-bounding-box"></i>
                      <small>SELFIE SCAN</small>
                    </div>
                    <div className="col-1 arrow">+</div>
                    <div className="col-4 process-item">
                      <i className="bi bi-card-heading"></i>
                      <small>GOVT ID CARD</small>
                    </div>
                    <div className="col-1 arrow">
                      <i className="bi bi-arrow-right"></i>
                    </div>
                    <div className="col-3 process-item">
                      <div className="badge-round badge-round2">
                        IDENTITY<br />MATCHED
                      </div>
                    </div>
                  </div>
                  <div className="bottom-note text-center">
                    Validation complete.<br />
                    ID document instantly purged.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="center-lock">
            <i className="bi bi-lock-fill"></i>
          </div>

          <p className="text-center mt-3 text-secondary">
            Ecosystem Trust Loop: 100% Verified Biological Profiles + 100% Authenticated People.
          </p>
        </div>
      </section>

      <section id="works" className="section-pad">
        <div className="container text-center">
          <h2 className="section-title mb-5">How SWAY Works</h2>
          <div className="row g-4">
            <div className="col-md"><div className="step-box"><div className="step-no">1</div><h6>Create Profile</h6><p className="small">Sign up and create your private profile.</p></div></div>
            <div className="col-md"><div className="step-box"><div className="step-no">2</div><h6>AI Verification</h6><p className="small">Complete AI powered identity verification.</p></div></div>
            <div className="col-md"><div className="step-box"><div className="step-no">3</div><h6>Get Approved</h6><p className="small">Receive badge and access the platform.</p></div></div>
            <div className="col-md"><div className="step-box"><div className="step-no">4</div><h6>Find Connections</h6><p className="small">Discover compatible verified members.</p></div></div>
            <div className="col-md"><div className="step-box"><div className="step-no">5</div><h6>Connect Securely</h6><p className="small">Start private conversations safely.</p></div></div>
          </div>
        </div>
      </section>

      <section id="plans" className="section-pad pt-0 text-center">
        <div className="container">
          <h2 className="section-title text-center mb-5">Our Key Value</h2>
          <div className="row g-4 pt-4">
            <div className="col-md-3">
              <div className="plan-card">
                <i className="bi bi-shield-lock icon"></i>
                <h3>Security and Privacy</h3> 
                <p className="mb-1"><i className="bi bi-check-lg"></i> Verified Gender Profile </p>
                <p className="mb-1"><i className="bi bi-check-lg"></i> End to End Encrypted Chat</p>
              </div>
            </div> 
            <div className="col-md-3">
              <div className="plan-card">
                <i className="bi bi-shield-lock icon"></i>
                <h3>Absolute Authenticity</h3> 
                <p>Verified Profile<br />Secure Messaging<br />Basic Filters</p>
              </div>
            </div> 
            <div className="col-md-3">
              <div className="plan-card">
                <i className="bi bi-shield-lock icon"></i>
                <h3>Dignity & Discretion</h3> 
                <p>Verified Profile<br />Secure Messaging<br />Basic Filters</p>
              </div>
            </div> 
            <div className="col-md-3">
              <div className="plan-card">
                <i className="bi bi-shield-lock icon"></i>
                <h3>Zero Digital Footprint</h3> 
                <p>Verified Profile<br />Secure Messaging<br />Basic Filters</p>
              </div>
            </div> 
          </div>
        </div>
      </section>

      <section className="section-pad bg-purple-gradient">
        <div className="container">
          <div className="row align-items-center">
            {/* Left Column: Content & Features */}
            <div className="col-lg-6">
              <div className="mb-4">
                <h2 className="section-title text-white mb-4">
                  Take Your Parallel World Anywhere. Discreetly.
                </h2>
                <p className="lead mb-4">
                  Engineered with active mobile-stealth protocols. Download the official, secure app package directly to your device and maintain absolute control over your digital footprint.
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-5">
                <div className="d-flex align-items-center mb-3">
                  <div className="feature-icon me-3">
                    <i className="bi bi-check-lg fw-bold"></i>
                  </div>
                  <span className="fw-semibold">Protect Women’s Anonymity and Privacy</span>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <div className="feature-icon me-3">
                    <i className="bi bi-check-lg fw-bold"></i>
                  </div>
                  <span className="fw-semibold">Free for Women and 24/7 Support for Women</span>
                </div>
                <div className="d-flex align-items-center mb-4">
                  <div className="feature-icon me-3">
                    <i className="bi bi-check-lg fw-bold"></i>
                  </div>
                  <span className="fw-semibold">Change App Icon to Protect Privacy</span>
                </div>
                <div className="d-flex align-items-center mb-4">
                  <div className="feature-icon me-3">
                    <i className="bi bi-check-lg fw-bold"></i>
                  </div>
                  <span className="fw-semibold">Secure Messaging</span>
                </div>
              </div>

              {/* App Store Badges */}
              <div>
                <p className="small text-uppercase fw-bold tracking-wider mb-3">Download the App</p>
                <div className="d-flex flex-wrap gap-3">
                  <a href="#" className="app-badge">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on App Store" />
                  </a>
                  <a href="#" className="app-badge">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Mockups */}
            <div className="col-lg-5 m-auto hero-img-container text-center">
              <div className="position-relative">
                <img src="/img/app-ui.png" alt="SWAY Mobile App" className="mockup-img img-fluid mockup-img2" /> 
                <img src="/img/app-ui2.png" alt="SWAY Mobile App" className="mockup-img img-fluid" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonial">
        <div className="container">
          <h2 className="section-title text-center text-white mb-5">Testimonials</h2>
          <div className="row g-4">
            <div className="col-md-4">“The verification process gave me confidence that profiles are genuine.”<br /><b>— Verified Member</b></div>
            <div className="col-md-4">“A serious platform where privacy and security are taken seriously.”<br /><b>— Verified Member</b></div>
            <div className="col-md-4">“AI verification and data deletion gave peace of mind.”<br /><b>— Verified Member</b></div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <h2 className="section-title text-center mb-4">Frequently Asked Questions</h2>
          <div className="accordion" id="faq">
            <div className="accordion-item">
              <button className="accordion-button" data-bs-toggle="collapse" data-bs-target="#f1">How does AI verification work?</button>
              <div id="f1" className="accordion-collapse collapse show" data-bs-parent="#faq">
                <div className="accordion-body">Members complete live face verification and document matching. Verification images are deleted after approval.</div>
              </div>
            </div>
            <div className="accordion-item">
              <button className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#f2">Is my data stored after verification?</button>
              <div id="f2" className="accordion-collapse collapse" data-bs-parent="#faq">
                <div className="accordion-body">No, verification data is processed securely and removed after verification.</div>
              </div>
            </div>
            <div className="accordion-item">
              <button className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#f3">Who can see my profile?</button>
              <div id="f3" className="accordion-collapse collapse" data-bs-parent="#faq">
                <div className="accordion-body">Only approved and verified members can access member profiles.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}