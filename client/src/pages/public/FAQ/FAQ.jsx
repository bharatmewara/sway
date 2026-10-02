import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '../../../components/PublicNavbar'
import Footer from '../../../components/Footer'
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../../../data/faqData'
import './FAQ.css'

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openIndices, setOpenIndices] = useState(new Set([0])) // First question open by default

  const filteredItems = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const query = searchQuery.toLowerCase().trim()
      const matchesQuery = !query || item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
      return matchesCategory && matchesQuery
    })
  }, [activeCategory, searchQuery])

  const toggleAccordion = (index) => {
    setOpenIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="faq-page">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="faq-hero text-center">
        <div className="container">
          <span className="badge-wine mb-3">Help &amp; Knowledge Base</span>
          <h1 className="faq-title">
            Frequently Asked <span>Questions</span>
          </h1>
          <p className="faq-subtitle">
            Find immediate answers regarding verification, privacy controls, Connect costs, messaging rules, and member safety.
          </p>

          {/* Search Box */}
          <div className="faq-search-box mx-auto mt-4">
            <i className="bi bi-search search-icon" />
            <input
              type="text"
              className="form-control faq-search-input"
              placeholder="Search by keyword (e.g. verification, privacy, connects)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search frequently asked questions"
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <i className="bi bi-x-circle-fill" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="faq-content py-5">
        <div className="container">
          {/* Category Tabs */}
          <div className="category-scroll-container mb-4">
            <div className="category-pills">
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion Container */}
          <div className="faq-accordion-wrapper mx-auto">
            {filteredItems.length === 0 ? (
              <div className="empty-faq-state text-center py-5">
                <i className="bi bi-question-circle text-muted fs-1 mb-3 d-block" />
                <h5>No questions matched your search</h5>
                <p className="text-secondary small">Try searching with a different keyword or select "All Questions".</p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger mt-2"
                  onClick={() => { setActiveCategory('all'); setSearchQuery('') }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="faq-accordion-list">
                {filteredItems.map((item, idx) => {
                  const isOpen = openIndices.has(idx)
                  return (
                    <div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="faq-question-btn"
                        onClick={() => toggleAccordion(idx)}
                        aria-expanded={isOpen}
                      >
                        <span className="faq-question-text">{item.q}</span>
                        <span className="faq-toggle-icon">
                          <i className={`bi ${isOpen ? 'bi-dash-lg' : 'bi-plus-lg'}`} />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="faq-answer-body">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Support Banner */}
          <div className="faq-support-box mt-5 mx-auto text-center p-4 p-md-5 rounded-4">
            <i className="bi bi-chat-heart-fill fs-1 text-wine mb-2 d-block" />
            <h4 className="fw-bold mb-2">Still Have Questions?</h4>
            <p className="text-secondary max-w-600 mx-auto mb-4">
              Our community support team is dedicated to safeguarding member confidentiality and ensuring your platform experience is seamless.
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <a href="mailto:support@swaydating.com" className="btn btn-wine">
                <i className="bi bi-envelope-fill me-2" /> Contact Support
              </a>
              <Link to="/about" className="btn btn-outline-secondary">
                Learn More About SWAY
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
