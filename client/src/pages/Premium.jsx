import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PLAN_COLORS = {
  monthly: { bg: '#f8f9fa', accent: '#76000b', badge: 'Standard' },
  quarterly: { bg: 'linear-gradient(135deg, #fff8ef, #ffecd2)', accent: '#d8a83f', badge: 'Best Value' },
  yearly: { bg: 'linear-gradient(135deg, #1a0000, #76000b)', accent: '#d8a83f', badge: 'Premium', dark: true },
};

const PREMIUM_FEATURES = [
  { icon: '❤️', text: 'Unlimited Likes' },
  { icon: '💬', text: 'Unlimited Messages' },
  { icon: '👁️', text: 'See Who Liked You' },
  { icon: '🎭', text: 'Incognito Browsing' },
  { icon: '📖', text: 'Read Receipts' },
  { icon: '🎯', text: 'Advanced Filters' },
  { icon: '📊', text: 'AI Compatibility Reports' },
  { icon: '📞', text: 'Unlimited Voice/Video Calls' },
  { icon: '⚡', text: 'Priority Profile Placement' },
  { icon: '🌍', text: 'Travel Mode' },
];

export default function Premium() {
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/premium/plans').then(r => setPlans(r.data.plans)).catch(() => {});
    api.get('/premium/status').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const subscribe = async (plan) => {
    setLoading(true);
    try {
      const { data } = await api.post('/premium/create-order', { plan_id: plan.id });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_dummy',
        amount: data.amount,
        currency: 'INR',
        name: 'SWAY Gold',
        description: plan.name,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            await api.post('/premium/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              plan_id: plan.id,
            });
            toast.success('🎉 Welcome to SWAY Gold!');
            updateUser({ ...user, is_premium: true });
            api.get('/premium/status').then(r => setStatus(r.data));
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { email: user?.email },
        theme: { color: '#76000b' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      toast.error('Could not initiate payment');
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="text-center mb-5">
        <div style={{ fontSize: 48 }}>👑</div>
        <h2 className="fw-bold mt-2">Upgrade to SWAY Gold</h2>
        <p className="text-muted">Unlock premium features and find your perfect match faster</p>

        {status?.is_premium && (
          <div className="alert alert-success d-inline-block rounded-pill px-4">
            ✅ You're a Premium Member! Expires: {new Date(status.expires_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="row g-3 mb-5">
        {PREMIUM_FEATURES.map((f, i) => (
          <div key={i} className="col-6 col-md-3">
            <motion.div
              className="card border-0 shadow-sm rounded-4 p-3 text-center h-100"
              whileHover={{ y: -3 }}
            >
              <div style={{ fontSize: 28 }}>{f.icon}</div>
              <p className="mb-0 mt-2 small fw-semibold">{f.text}</p>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Plans */}
      <h4 className="fw-bold text-center mb-4">Choose Your Plan</h4>
      <div className="row g-4 justify-content-center">
        {plans.map((plan) => {
          const colors = PLAN_COLORS[plan.billing_period] || PLAN_COLORS.monthly;
          return (
            <div key={plan.id} className="col-md-4">
              <motion.div
                className="card border-0 shadow rounded-4 overflow-hidden h-100"
                style={{ background: colors.bg }}
                whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(118,0,11,0.2)' }}
              >
                {colors.badge && (
                  <div className="text-center py-2" style={{ background: colors.accent, color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    {colors.badge}
                  </div>
                )}
                <div className="p-4">
                  <h5 className={`fw-bold mb-1 ${colors.dark ? 'text-white' : ''}`}>{plan.name}</h5>
                  <p className={`text-capitalize mb-3 ${colors.dark ? 'text-white opacity-75' : 'text-muted'}`} style={{ fontSize: 13 }}>
                    {plan.billing_period} billing
                  </p>
                  <h2 className={`fw-bold mb-1 ${colors.dark ? 'text-white' : ''}`} style={{ color: colors.dark ? undefined : colors.accent }}>
                    ₹{plan.price_inr}
                  </h2>
                  <p className={`${colors.dark ? 'text-white opacity-50' : 'text-muted'} small mb-4`}>
                    {plan.billing_period === 'monthly' ? 'per month' : plan.billing_period === 'quarterly' ? 'per 3 months' : 'per year'}
                  </p>

                  {/* Features from plan */}
                  <ul className="list-unstyled mb-4">
                    {plan.features && Object.entries(plan.features).filter(([, v]) => v).map(([k]) => (
                      <li key={k} className={`d-flex align-items-center gap-2 mb-2 ${colors.dark ? 'text-white opacity-75' : 'text-muted'}`} style={{ fontSize: 13 }}>
                        <i className="bi bi-check-circle-fill" style={{ color: colors.accent }}></i>
                        {k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </li>
                    ))}
                  </ul>

                  <button
                    className="btn w-100 rounded-pill fw-bold"
                    style={{
                      background: colors.dark ? '#d8a83f' : colors.accent,
                      color: '#fff', border: 'none'
                    }}
                    onClick={() => subscribe(plan)}
                    disabled={loading || status?.is_premium}
                  >
                    {status?.is_premium ? 'Current Plan' : 'Get Started'}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
