import React from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '../../../components/PublicNavbar'
import Footer from '../../../components/Footer'
import '../PrivacyPolicy/PrivacyPolicy.css'
import './Terms.css'

export default function Terms() {
  return (
    <div className="legal-page">
      <PublicNavbar />

      {/* Header */}
      <section className="legal-hero text-center">
        <div className="container">
          <span className="badge-wine mb-3">Community Rules &amp; Governance</span>
          <h1 className="legal-title">Terms &amp; Conditions</h1>
          <p className="legal-subtitle">
            Version 1.0 &bull; Effective Date: October 2026
          </p>
        </div>
      </section>

      {/* Document Body */}
      <section className="legal-content py-5">
        <div className="container">
          <div className="legal-paper mx-auto p-4 p-md-5 bg-white rounded-4 shadow-sm border">
            
            <div className="legal-section">
              <h3>1. Agreement to Terms</h3>
              <p>
                These Terms and Conditions ("Terms") constitute a legally binding agreement between you ("User", "Member", or "you") and <strong>SWAY</strong> ("we", "us", or "our"), governing your access to and use of the SWAY website (<code>swaydating.com</code>), APIs, and associated online services.
              </p>
              <p>
                By creating an account, clicking "I agree", or accessing any portion of SWAY, you confirm that you have read, understood, and agreed to be bound by these Terms and our accompanying <Link to="/privacy-policy" className="text-wine">Privacy Policy</Link>. If you do not agree to these Terms in their entirety, you must not register or use the platform.
              </p>
            </div>

            <div className="legal-section">
              <h3>2. Eligibility &amp; Account Requirements</h3>
              <ul>
                <li><strong>Age Restriction:</strong> You must be at least eighteen (18) years of age (or the age of legal majority in your jurisdiction) to create an account or access SWAY. Any access by minors is strictly prohibited.</li>
                <li><strong>Individual Natural Persons:</strong> Accounts must be created by individual human beings for personal use. Corporate accounts, commercial agencies, automated scripts, bots, and group accounts are prohibited.</li>
                <li><strong>Single Account Policy:</strong> Each member is permitted to maintain only one active account. Creating duplicate, alternate, or burner profiles to circumvent suspensions or blocks will result in permanent termination across all associated devices and IP addresses.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>3. Mandatory Biometric Verification &amp; True Identity</h3>
              <p>
                To eradicate malicious fraud and ensure total authenticity across our ecosystem:
              </p>
              <ul>
                <li>Every member must complete mandatory real-time Live Camera AI Selfie Verification to validate facial presence and biological gender alignment.</li>
                <li>You agree not to attempt spoofing, deepfaking, video injection, mask usage, or presenting static gallery images to bypass our verification systems.</li>
                <li>SWAY does not require or collect Aadhaar or government identity cards, prioritizing your privacy while authenticating genuine biological presence.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>4. Community Standards &amp; Prohibited Conduct</h3>
              <p>
                You agree to treat all members with courtesy, dignity, and mutual respect. The following activities are strictly prohibited and constitute grounds for immediate account banning without notice or refund:
              </p>
              <ul>
                <li><strong>Harassment &amp; Abuse:</strong> Stalking, bullying, intimidating, defaming, sending unsolicited sexually explicit imagery, hate speech, or making non-consensual demands.</li>
                <li><strong>Commercial &amp; Financial Exploitation:</strong> Soliciting money, promoting escorts, prostitution, commercial adult services, affiliate marketing, multi-level marketing (MLM), or selling third-party goods.</li>
                <li><strong>Extortion &amp; Blackmail:</strong> Threatening to expose private conversations, photos, personal identities, or marital statuses of any member. We maintain a zero-tolerance policy and cooperate with law enforcement on extortion matters.</li>
                <li><strong>Unauthorized Dissemination:</strong> Screenshotting, recording, downloading, or publishing private messages, private photos, or personal handles outside the platform.</li>
                <li><strong>System Abuse:</strong> Reverse-engineering, scraping, automated API calling, injecting viruses, or attempting unauthorized database intrusions.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>5. Communication Architecture &amp; Connect Economics</h3>
              <p>
                To maintain high-intent interactions and protect our community from spam:
              </p>
              <ul>
                <li><strong>Female Exemption:</strong> Verified female members enjoy complimentary access to start, read, and respond to all Chats and Private Messages.</li>
                <li><strong>Male Connect Model:</strong> Male members utilize platform "Connects" to initiate new Chat sessions, send Private Messages, unlock approved photo requests, or send Crushes.</li>
                <li><strong>Session Boundaries:</strong> Chat sessions are time-limited interactions designed for active engagement. Private Messages remain active for up to 72 hours in your inbox.</li>
                <li><strong>Connect Nature:</strong> Connects represent a limited, non-transferable, revocable license to utilize specific interactive features on SWAY. Connects hold zero monetary value outside the platform, do not accrue interest, and cannot be redeemed for fiat currency.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>6. Purchases, Billing &amp; Refund Policy</h3>
              <ul>
                <li><strong>Secure Billing:</strong> All Connect pack purchases are securely processed through our authorized payment partner, Razorpay. By initiating a purchase, you authorize Razorpay to charge your selected payment method.</li>
                <li><strong>No Automatic Recurring Subscriptions:</strong> SWAY does not automatically charge recurring monthly subscription fees. Connects are acquired strictly through pay-as-you-go packages.</li>
                <li><strong>Refund Policy:</strong> Because digital Connect credits are provisioned and made immediately available upon payment confirmation, all purchases are generally final and non-refundable. However, if a verified technical defect prevents credits from being credited to your account, our support team will promptly investigate and credit the missing balance or issue a refund upon review.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>7. Private Photo Requests &amp; Social Permissions</h3>
              <ul>
                <li>Private album photos remain locked until the owner explicitly approves a formal Private Photo Request.</li>
                <li>Granting permission to view private photos or social links does not transfer ownership or authorize the recipient to download, screenshot, or share that media.</li>
                <li>The photo owner retains the right to revoke permission or block the recipient at any time.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>8. User-Generated Content &amp; Intellectual Property</h3>
              <ul>
                <li>You retain ownership of any profile text, photos, or media that you publish on SWAY.</li>
                <li>By uploading content, you grant SWAY a limited, non-exclusive, royalty-free, worldwide license solely to host, display, resize, and transmit your content as necessary to operate the platform features.</li>
                <li>You represent and warrant that you own or have obtained all necessary rights to any content you submit, and that your content does not infringe upon third-party rights or violate applicable laws.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>9. Account Termination &amp; Suspension</h3>
              <p>
                We reserve the unilateral right to suspend, restrict, or permanently terminate your account and revoke your access to SWAY at our sole discretion, without liability, if we determine that you have violated these Terms, compromised member safety, or engaged in fraudulent conduct. You may terminate your account at any time by selecting the account deletion option in your profile settings.
              </p>
            </div>

            <div className="legal-section">
              <h3>10. Disclaimers &amp; Limitation of Liability</h3>
              <p>
                <strong>"AS IS" BASIS:</strong> SWAY IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE PLATFORM WILL OPERATE UNINTERRUPTED OR ERROR-FREE, NOR DO WE GUARANTEE SPECIFIC RELATIONSHIP OUTCOMES.
              </p>
              <p>
                <strong>MEMBER INTERACTIONS:</strong> YOU ARE SOLELY RESPONSIBLE FOR YOUR INTERACTIONS WITH OTHER MEMBERS. SWAY DOES NOT CONDUCT CRIMINAL BACKGROUND CHECKS. ALWAYS EXERCISE CAUTION, COMMON SENSE, AND DISCRETION WHEN COMMUNICATING WITH OR MEETING ANY INDIVIDUAL.
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SWAY AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </div>

            <div className="legal-section">
              <h3>11. Amendments &amp; Version History</h3>
              <p>
                We may revise these Terms from time to time. Material updates will be reflected by the Version Number at the top of this document and communicated to active members. Your continued participation on SWAY after the effective date constitutes your binding consent to the revised Terms.
              </p>
            </div>

            <div className="legal-section mb-0">
              <h3>12. Grievances &amp; Contact Information</h3>
              <p>
                For questions, concerns, or formal grievance notifications concerning these Terms, please contact our administrative team:
              </p>
              <div className="contact-card p-3 rounded-3 bg-light border">
                <strong>SWAY Grievance &amp; Compliance Office</strong><br />
                Email: <a href="mailto:legal@swaydating.com" className="text-wine">legal@swaydating.com</a><br />
                General Support: <a href="mailto:support@swaydating.com" className="text-wine">support@swaydating.com</a><br />
                Website: <a href="https://swaydating.com" className="text-wine">https://swaydating.com</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
