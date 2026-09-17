import React, { useState, useEffect } from 'react'
import MainLayout from '../../layouts/MainLayout'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function Subscription() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/subscription/plans')
        setPlans(res.data?.data?.plans || [])
      } catch {
        setPlans([])
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const handlePurchase = (plan) => {
    toast.success(`Selected ${plan.name}. Redirecting to payment...`)
  }

  return (
    <MainLayout>
      <div className="container py-4" style={{ maxWidth: '800px' }}>
        <div className="text-center mb-5">
          <h3 className="fw-bold mb-2">Upgrade to SWAY Premium</h3>
          <p className="text-secondary">
            Unlock unlimited likes, incognito browsing, and priority messaging.
          </p>
          <div className="badge bg-wine bg-opacity-10 text-wine px-3 py-2 rounded-pill fs-6">
            Current Balance: {user?.connect_credits || 0} Connect Credits
          </div>
        </div>

        {loading ? (
          <Loader text="Loading membership plans..." />
        ) : (
          <div className="row g-4 justify-content-center">
            {plans.map((plan) => (
              <div key={plan.id} className="col-12 col-md-4">
                <div className="card h-100 border-0 rounded-4 shadow-sm p-4 text-center d-flex flex-column">
                  <h5 className="fw-bold mb-1">{plan.name}</h5>
                  <span className="text-secondary small mb-3 text-capitalize">{plan.billing_period}</span>
                  <div className="mb-4">
                    <span className="fs-2 fw-bold text-wine">&#8377;{plan.price_inr}</span>
                  </div>
                  <ul className="list-unstyled text-secondary small text-start mb-4 flex-grow-1">
                    <li className="mb-2"><i className="bi bi-check2 text-success me-2" /> Unlimited Swipes</li>
                    <li className="mb-2"><i className="bi bi-check2 text-success me-2" /> See Who Liked You</li>
                    <li className="mb-2"><i className="bi bi-check2 text-success me-2" /> Advanced Filters</li>
                    <li><i className="bi bi-check2 text-success me-2" /> Incognito Browsing</li>
                  </ul>
                  <Button
                    variant="wine"
                    onClick={() => handlePurchase(plan)}
                    className="w-100 rounded-pill"
                  >
                    Select Plan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
