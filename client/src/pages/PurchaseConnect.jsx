import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function PurchaseConnect() {
  const [plans, setPlans] = useState([]);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/payments/plans');
        setPlans(res.data);
      } catch(e) {}
    };
    fetchPlans();
  }, []);

  const buy = async (plan) => {
    try {
      const { data } = await api.post('/payments/create-order', { pack_name: plan.name, amount_inr: plan.price_inr });
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_dummy',
        amount: data.amount,
        currency: 'INR',
        name: 'SWAY Dating',
        description: `Purchase ${plan.name}`,
        order_id: data.orderId,
        handler: async function (response) {
          try {
            await api.post('/payments/verify', {
              orderCreationId: data.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Credits added successfully!');
            updateUser({ ...user, connect_credits: user.connect_credits + plan.credits });
          } catch(e) {
            toast.error('Payment verification failed');
          }
        },
        theme: { color: '#76000b' }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch(e) {
      toast.error('Could not initiate payment');
    }
  };

  return (
    <DashboardLayout>
      <div className="text-center mb-5">
        <h2>Buy Credits</h2>
        <p className="text-muted">Current Balance: <strong>{user?.connect_credits} Credits</strong></p>
      </div>
      <div className="row justify-content-center">
        {plans.map((p, i) => (
          <div className="col-md-4 mb-4" key={i}>
            <div className="card shadow-sm border-0 rounded-4 text-center p-4">
              <h4 className="text-wine fw-bold mb-3">{p.name}</h4>
              <h2 className="mb-4">₹{p.price_inr}</h2>
              <p className="text-muted mb-4">{p.credits} Credits</p>
              <button onClick={() => buy(p)} className="btn btn-wine w-100 rounded-pill">Purchase</button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}