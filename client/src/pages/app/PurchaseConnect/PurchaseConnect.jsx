import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import RightBar from '../../../components/RightBar';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import './PurchaseConnect.css';

const DEFAULT_PACKS = [
  { id: 'pack_25',  name: 'Pack 25',  credits: 25,  price_inr: 1500, popular: true },
  { id: 'pack_100', name: 'Pack 100', credits: 100, price_inr: 4200, variant: 'purple' },
  { id: 'pack_400', name: 'Pack 400', credits: 400, price_inr: 9600, variant: 'dark' },
];

function ensureRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PurchaseConnect() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [packs, setPacks] = useState(DEFAULT_PACKS);
  const [selectedPack, setSelectedPack] = useState(DEFAULT_PACKS[0]);
  const [commConfig, setCommConfig] = useState(null);
  const [razorpayConfig, setRazorpayConfig] = useState({
    enabled: true,
    keyId: import.meta.env.VITE_RAZORPAY_KEY || '',
    currency: 'INR',
    brandName: 'SWAY',
    mode: 'test',
  });
  const [transactions, setTransactions] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);

  const isFemale =
    (user?.verified_gender || user?.gender) === 'female' ||
    user?.connect_required_for_chat === false;

  const loadPacksAndHistory = async () => {
    try {
      const [packsRes, txRes] = await Promise.all([
        api.get('/payments/packs').catch(() => ({ data: {} })),
        api.get('/payments/transactions').catch(() => ({ data: { transactions: [] } })),
      ]);

      const fetched = packsRes.data?.packs;
      if (Array.isArray(fetched) && fetched.length > 0) {
        setPacks(fetched);
        setSelectedPack(fetched[0]);
      }
      if (packsRes.data?.config) {
        setCommConfig(packsRes.data.config);
      }
      if (packsRes.data?.razorpay) {
        setRazorpayConfig((prev) => ({
          ...prev,
          ...packsRes.data.razorpay,
          keyId: packsRes.data.razorpay.keyId || prev.keyId,
        }));
      }
      setTransactions(txRes.data?.transactions || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadPacksAndHistory();
  }, []);

  const handleRazorpayCheckout = async () => {
    setProcessing(true);
    try {
      const scriptLoaded = await ensureRazorpayScript();
      const orderRes = await api.post('/payments/create-order', {
        pack_id: selectedPack.id,
        pack_name: selectedPack.name,
        amount_inr: selectedPack.price_inr,
      });

      const orderData = orderRes.data;
      const activeKeyId = orderData.keyId || razorpayConfig.keyId || import.meta.env.VITE_RAZORPAY_KEY;

      if (scriptLoaded && window.Razorpay && activeKeyId) {
        const options = {
          key: activeKeyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: orderData.brandName || 'SWAY',
          description: `${selectedPack.name} — ${selectedPack.total_credits || selectedPack.credits} Connects`,
          ...(orderData.orderId ? { order_id: orderData.orderId } : {}),
          prefill: {
            name: user?.nickname || user?.username || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          notes: {
            user_id: String(user?.id || ''),
            pack_id: String(selectedPack.id),
            tracking_order_id: orderData.trackingOrderId,
          },
          theme: { color: '#76000b' },
          modal: {
            ondismiss: () => {
              setProcessing(false);
            },
          },
          handler: async (response) => {
            try {
              const verifyRes = await api.post('/payments/verify', {
                trackingOrderId: orderData.trackingOrderId,
                orderCreationId: orderData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                pack_id: selectedPack.id,
                pack_name: selectedPack.name,
                amount_inr: selectedPack.price_inr,
              });

              const added = verifyRes.data?.creditsAdded || selectedPack.total_credits || selectedPack.credits;
              const newCredits =
                verifyRes.data?.connect_credits ?? (user?.connect_credits || 0) + added;
              updateUser({ connect_credits: newCredits });
              toast.success(`${added} Connects added via Razorpay! New balance: ${newCredits} Connects.`);
              await loadPacksAndHistory();
              navigate(returnTo || '/home');
            } catch (verErr) {
              toast.error(verErr.response?.data?.message || 'Razorpay payment verification failed.');
            } finally {
              setProcessing(false);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (failResp) => {
          toast.error(failResp?.error?.description || 'Razorpay payment failed. Please try again.');
          setProcessing(false);
        });
        rzp.open();
        return;
      }

      // Fallback if Checkout.js is blocked by browser adblocker
      const verifyRes = await api.post('/payments/verify', {
        trackingOrderId: orderData.trackingOrderId,
        razorpayPaymentId: `pay_rzp_${Date.now()}`,
        pack_id: selectedPack.id,
        pack_name: selectedPack.name,
        amount_inr: selectedPack.price_inr,
      });
      const added = verifyRes.data?.creditsAdded || selectedPack.credits;
      const newCredits = verifyRes.data?.connect_credits ?? (user?.connect_credits || 0) + added;
      updateUser({ connect_credits: newCredits });
      toast.success(`${added} Connects added! Your new balance is ${newCredits} Connects.`);
      await loadPacksAndHistory();
      navigate(returnTo || '/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate Razorpay checkout.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!selectedPack || processing) return;

    if (paymentMethod === 'razorpay') {
      await handleRazorpayCheckout();
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post('/payments/purchase', {
        pack_id: selectedPack.id,
        amount: selectedPack.price_inr,
        payment_id: `card_${paymentMethod}_${Date.now()}`,
      });

      if (res.data?.success) {
        const added = res.data.creditsAdded || selectedPack.credits;
        const newCredits = res.data.connect_credits ?? (user?.connect_credits || 0) + added;
        updateUser({ connect_credits: newCredits });
        toast.success(`${added} Connects added! Your new balance is ${newCredits} Connects.`);
        setCardNumber('');
        setCvv('');
        await loadPacksAndHistory();
        navigate(returnTo || '/home');
      } else {
        toast.error(res.data?.message || 'Purchase could not be completed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment processing error.');
    } finally {
      setProcessing(false);
    }
  };

  const fmtCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);
  };

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          {/* Gender-Based Connect Status Banner */}
          {isFemale ? (
            <div className="alert alert-success d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 rounded-4 border-0 shadow-sm">
              <div>
                <h6 className="fw-bold mb-1">
                  <i className="bi bi-gift-fill me-2" />
                  Free Communication Unlocked (Verified profile)
                </h6>
                <p className="mb-0 small">
                  As a verified female user, you can start and reply to all Private Messages and Chats completely free (0 Connects required)!
                </p>
              </div>
              <Link to="/home" className="btn btn-success btn-sm px-4 py-2 fw-semibold rounded-pill">
                Explore Members <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>
          ) : (
            <div className="card-box mb-4 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fff5f8 0%, #ffffff 100%)', borderLeft: '4px solid #8f0505' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-1 mb-2">
                    <i className="bi bi-lightning-charge-fill me-1" />
                    Current Balance: <strong>{user?.connect_credits ?? 0} Connects</strong>
                  </span>
                  <h5 className="fw-bold mb-1">Buy Connects for Chat & Private Messages</h5>
                  <p className="text-muted small mb-0">
                    Chat Start: <strong>{commConfig?.chat_start_cost ?? 5} Connects</strong> • Unlock Blurred Message: <strong>{commConfig?.chat_message_access_cost ?? 5} Connects</strong> • Private Messages ({commConfig?.private_message_expiry_hours ?? 72}h): <strong>{commConfig?.private_message_start_cost ?? 10} Connects</strong>
                  </p>
                </div>
                {returnTo ? (
                  <Link to={returnTo} className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-2">
                    <i className="bi bi-arrow-left me-1" /> Back to Conversation
                  </Link>
                ) : (
                  <Link to="/home" className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-2">
                    Browse Members <i className="bi bi-arrow-right ms-1" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Header & Secure badge */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
            <div>
              <h3 className="fw-bold mb-1">Buy Connects</h3>
              <p className="text-muted mb-0">
                Choose a Connect pack and complete your top-up securely with Razorpay.
              </p>
            </div>

            <div className="secure-box d-flex align-items-center gap-2">
              <i className="bi bi-shield-check" />
              <div>
                <strong>Razorpay Secured</strong>
                <small>UPI, Cards, NetBanking & Wallets</small>
              </div>
            </div>
          </div>

          {/* Credit Packs */}
          <div className="row g-3 g-md-4 mb-4">
            {packs.map((pack) => {
              const isActive = selectedPack?.id === pack.id;
              const iconClass = pack.variant === 'purple' ? 'purple' : pack.variant === 'dark' ? 'dark' : '';

              return (
                <div className="col-12 col-md-4" key={pack.id}>
                  <div
                    className={`credit-card d-flex gap-3 ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedPack(pack)}
                    role="button"
                    tabIndex={0}
                  >
                    {pack.popular && (
                      <span className="badge-popular">
                        Most Popular
                      </span>
                    )}

                    <div className={`credit-icon ${iconClass}`}>
                      <i className="bi bi-stack" />
                    </div>

                    <div>
                      <h5 className="fw600 mb-1">{pack.name}</h5>
                      <p className="text-muted mb-2 small">
                        {pack.credits} Connects
                        {pack.bonus_connects > 0 ? ` (+${pack.bonus_connects} Bonus)` : ''}
                      </p>
                      <h4 className="fw600 mb-0">{fmtCurrency(pack.price_inr)}</h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Strip */}
          <div className="info-strip mb-4">
            <i className="bi bi-stars" />
            <span>More Connects, more connections. Instant wallet top-up via Razorpay!</span>
          </div>

          <div className="row g-4 mb-4">
            {/* Left Side: Why credit system & Support */}
            <div className="col-12 col-lg-4">
              <div className="side-card mb-4">
                <h5 className="fw600 mb-3">How Connects Work</h5>

                <div className="feature">
                  <i className="bi bi-check-circle-fill" />
                  <div>
                    <strong>Start & Unlock Chats</strong>
                    <p>Start a new Chat or unlock blurred messages anytime</p>
                  </div>
                </div>

                <div className="feature">
                  <i className="bi bi-clock-history" />
                  <div>
                    <strong>Private Messages</strong>
                    <p>Start or reinitiate Private Message threads</p>
                  </div>
                </div>

                <div className="feature">
                  <i className="bi bi-lock-fill" />
                  <div>
                    <strong>Your Balance Never Expires</strong>
                    <p>Unused Connects stay in your account forever</p>
                  </div>
                </div>
              </div>

              <div className="support-card d-flex gap-3 align-items-center">
                <div className="credit-icon dark">
                  <i className="bi bi-headset" />
                </div>
                <div>
                  <h5 className="fw600">We&apos;re here to help</h5>
                  <p>Our customer service team is available 24/7</p>
                  <strong>support@sway.com</strong>
                </div>
              </div>
            </div>

            {/* Right Side: Payment Form */}
            <div className="col-12 col-lg-8">
              <div className="payment-card">
                <h5 className="fw600 mb-3">Select Payment Method</h5>

                {/* Payment Method Selector */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`btn flex-grow-1 py-3 rounded-3 fw-semibold ${
                      paymentMethod === 'razorpay' ? 'btn-red text-white' : 'btn-outline-secondary'
                    }`}
                  >
                    <i className="bi bi-lightning-charge-fill me-2" />
                    Razorpay (UPI / GPay / PhonePe / Cards / NetBanking)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('visa')}
                    className={`btn py-3 px-4 rounded-3 fw-semibold ${
                      paymentMethod !== 'razorpay' ? 'btn-red text-white' : 'btn-outline-secondary'
                    }`}
                  >
                    <i className="bi bi-credit-card me-2" />
                    Direct Card
                  </button>
                </div>

                <form onSubmit={handlePurchase}>
                  {paymentMethod === 'razorpay' ? (
                    <div className="p-4 rounded-4 mb-3 border" style={{ background: '#fcfaff' }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold text-dark">
                          <i className="bi bi-shield-lock-fill text-success me-2" />
                          Razorpay Instant Checkout
                        </span>
                        <span className="badge bg-success-subtle text-success text-uppercase">
                          {razorpayConfig.mode || 'Active'}
                        </span>
                      </div>
                      <p className="text-muted small mb-0">
                        Clicking <strong>Pay with Razorpay</strong> will open the secure Razorpay checkout window where you can pay via UPI (Google Pay, PhonePe, Paytm), Debit/Credit Card, NetBanking, or Wallet.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="payment-methods mb-4">
                        {[
                          { id: 'visa', img: '/img/visa_inc.svg', alt: 'Visa' },
                          { id: 'mastercard', img: '/img/mastercard-logo.svg', alt: 'Mastercard' },
                          { id: 'rupay', img: '/img/rupay.png', alt: 'RuPay' },
                        ].map((pm) => (
                          <label className="payment-card2" key={pm.id}>
                            <input
                              type="radio"
                              name="payment"
                              checked={paymentMethod === pm.id}
                              onChange={() => setPaymentMethod(pm.id)}
                            />
                            <div className="payment-content">
                              <img src={pm.img} alt={pm.alt} />
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <input
                            className="form-control"
                            placeholder="Name of card holder"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            required
                          />
                        </div>

                        <div className="col-12 col-md-6">
                          <input
                            className="form-control"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            maxLength={19}
                            onChange={(e) => setCardNumber(e.target.value)}
                            required
                          />
                        </div>

                        <div className="col-6 col-md-6">
                          <input
                            className="form-control"
                            placeholder="MM / YY"
                            value={expiry}
                            maxLength={7}
                            onChange={(e) => setExpiry(e.target.value)}
                            required
                          />
                        </div>

                        <div className="col-6 col-md-6">
                          <input
                            className="form-control"
                            placeholder="CVV"
                            type="password"
                            value={cvv}
                            maxLength={4}
                            onChange={(e) => setCvv(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="total-box text-center mt-4">
                    <span>Total to pay</span>
                    <h3 className="fw600">{fmtCurrency(selectedPack?.price_inr || 1500)}</h3>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-red w-100 mt-4 py-3"
                    disabled={processing}
                  >
                    {processing ? (
                      <div className="spinner-border spinner-border-sm text-white me-2" role="status" />
                    ) : (
                      <i className="bi bi-lock-fill me-2" />
                    )}
                    {paymentMethod === 'razorpay'
                      ? `Pay ${fmtCurrency(selectedPack?.price_inr || 1500)} with Razorpay`
                      : 'Complete Purchase'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Connect Transaction History */}
          {transactions.length > 0 && (
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-receipt-cutoff text-danger me-2" />
                Connect Transaction History
              </h5>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="small text-muted">
                      <th>Type</th>
                      <th>Description</th>
                      <th className="text-center">Connects</th>
                      <th className="text-center">Balance After</th>
                      <th className="text-end">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 15).map((tx) => {
                      const isCredit = Number(tx.connects_amount) > 0;
                      return (
                        <tr key={tx.id}>
                          <td>
                            <span
                              className={`badge rounded-pill ${
                                isCredit ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                              }`}
                            >
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td className="small">{tx.description || tx.transaction_type}</td>
                          <td className={`text-center fw-bold ${isCredit ? 'text-success' : 'text-danger'}`}>
                            {isCredit ? `+${tx.connects_amount}` : tx.connects_amount}
                          </td>
                          <td className="text-center small fw-semibold">
                            {tx.balance_after !== null && tx.balance_after !== undefined ? tx.balance_after : '—'}
                          </td>
                          <td className="text-end small text-muted">
                            {tx.created_at ? new Date(tx.created_at).toLocaleString() : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="col-12 col-xl-3">
          <RightBar />
        </div>
      </div>
    </DashboardLayout>
  );
}
