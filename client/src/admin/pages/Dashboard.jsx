import React, { useEffect, useState } from 'react';
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

/* ── Fallback mock data when API is unavailable ── */
const MOCK = {
  stats: {
    totalUsers: 18430,
    onlineNow: 342,
    pendingVerifications: 67,
    todayRevenue: 24850,
    totalVerified: 11200,
    totalRevenue: 1284700,
    totalMessages: 945820,
    openReports: 23,
  },
  revenueData: Array.from({ length: 30 }, (_, i) => ({
    day: `Jun ${i + 1}`,
    revenue: Math.floor(Math.random() * 40000 + 8000),
  })),
  genderData: [
    { name: 'Male', value: 11200 },
    { name: 'Female', value: 7230 },
  ],
  messagesData: [
    { day: 'Mon', messages: 12400 },
    { day: 'Tue', messages: 15800 },
    { day: 'Wed', messages: 11200 },
    { day: 'Thu', messages: 18900 },
    { day: 'Fri', messages: 22100 },
    { day: 'Sat', messages: 28400 },
    { day: 'Sun', messages: 19600 },
  ],
  cityWiseUsers: [
    { city: 'Mumbai', state: 'Maharashtra', count: 3840, online: 68 },
    { city: 'Delhi', state: 'Delhi', count: 3210, online: 52 },
    { city: 'Bangalore', state: 'Karnataka', count: 2890, online: 61 },
    { city: 'Hyderabad', state: 'Telangana', count: 2140, online: 38 },
    { city: 'Chennai', state: 'Tamil Nadu', count: 1760, online: 29 },
    { city: 'Kolkata', state: 'West Bengal', count: 1520, online: 24 },
    { city: 'Pune', state: 'Maharashtra', count: 1380, online: 22 },
    { city: 'Ahmedabad', state: 'Gujarat', count: 920, online: 14 },
    { city: 'Jaipur', state: 'Rajasthan', count: 780, online: 11 },
    { city: 'Surat', state: 'Gujarat', count: 620, online: 9 },
  ],
  recentUsers: [
    { _id: '1', username: 'Priya Sharma', email: 'priya@gmail.com', gender: 'female', city: 'Mumbai', age: 24, verification_status: 'verified', createdAt: new Date().toISOString() },
    { _id: '2', username: 'Rahul Kumar', email: 'rahul@gmail.com', gender: 'male', city: 'Delhi', age: 27, verification_status: 'pending', createdAt: new Date().toISOString() },
    { _id: '3', username: 'Anjali Singh', email: 'anjali@gmail.com', gender: 'female', city: 'Bangalore', age: 22, verification_status: 'verified', createdAt: new Date().toISOString() },
    { _id: '4', username: 'Arjun Patel', email: 'arjun@gmail.com', gender: 'male', city: 'Ahmedabad', age: 29, verification_status: 'rejected', createdAt: new Date().toISOString() },
    { _id: '5', username: 'Sneha Reddy', email: 'sneha@gmail.com', gender: 'female', city: 'Hyderabad', age: 25, verification_status: 'verified', createdAt: new Date().toISOString() },
    { _id: '6', username: 'Vikram Nair', email: 'vikram@gmail.com', gender: 'male', city: 'Chennai', age: 31, verification_status: 'pending', createdAt: new Date().toISOString() },
    { _id: '7', username: 'Kavya Menon', email: 'kavya@gmail.com', gender: 'female', city: 'Kochi', age: 23, verification_status: 'verified', createdAt: new Date().toISOString() },
    { _id: '8', username: 'Amit Sharma', email: 'amit@gmail.com', gender: 'male', city: 'Pune', age: 28, verification_status: 'verified', createdAt: new Date().toISOString() },
  ],
};

