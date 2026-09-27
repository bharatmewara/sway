import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import api from '../../api/axios';
import { useAdminAuth } from '../context/AdminAuthContext';

function StatCard({ icon, iconBg, value, label, sublabel, changeType = 'neutral', prefix = '', suffix = '', onClick }) {
  return (
    <div
      className="stat-card"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="stat-value">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString('en-IN') : (value ?? 0)}
            {suffix}
          </div>
          <div className="stat-label">{label}</div>
          {sublabel && (
            <div className={`stat-change ${changeType}`}>
              {sublabel}
            </div>
          )}
        </div>
        <div className="stat-icon" style={{ background: iconBg }}>
          <i className={`bi ${icon}`} style={{ color: '#fff' }} />
        </div>
      </div>
    </div>
  );
}

const GENDER_COLORS = ['#1565c0', '#c62828', '#6a1b9a'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#1a1a2e',
          border: 'none',
          borderRadius: 10,
          padding: '10px 16px',
          color: '#fff',
          fontSize: 13,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: 0, color: p.color || '#fff' }}>
            {p.name}: {p.name === 'revenue' ? `₹${Number(p.value || 0).toLocaleString('en-IN')}` : Number(p.value || 0).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { socket } = useAdminAuth();

  const fetchDashboard = useCallback(async (showLoading = true, targetRange = range) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/dashboard', { params: { range: targetRange } });
      setData(res.data);
    } catch (err) {
      console.error('[Dashboard] Failed to load dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchDashboard(true, range);
  }, [range, fetchDashboard]);

  useEffect(() => {
    if (!socket) return;
    const handleAdminUpdate = () => {
      fetchDashboard(false, range);
    };
    socket.on('admin_update', handleAdminUpdate);
    return () => {
      socket.off('admin_update', handleAdminUpdate);
    };
  }, [socket, range, fetchDashboard]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-danger" role="status" />
        <span style={{ color: '#888', fontSize: 14 }}>Loading live database metrics...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="table-card p-5 text-center">
        <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: 42 }} />
        <h5 className="mt-3 fw-bold">Unable to Load Dashboard</h5>
        <p className="text-muted mb-3">{error}</p>
        <button className="btn-admin-primary" onClick={() => fetchDashboard(true, range)}>
          <i className="bi bi-arrow-clockwise" /> Retry
        </button>
      </div>
    );
  }

  const d = data || {};
  const stats = d.stats || d;
  const revenueData = stats.revenueByDay || [];
  const genderData = (stats.genderSplit || []).map((g) => ({
    name: g.gender ? g.gender.charAt(0).toUpperCase() + g.gender.slice(1) : 'Unknown',
    value: parseInt(g.count, 10) || 0,
  }));
  const messagesData = stats.messagesByDay || [];
  const cityWiseUsers = (stats.cityWiseUsers || []).map((c) => ({
    ...c,
    count: parseInt(c.count, 10) || parseInt(c.user_count, 10) || 0,
  }));
  const recentUsers = stats.recentUsers || [];
  const maxCity = Math.max(...cityWiseUsers.map((c) => c.count), 1);

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'verified') return 'badge-verified';
    if (s.includes('pending') || s.includes('progress')) return 'badge-pending';
    if (s.includes('reject') || s.includes('resubmission') || s.includes('fail')) return 'badge-rejected';
    return 'badge-inactive';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header flex-wrap gap-2">
        <div>
          <h4>Executive Dashboard</h4>
          <div className="breadcrumb-text">
            Live database metrics across Users, Verifications, Connects, Revenue, Messages & Moderation.
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <select
            className="filter-select"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="12m">Last 12 Months</option>
          </select>
          <button className="btn-admin-primary" onClick={() => fetchDashboard(true, range)}>
            <i className="bi bi-arrow-clockwise" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Row 1: User & Verification KPIs ── */}
      <div className="row g-3 mb-3">
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-people-fill"
            iconBg="linear-gradient(135deg, #1565c0, #1976d2)"
            value={stats.totalUsers || 0}
            label="Total Users"
            sublabel={`♀ ${stats.femaleUsers || 0} Female • ♂ ${stats.maleUsers || 0} Male`}
            changeType="up"
            onClick={() => navigate('/admin/users')}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-wifi"
            iconBg="linear-gradient(135deg, #2e7d32, #388e3c)"
            value={stats.onlineNow || 0}
            label="Online Now"
            sublabel={`${stats.activeToday || 0} active today • +${stats.newRegistrationsToday || 0} new today`}
            changeType="up"
            onClick={() => navigate('/admin/users?online=true')}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-patch-check-fill"
            iconBg="linear-gradient(135deg, #76000b, #e53935)"
            value={stats.totalVerified || 0}
            label="Verified Users"
            sublabel={`${stats.completedProfiles || 0} completed profiles`}
            changeType="up"
            onClick={() => navigate('/admin/verifications')}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-shield-exclamation"
            iconBg="linear-gradient(135deg, #e65100, #f57c00)"
            value={stats.pendingVerifications || 0}
            label="Pending Verifications"
            sublabel={`${stats.failedVerifications || 0} failed / resubmission required`}
            changeType="down"
            onClick={() => navigate('/admin/verifications')}
          />
        </div>
      </div>

      {/* ── Row 2: Revenue & Connect Economy KPIs ── */}
      <div className="row g-3 mb-3">
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-currency-rupee"
            iconBg="linear-gradient(135deg, #00695c, #00897b)"
            value={stats.todayRevenue || 0}
            label="Today's Revenue"
            prefix="₹"
            sublabel={`₹${(stats.weekRevenue || 0).toLocaleString('en-IN')} last 7d`}
            changeType="up"
            onClick={() => navigate('/admin/transactions')}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-graph-up-arrow"
            iconBg="linear-gradient(135deg, #6a1b9a, #8e24aa)"
            value={stats.totalRevenue || 0}
            label="Total Revenue"
            prefix="₹"
            sublabel={`${stats.successfulTransactions || 0} paid • ${stats.refundedTransactions || 0} refunded`}
            changeType="up"
            onClick={() => navigate('/admin/transactions')}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-coin"
            iconBg="linear-gradient(135deg, #f57f17, #fbc02d)"
            value={stats.totalConnectsAvailable || 0}
            label="Connects in Wallets"
            sublabel={`${stats.totalConnectsPurchased || 0} added • ${stats.totalConnectsSpent || 0} spent`}
            changeType="neutral"
            onClick={() => navigate('/admin/connects')}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-flag-fill"
            iconBg="linear-gradient(135deg, #b71c1c, #c62828)"
            value={stats.openReports || 0}
            label="Open Reports"
            sublabel={`${stats.highPriorityReports || 0} high priority • ${stats.bannedUsers || 0} banned users`}
            changeType="down"
            onClick={() => navigate('/admin/reports')}
          />
        </div>
      </div>

      {/* ── Row 3: Engagement & Communication KPIs ── */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-chat-dots-fill"
            iconBg="linear-gradient(135deg, #01579b, #0277bd)"
            value={stats.activeChats || 0}
            label="Active Chat Sessions"
            sublabel={`${stats.expiredChats || 0} expired sessions`}
            onClick={() => navigate('/admin/messages')}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-envelope-paper-heart-fill"
            iconBg="linear-gradient(135deg, #ad1457, #d81b60)"
            value={stats.totalPrivateMessages || 0}
            label="Private Messages"
            sublabel={`${stats.totalMessages || 0} total messages (${stats.messagesToday || 0} today)`}
            onClick={() => navigate('/admin/messages')}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-heart-fill"
            iconBg="linear-gradient(135deg, #c62828, #e53935)"
            value={(stats.totalLikes || 0) + (stats.totalCrushes || 0)}
            label="Likes & Crushes"
            sublabel={`${stats.totalLikes || 0} Likes • ${stats.totalCrushes || 0} Crushes`}
            onClick={() => navigate('/admin/analytics')}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-eye-fill"
            iconBg="linear-gradient(135deg, #37474f, #546e7a)"
            value={stats.totalVisitors || 0}
            label="Profile Visits"
            sublabel={`${stats.totalBlocks || 0} active user blocks`}
            onClick={() => navigate('/admin/analytics')}
          />
        </div>
      </div>

      {/* ── Row 4: Revenue + Gender Charts ── */}
      <div className="row g-3 mb-4">
        <div className="col-xl-8">
          <div className="chart-card" style={{ height: 360 }}>
            <div className="chart-title">Revenue & Connect Sales Trend</div>
            <div className="chart-subtitle">Real-time revenue recorded in PostgreSQL (₹)</div>
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#aaa' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#e53935"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5, fill: '#e53935' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="chart-card" style={{ height: 360 }}>
            <div className="chart-title">Verified Gender Distribution</div>
            <div className="chart-subtitle">Female vs Male user base</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => Number(v || 0).toLocaleString('en-IN')} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              {genderData.map((g, i) => {
                const totalG = genderData.reduce((a, b) => a + b.value, 0) || 1;
                const pct = ((g.value / totalG) * 100).toFixed(1);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: '#f8f9fa',
                      borderRadius: 10,
                      padding: '8px 10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 700, color: GENDER_COLORS[i % GENDER_COLORS.length] }}>
                      {pct}% ({g.value})
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>{g.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 5: Messages Bar + City Table ── */}
      <div className="row g-3 mb-4">
        <div className="col-xl-6">
          <div className="chart-card" style={{ height: 340 }}>
            <div className="chart-title">Daily Message Volume</div>
            <div className="chart-subtitle">Chat vs Private Messages sent</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={messagesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="messages" fill="#76000b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="chart-card" style={{ height: 340, overflowY: 'auto' }}>
            <div className="chart-title">Top Cities</div>
            <div className="chart-subtitle">User distribution across cities</div>
            <div style={{ marginTop: 8 }}>
              {cityWiseUsers.slice(0, 10).map((city, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 0',
                    borderBottom: i < 9 ? '1px solid #f5f5f5' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: i < 3 ? '#76000b' : '#f5f5f5',
                      color: i < 3 ? '#fff' : '#888',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                        {city.city} {city.state ? <small className="text-muted">({city.state})</small> : null}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#76000b' }}>
                        {city.count?.toLocaleString('en-IN')} ({city.online || 0} online)
                      </span>
                    </div>
                    <div className="city-bar-track">
                      <div className="city-bar" style={{ width: `${(city.count / maxCity) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {cityWiseUsers.length === 0 && (
                <div className="text-muted text-center py-4">No city data available yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 6: Recent Registrations ── */}
      <div className="table-card">
        <div className="table-card-header">
          <h6 className="table-card-title">
            <i className="bi bi-person-plus me-2" style={{ color: '#e53935' }} />
            Recent Registrations
          </h6>
          <button className="btn-admin-outline" onClick={() => navigate('/admin/users')}>
            View All Users <i className="bi bi-arrow-right ms-1" />
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>User</th>
                <th>Selected / AI / Verified Gender</th>
                <th>City</th>
                <th>Verification</th>
                <th>Profile</th>
                <th>Connects</th>
                <th>Account Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr
                  key={user.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar-sm">
                        {(user.username || user.nickname || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1a1a2e' }}>
                          {user.username}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-status ${user.gender === 'female' ? 'badge-female' : 'badge-male'}`}>
                      {user.selected_gender || user.gender || '—'} / {user.ai_detected_gender || '—'} / {user.verified_gender || '—'}
                    </span>
                  </td>
                  <td>{user.city || '—'}</td>
                  <td>
                    <span className={`badge-status ${getStatusBadge(user.verification_status)}`}>
                      {user.verification_status || 'not_submitted'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-status ${user.profile_completed ? 'badge-verified' : 'badge-pending'}`}>
                      {user.profile_completed ? 'COMPLETED' : (user.profile_status || 'INCOMPLETE')}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#6a1b9a' }}>
                    {user.connect_credits ?? 0}
                  </td>
                  <td>
                    <span className={`badge-status ${user.is_banned ? 'badge-banned' : 'badge-active'}`}>
                      {user.account_status || (user.is_banned ? 'BANNED' : 'ACTIVE')}
                    </span>
                  </td>
                  <td style={{ color: '#888', fontSize: 12 }}>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
