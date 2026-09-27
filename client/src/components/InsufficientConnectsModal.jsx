import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function InsufficientConnectsModal() {
  const { user, insufficientConnectsModal, hideInsufficientConnects } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!insufficientConnectsModal || !insufficientConnectsModal.open) {
    return null;
  }

  const currentConnects =
    insufficientConnectsModal.currentConnects !== undefined
      ? Number(insufficientConnectsModal.currentConnects)
      : Number(user?.connect_credits ?? 0);

  const requiredConnects =
    insufficientConnectsModal.requiredConnects !== undefined
      ? Number(insufficientConnectsModal.requiredConnects)
      : 5;

  const neededConnects = Math.max(0, requiredConnects - currentConnects);
  const returnTo = insufficientConnectsModal.returnTo || location.pathname + location.search;
  const message =
    insufficientConnectsModal.message ||
    `You need ${requiredConnects} Connects to continue, but your current balance is ${currentConnects} Connects.`;

  const handleBuyConnects = () => {
    hideInsufficientConnects();
    navigate(`/purchase-connect?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1080 }}
      onClick={hideInsufficientConnects}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Top Accent Banner */}
          <div
            className="p-4 text-center text-white position-relative"
            style={{ background: 'linear-gradient(135deg, #76000b 0%, #a50818 100%)' }}
          >
            <button
              type="button"
              className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
              onClick={hideInsufficientConnects}
              aria-label="Close"
            />
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
              style={{
                width: 60,
                height: 60,
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
              }}
            >
              <i className="bi bi-lightning-charge-fill fs-2 text-warning" />
            </div>
            <h5 className="fw-bold mb-1">Insufficient Connects</h5>
            <p className="small mb-0 opacity-75">Top up your Connect balance to continue</p>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            <p className="text-center text-muted small mb-3">{message}</p>

            <div
              className="rounded-3 p-3 mb-4"
              style={{ backgroundColor: '#fff5f7', border: '1px solid #f5d0d6' }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2 small">
                <span className="text-muted">Required Connects:</span>
                <span className="fw-bold text-danger">{requiredConnects} Connects</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2 small">
                <span className="text-muted">Your Current Balance:</span>
                <span className="fw-bold text-dark">{currentConnects} Connects</span>
              </div>
              {neededConnects > 0 && (
                <div className="d-flex justify-content-between align-items-center pt-2 border-top small">
                  <span className="fw-semibold text-dark">Additional Connects Needed:</span>
                  <span className="badge bg-danger rounded-pill px-3 py-1">
                    +{neededConnects} Connects
                  </span>
                </div>
              )}
            </div>

            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-wine rounded-pill py-2 fw-semibold"
                onClick={handleBuyConnects}
              >
                <i className="bi bi-lightning-charge-fill me-2 text-warning" />
                Buy Connects Now
              </button>
              <button
                type="button"
                className="btn btn-light border rounded-pill py-2 fw-semibold text-muted"
                onClick={hideInsufficientConnects}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