function StatCard({ icon, iconBg, value, label, change, changeType, prefix = '', suffix = '' }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="stat-value">
            {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
          </div>
          <div className="stat-label">{label}</div>
          {change && (
            <div className={`stat-change ${changeType}`}>
              <i className={`bi ${changeType === 'up' ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}`} />
              {' '}{change}
            </div>
          )}
        </div>
        <div className="stat-icon" style={{ background: iconBg }}>
          <i className={icon} style={{ color: '#fff' }} />
        </div>
      </div>
    </div>
  );
}

const GENDER_COLORS = ['#1565c0', '#c62828'];

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
          <p key={i} style={{ margin: 0, color: p.color }}>
            {p.name}: {p.name === 'revenue' ? `₹${p.value.toLocaleString('en-IN')}` : p.value.toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

import { useAdminAuth } from '../context/AdminAuthContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useAdminAuth();

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAdminUpdate = (payload) => {
      console.log('[Dashboard] Real-time admin update:', payload);
      // Re-fetch dashboard data to ensure stats are perfectly in sync
      fetchDashboard(false);
    };

    socket.on('admin_update', handleAdminUpdate);
    return () => {
      socket.off('admin_update', handleAdminUpdate);
    };
  }, [socket]);

  const fetchDashboard = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await api.get('/admin/dashboard');
    setData(res.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border" role="status" />
        <span style={{ color: '#888', fontSize: 14 }}>Loading dashboard...</span>
      </div>
    );
  }

  const d = data || {};
  const stats = d.stats || {};
  const revenueData = stats.revenueByDay || [];
  const genderData = (stats.genderSplit || []).map(g => ({
    name: g.gender ? g.gender.charAt(0).toUpperCase() + g.gender.slice(1) : 'Unknown',
    value: parseInt(g.count, 10) || 0
  }));
  const messagesData = []; // Backend does not provide this yet
  const cityWiseUsers = (stats.cityWiseUsers || []).map(c => ({
    ...c,
    count: parseInt(c.count, 10) || parseInt(c.user_count, 10) || 0
  }));
  const recentUsers = stats.recentUsers || [];
  const maxCity = Math.max(...cityWiseUsers.map((c) => c.count), 1);

  const getStatusBadge = (status) => {
    const map = {
      verified: 'badge-verified',
      pending: 'badge-pending',
      rejected: 'badge-rejected',
      not_submitted: 'badge-inactive',
    };
    return map[status] || 'badge-inactive';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h4>Dashboard</h4>
          <div className="breadcrumb-text">Welcome back! Here&apos;s what&apos;s happening with SWAY today.</div>
        </div>
        <button className="btn-admin-primary" onClick={fetchDashboard}>
          <i className="bi bi-arrow-clockwise" />
          Refresh
        </button>
      </div>

      {/* ── Row 1: Primary Stats ── */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-people-fill"
            iconBg="linear-gradient(135deg, #1565c0, #1976d2)"
            value={stats.totalUsers}
            label="Total Users"
            change="12.5% this month"
            changeType="up"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-value">{stats.onlineNow?.toLocaleString('en-IN')}</div>
                <div className="stat-label">Online Now</div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span className="pulse-dot" />
                  <span style={{ color: '#4caf50', fontWeight: 600 }}>Live</span>
                </div>
              </div>
              <div
                className="stat-icon"
                style={{ background: 'linear-gradient(135deg, #2e7d32, #388e3c)' }}
              >
                <i className="bi bi-wifi" style={{ color: '#fff' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-shield-exclamation"
            iconBg="linear-gradient(135deg, #e65100, #f57c00)"
            value={stats.pendingVerifications}
            label="Pending Verifications"
            change="Needs attention"
            changeType="down"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-currency-rupee"
            iconBg="linear-gradient(135deg, #00695c, #00897b)"
            value={stats.todayRevenue}
            label="Today's Revenue"
            prefix="₹"
            change="8.3% vs yesterday"
            changeType="up"
          />
        </div>
      </div>

      {/* ── Row 2: Secondary Stats ── */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-patch-check-fill"
            iconBg="linear-gradient(135deg, #76000b, #e53935)"
            value={stats.totalVerified}
            label="Total Verified"
            change="64% of total"
            changeType="up"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-graph-up-arrow"
            iconBg="linear-gradient(135deg, #6a1b9a, #8e24aa)"
            value={stats.totalRevenue}
            label="Total Revenue"
            prefix="₹"
            change="All time"
            changeType="up"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-chat-dots-fill"
            iconBg="linear-gradient(135deg, #01579b, #0277bd)"
            value={stats.totalMessages}
            label="Total Messages"
            change="2,340 today"
            changeType="up"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            icon="bi-flag-fill"
            iconBg="linear-gradient(135deg, #b71c1c, #c62828)"
            value={stats.openReports}
            label="Open Reports"
            change="3 high priority"
            changeType="down"
          />
        </div>
      </div>

      {/* ── Row 3: Revenue + Gender Charts ── */}
      <div className="row g-3 mb-4">
        {/* Revenue Line Chart */}
        <div className="col-xl-8">
          <div className="chart-card" style={{ height: 360 }}>
            <div className="chart-title">Revenue Overview</div>
            <div className="chart-subtitle">Last 30 days revenue trend (₹)</div>
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#aaa' }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#aaa' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e53935" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#e53935" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#e53935"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#e53935' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Pie Chart */}
        <div className="col-xl-4">
          <div className="chart-card" style={{ height: 360 }}>
            <div className="chart-title">Gender Distribution</div>
            <div className="chart-subtitle">User base gender split</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => v.toLocaleString('en-IN')}
                  contentStyle={{
                    borderRadius: 10,
                    fontSize: 13,
                    fontFamily: 'Poppins',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  }}
                />
                <Legend
                  formatter={(v) => <span style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              {genderData.map((g, i) => {
                const pct = ((g.value / genderData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: '#f8f9fa',
                      borderRadius: 10,
                      padding: '10px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 700, color: GENDER_COLORS[i] }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{g.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Messages Bar + City Table ── */}
      <div className="row g-3 mb-4">
        {/* Messages Bar Chart */}
        <div className="col-xl-6">
          <div className="chart-card" style={{ height: 340 }}>
            <div className="chart-title">Messages Activity</div>
            <div className="chart-subtitle">Messages sent last 7 days</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={messagesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#aaa' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#aaa' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e53935" />
                    <stop offset="100%" stopColor="#76000b" />
                  </linearGradient>
                </defs>
                <Bar dataKey="messages" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City-wise Users */}
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
                      background: i < 3 ? '#e53935' : '#f5f5f5',
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
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{city.city}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e53935' }}>
                        {city.count?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="city-bar-track">
                      <div
                        className="city-bar"
                        style={{ width: `${(city.count / maxCity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 5: Recent Registrations ── */}
      <div className="table-card">
        <div className="table-card-header">
          <h6 className="table-card-title">
            <i className="bi bi-person-plus me-2" style={{ color: '#e53935' }} />
            Recent Registrations
          </h6>
          <button className="btn-admin-outline" onClick={() => navigate('/admin/users')}>
            View All <i className="bi bi-arrow-right ms-1" />
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>User</th>
                <th>Gender</th>
                <th>City</th>
                <th>Age</th>
                <th>Verification</th>
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
                        {(user.username || user.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1a1a2e' }}>
                          {user.username || user.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-status ${user.gender === 'female' ? 'badge-female' : 'badge-male'}`}>
                      {user.gender === 'female' ? '♀ Female' : '♂ Male'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#555' }}>
                      <i className="bi bi-geo-alt me-1" style={{ color: '#aaa' }} />
                      {user.city || '—'}
                    </span>
                  </td>
                  <td>{user.age || '—'}</td>
                  <td>
                    <span className={`badge-status ${getStatusBadge(user.verification_status)}`}>
                      {user.verification_status || 'not submitted'}
                    </span>
                  </td>
                  <td style={{ color: '#888' }}>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-IN', {
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
