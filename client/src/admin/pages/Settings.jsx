import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function Settings() {
  const [comm, setComm] = useState({
    chat_start_cost: 5,
    chat_message_access_cost: 2,
    chat_reinitiate_cost: 5,
    chat_expiry_minutes: 60,
    private_message_start_cost: 10,
    private_message_access_cost: 5,
    private_message_reinitiate_cost: 10,
    private_message_expiry_hours: 24,
    promotional_connects: 0,
    refund_enabled: false,
    female_connect_exemption: true,
    like_cost: 0,
    crush_cost: 0,
    connection_request_cost: 0,
    private_photo_cost: 0,
    chat_enabled: true,
    private_message_enabled: true,
    allow_chat_extension: true,
    allow_female_initiation: true,
    allow_male_initiation: true,
    max_messages_per_session: 500,
    default_male_connects: 0,
    default_female_connects: 0,
  });

  const [platform, setPlatform] = useState({
    payment: {
      razorpay_enabled: true,
      razorpay_key_id: '',
      razorpay_key_secret: '',
      razorpay_webhook_secret: '',
      currency: 'INR',
      brand_name: 'SWAY',
    },
    general: {
      platform_name: 'SWAY',
      support_email: 'support@sway.com',
      maintenance_mode: false,
      registration_enabled: true,
      live_selfie_verification_required: true,
      gender_match_enforcement: true,
    },
    moderation: {
      auto_suspend_report_threshold: 5,
      require_profile_moderation: false,
      max_reports_before_review: 3,
      allow_media_in_chat: true,
    },
    privacy: {
      default_hide_phone: true,
      default_hide_instagram: true,
      default_hide_facebook: true,
      default_hide_telegram: true,
      allow_female_privacy_override: false,
    },
    notifications: {
      push_enabled: true,
      email_enabled: true,
      broadcast_enabled: true,
    },
    security: {
      jwt_expiry_days: 7,
      admin_session_timeout_minutes: 120,
      rate_limit_per_minute: 120,
      require_admin_reason_for_actions: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      if (res.data.communication) {
        setComm((prev) => ({ ...prev, ...res.data.communication }));
      }
      if (res.data.platform) {
        setPlatform((prev) => ({
          payment: { ...prev.payment, ...(res.data.platform.payment || {}) },
          general: { ...prev.general, ...(res.data.platform.general || {}) },
          moderation: { ...prev.moderation, ...(res.data.platform.moderation || {}) },
          privacy: { ...prev.privacy, ...(res.data.platform.privacy || {}) },
          notifications: { ...prev.notifications, ...(res.data.platform.notifications || {}) },
          security: { ...prev.security, ...(res.data.platform.security || {}) },
        }));
      }
    } catch (err) {
      toast.error('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        communication: comm,
        platform,
        reason: 'Admin updated central platform, Razorpay & communication settings',
      });
      toast.success('All platform, Razorpay & communication settings saved to database!');
      loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-danger" />
        <span>Loading central platform settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveAll}>
      <div className="page-header flex-wrap gap-2">
        <div>
          <h4>Central Platform & Communication Settings</h4>
          <div className="breadcrumb-text">
            Configure Razorpay Gateway, Connect costs, Chat & Private Message expiry rules, Female Connect exemptions, Privacy & Moderation.
          </div>
        </div>
        <button type="submit" className="btn-admin-primary" disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check2-circle" />}
          Save All Settings
        </button>
      </div>

      <div className="row g-4">
        {/* 0. Razorpay Payment Gateway Configuration */}
        <div className="col-12">
          <div className="table-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-credit-card-2-front-fill me-2 text-danger" />
                Razorpay Payment Gateway Configuration
              </h6>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rzpEnabledSwitch"
                  checked={platform.payment.razorpay_enabled}
                  onChange={(e) =>
                    setPlatform({
                      ...platform,
                      payment: { ...platform.payment, razorpay_enabled: e.target.checked },
                    })
                  }
                />
                <label className="form-check-label fw-bold text-success" htmlFor="rzpEnabledSwitch">
                  {platform.payment.razorpay_enabled ? 'Razorpay Enabled' : 'Razorpay Disabled'}
                </label>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label-admin">Razorpay Key ID (rzp_test_... or rzp_live_...)</label>
                <input
                  className="form-input-admin"
                  placeholder="rzp_test_..."
                  value={platform.payment.razorpay_key_id}
                  onChange={(e) =>
                    setPlatform({
                      ...platform,
                      payment: { ...platform.payment, razorpay_key_id: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label-admin">Razorpay Key Secret</label>
                <input
                  type="password"
                  className="form-input-admin"
                  placeholder="Enter Razorpay Key Secret (or leave blank to use .env)"
                  value={platform.payment.razorpay_key_secret}
                  onChange={(e) =>
                    setPlatform({
                      ...platform,
                      payment: { ...platform.payment, razorpay_key_secret: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-md-2">
                <label className="form-label-admin">Currency</label>
                <input
                  className="form-input-admin"
                  value={platform.payment.currency || 'INR'}
                  onChange={(e) =>
                    setPlatform({
                      ...platform,
                      payment: { ...platform.payment, currency: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-md-2">
                <label className="form-label-admin">Checkout Brand Name</label>
                <input
                  className="form-input-admin"
                  value={platform.payment.brand_name || 'SWAY'}
                  onChange={(e) =>
                    setPlatform({
                      ...platform,
                      payment: { ...platform.payment, brand_name: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* 1. Chat & Private Message Connect Costs */}
        <div className="col-lg-6">
          <div className="table-card p-4 h-100">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-coin me-2 text-danger" />
              Connect Costs & Gender Rules
            </h6>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label-admin">Start Chat Cost (Male)</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.chat_start_cost}
                  onChange={(e) => setComm({ ...comm, chat_start_cost: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">Access Female Chat Message Cost (Male)</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.chat_message_access_cost}
                  onChange={(e) => setComm({ ...comm, chat_message_access_cost: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">Re-Initiate Expired Chat Cost (Male)</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.chat_reinitiate_cost}
                  onChange={(e) => setComm({ ...comm, chat_reinitiate_cost: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">Send Private Message Cost (Male)</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.private_message_start_cost}
                  onChange={(e) => setComm({ ...comm, private_message_start_cost: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">View Female Private Message Cost (Male)</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.private_message_access_cost ?? 5}
                  onChange={(e) => setComm({ ...comm, private_message_access_cost: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">Re-Initiate Private Message Cost</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.private_message_reinitiate_cost}
                  onChange={(e) => setComm({ ...comm, private_message_reinitiate_cost: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">Private Photo Access Cost (Male)</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.private_photo_access_cost ?? comm.private_photo_cost ?? 5}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setComm({ ...comm, private_photo_cost: val, private_photo_access_cost: val });
                  }}
                  min="0"
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">Promotional Connects on Signup</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.promotional_connects}
                  onChange={(e) => setComm({ ...comm, promotional_connects: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="col-12 mt-2">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="femaleExemptionSwitch"
                    checked={comm.female_connect_exemption}
                    onChange={(e) => setComm({ ...comm, female_connect_exemption: e.target.checked })}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="femaleExemptionSwitch">
                    Female Connect Exemption (Verified Female users never require Connects for Chat or Private Messages)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Session Expiration & Communication Rules */}
        <div className="col-lg-6">
          <div className="table-card p-4 h-100">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-clock-history me-2 text-danger" />
              Chat & Private Message Expiration Rules
            </h6>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label-admin">Chat Session Expiry (Minutes)</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.chat_expiry_minutes}
                  onChange={(e) => setComm({ ...comm, chat_expiry_minutes: Number(e.target.value) })}
                  min="1"
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">Private Message Expiry (Hours)</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.private_message_expiry_hours}
                  onChange={(e) => setComm({ ...comm, private_message_expiry_hours: Number(e.target.value) })}
                  min="1"
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">Max Messages Per Session</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={comm.max_messages_per_session}
                  onChange={(e) => setComm({ ...comm, max_messages_per_session: Number(e.target.value) })}
                  min="10"
                />
              </div>
              <div className="col-12">
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={comm.chat_enabled}
                    onChange={(e) => setComm({ ...comm, chat_enabled: e.target.checked })}
                  />
                  <label className="form-check-label">Enable Live Chat System</label>
                </div>
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={comm.private_message_enabled}
                    onChange={(e) => setComm({ ...comm, private_message_enabled: e.target.checked })}
                  />
                  <label className="form-check-label">Enable Private Messages System</label>
                </div>
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={comm.allow_chat_extension}
                    onChange={(e) => setComm({ ...comm, allow_chat_extension: e.target.checked })}
                  />
                  <label className="form-check-label">Allow Re-initiation of Expired Conversations</label>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={comm.refund_enabled}
                    onChange={(e) => setComm({ ...comm, refund_enabled: e.target.checked })}
                  />
                  <label className="form-check-label">Enable Automated Connect Refunds on Unanswered Sessions</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. General & Verification Settings */}
        <div className="col-lg-6">
          <div className="table-card p-4 h-100">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-shield-check me-2 text-danger" />
              General, Onboarding & Verification Rules
            </h6>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label-admin">Platform Name</label>
                <input
                  className="form-input-admin"
                  value={platform.general.platform_name}
                  onChange={(e) =>
                    setPlatform({ ...platform, general: { ...platform.general, platform_name: e.target.value } })
                  }
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">Support Email</label>
                <input
                  className="form-input-admin"
                  value={platform.general.support_email}
                  onChange={(e) =>
                    setPlatform({ ...platform, general: { ...platform.general, support_email: e.target.value } })
                  }
                />
              </div>
              <div className="col-12">
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={platform.general.registration_enabled}
                    onChange={(e) =>
                      setPlatform({
                        ...platform,
                        general: { ...platform.general, registration_enabled: e.target.checked },
                      })
                    }
                  />
                  <label className="form-check-label">Allow New User Registrations</label>
                </div>
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={platform.general.live_selfie_verification_required}
                    onChange={(e) =>
                      setPlatform({
                        ...platform,
                        general: { ...platform.general, live_selfie_verification_required: e.target.checked },
                      })
                    }
                  />
                  <label className="form-check-label">Require Live Camera Selfie Verification Before Profile Setup</label>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={platform.general.gender_match_enforcement}
                    onChange={(e) =>
                      setPlatform({
                        ...platform,
                        general: { ...platform.general, gender_match_enforcement: e.target.checked },
                      })
                    }
                  />
                  <label className="form-check-label">Strict Selected Gender vs AI Detected Gender Match Validation</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Privacy & Moderation Settings */}
        <div className="col-lg-6">
          <div className="table-card p-4 h-100">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-lock me-2 text-danger" />
              Female Privacy & Moderation Thresholds
            </h6>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label-admin">Auto-Flag Report Threshold</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={platform.moderation.max_reports_before_review}
                  onChange={(e) =>
                    setPlatform({
                      ...platform,
                      moderation: { ...platform.moderation, max_reports_before_review: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label-admin">Auto-Suspend Report Threshold</label>
                <input
                  type="number"
                  className="form-input-admin"
                  value={platform.moderation.auto_suspend_report_threshold}
                  onChange={(e) =>
                    setPlatform({
                      ...platform,
                      moderation: { ...platform.moderation, auto_suspend_report_threshold: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="col-12">
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={platform.privacy.default_hide_phone}
                    onChange={(e) =>
                      setPlatform({
                        ...platform,
                        privacy: { ...platform.privacy, default_hide_phone: e.target.checked },
                      })
                    }
                  />
                  <label className="form-check-label">Hide Female Phone Number by Default Until Explicitly Shared</label>
                </div>
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={platform.privacy.default_hide_instagram}
                    onChange={(e) =>
                      setPlatform({
                        ...platform,
                        privacy: { ...platform.privacy, default_hide_instagram: e.target.checked },
                      })
                    }
                  />
                  <label className="form-check-label">Hide Female Instagram/Facebook/Telegram by Default Until Shared</label>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={platform.security.require_admin_reason_for_actions}
                    onChange={(e) =>
                      setPlatform({
                        ...platform,
                        security: { ...platform.security, require_admin_reason_for_actions: e.target.checked },
                      })
                    }
                  />
                  <label className="form-check-label">Require Audit Log Reason for All Admin Moderation Actions</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}