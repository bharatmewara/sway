import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import RightBar from '../../../components/RightBar';
import toast from 'react-hot-toast';

const SETTINGS_TABS = [
  { path: '/settings/account',       icon: 'bi-person-gear',     label: 'Account Settings' },
  { path: '/settings/privacy',       icon: 'bi-shield-lock',     label: 'Privacy Controls' },
  { path: '/settings/notifications', icon: 'bi-bell',            label: 'Notifications' },
];

export default function NotificationSettings() {
  const location = useLocation();
  const [prefs, setPrefs] = useState({
    new_messages: true,
    private_messages: true,
    message_requests: true,
    likes_and_crushes: true,
    profile_visitors: true,
  });

  const handleToggle = (key) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success('Notification preference saved');
      return updated;
    });
  };

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h4 className="fw-bold mb-1">
                <i className="bi bi-bell-fill text-danger me-2" />
                Notification Settings
              </h4>
              <p className="text-muted small mb-0">
                Choose which real-time alerts and notifications you want to receive.
              </p>
            </div>
          </div>

          {/* Settings Navigation Tabs */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {SETTINGS_TABS.map((tab) => {
              const active = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold text-decoration-none ${
                    active ? 'btn-wine text-white' : 'btn-light border text-dark'
                  }`}
                >
                  <i className={`bi ${tab.icon} me-1`} />
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">Alert Preferences</h5>
            <div className="list-group list-group-flush">
              {[
                { key: 'new_messages', label: 'New Chat Messages', desc: 'Get notified when someone sends you a Chat message' },
                { key: 'private_messages', label: 'Private Messages (72h)', desc: 'Get notified when you receive a Private Message' },
                { key: 'message_requests', label: 'Message Requests', desc: 'Get notified when someone sends or accepts a Message Request' },
                { key: 'likes_and_crushes', label: 'Likes & Crushes', desc: 'Get notified when a member sends you a Like or Crush' },
                { key: 'profile_visitors', label: 'Profile Visitors', desc: 'Get notified when someone visits your profile' },
              ].map((item) => (
                <div key={item.key} className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                  <div>
                    <div className="fw-semibold">{item.label}</div>
                    <small className="text-muted">{item.desc}</small>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={prefs[item.key]}
                      onChange={() => handleToggle(item.key)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-3">
          <RightBar />
        </div>
      </div>
    </DashboardLayout>
  );
}
