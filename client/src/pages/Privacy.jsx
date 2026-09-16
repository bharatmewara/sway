import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function PrivacyToggle({ label, description, checked, onChange, icon }) {
  return (
    <div className="d-flex align-items-center justify-content-between py-3 border-bottom">
      <div>
        <div className="d-flex align-items-center gap-2">
          {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
          <span className="fw-semibold">{label}</span>
        </div>
        {description && <p className="text-muted small mb-0 mt-1">{description}</p>}
      </div>
      <div className="form-check form-switch mb-0">
        <input
          className="form-check-input"
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{ width: 48, height: 26, cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}

const PRIVACY_SECTIONS = [
  {
    title: 'Profile Privacy',
    icon: '🧑',
    settings: [
      { key: 'hide_real_name', label: 'Hide Real Name', desc: 'Only show your nickname to other members', icon: '🏷️' },
      { key: 'hide_age', label: 'Hide Age', desc: 'Your age will not be shown on your profile', icon: '🎂' },
      { key: 'blur_face', label: 'Blur Face Photo', desc: 'Your photos will appear blurred until you approve', icon: '😶‍🌫️' },
    ]
  },
  {
    title: 'Contact Privacy',
    icon: '📞',
    settings: [
      { key: 'hide_phone', label: 'Hide Phone Number', desc: 'Never reveal your phone number', icon: '📱' },
      { key: 'hide_email', label: 'Hide Email', desc: 'Keep your email address private', icon: '✉️' },
    ]
  },
  {
    title: 'Discovery Privacy',
    icon: '🔍',
    settings: [
      { key: 'hide_distance', label: 'Hide Distance', desc: 'Others won\'t see how far you are from them', icon: '📍' },
      { key: 'incognito_mode', label: 'Incognito Mode', desc: 'Browse profiles without showing as online', icon: '🎭' },
      { key: 'invisible_browsing', label: 'Invisible Browsing', desc: 'Visit profiles without leaving a footprint', icon: '👻' },
    ]
  },
  {
    title: 'Notifications',
    icon: '🔔',
    settings: [
      { key: 'screenshot_warning', label: 'Screenshot Warning', desc: 'Show a warning when screenshots are detected', icon: '📸' },
      { key: 'notification_masking', label: 'Mask Notifications', desc: 'Hide sensitive info in notification previews', icon: '🔕' },
    ]
  },
];

export default function Privacy() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    hide_real_name: false, hide_age: false, blur_face: false,
    hide_phone: true, hide_email: true, hide_distance: false,
    incognito_mode: false, invisible_browsing: false,
    screenshot_warning: true, notification_masking: false,
    auto_logout_minutes: 0,
  });
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/privacy/settings').then(r => setSettings(r.data.settings)).catch(() => {});
  }, []);

  const updateSetting = (key, value) => {
    setSettings(s => ({ ...s, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/privacy/settings', { ...settings, pin_lock: pin || null });
      toast.success('Privacy settings saved!');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="row">
        <div className="col-lg-8">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h3 className="fw-bold mb-0"><i className="bi bi-shield-lock me-2" style={{ color: '#76000b' }}></i>Privacy Settings</h3>
            <button className="btn btn-wine rounded-pill px-4" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {PRIVACY_SECTIONS.map(section => (
            <div key={section.title} className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <h5 className="fw-bold mb-3">
                <span className="me-2">{section.icon}</span>
                {section.title}
              </h5>
              {section.settings.map(s => (
                <PrivacyToggle
                  key={s.key}
                  label={s.label}
                  description={s.desc}
                  icon={s.icon}
                  checked={settings[s.key] || false}
                  onChange={v => updateSetting(s.key, v)}
                />
              ))}
            </div>
          ))}

          {/* Auto logout */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-3">⏰ Auto Logout</h5>
            <label className="text-muted small mb-2">Automatically log out after inactivity (0 = disabled)</label>
            <select className="form-select"
              value={settings.auto_logout_minutes}
              onChange={e => updateSetting('auto_logout_minutes', parseInt(e.target.value))}
            >
              <option value={0}>Disabled</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={240}>4 hours</option>
            </select>
          </div>

          {/* PIN Lock */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-3">🔐 App PIN Lock</h5>
            <p className="text-muted small">Set a 4-6 digit PIN to lock the app</p>
            <input
              type="password"
              className="form-control"
              placeholder="Enter new PIN (leave empty to disable)"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value)}
              style={{ maxWidth: 200 }}
            />
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4"
            style={{ background: 'linear-gradient(135deg, #76000b, #1a0000)', color: '#fff' }}>
            <h6 className="fw-bold mb-3">🛡️ Privacy Score</h6>
            <div className="mb-3">
              {(() => {
                const enabled = Object.values(settings).filter(Boolean).length;
                const total = Object.keys(settings).length;
                const pct = Math.round((enabled / total) * 100);
                return (
                  <>
                    <div className="d-flex justify-content-between mb-1">
                      <small>Protection Level</small>
                      <small className="fw-bold">{pct}%</small>
                    </div>
                    <div className="progress" style={{ height: 8, background: 'rgba(255,255,255,0.2)' }}>
                      <div className="progress-bar" style={{ width: `${pct}%`, background: '#d8a83f' }}></div>
                    </div>
                    <p className="mt-2 opacity-75" style={{ fontSize: 12 }}>
                      {pct >= 70 ? 'Excellent privacy protection!' : pct >= 40 ? 'Good, consider enabling more features' : 'Enable more privacy settings for better protection'}
                    </p>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold mb-3">💡 Privacy Tips</h6>
            <ul className="list-unstyled" style={{ fontSize: 13 }}>
              <li className="mb-2">✓ Use a nickname instead of your real name</li>
              <li className="mb-2">✓ Enable incognito mode while browsing</li>
              <li className="mb-2">✓ Blur your photos until you trust someone</li>
              <li className="mb-2">✓ Set auto-logout for shared devices</li>
              <li className="mb-2">✓ Never share your contact details in chat</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
