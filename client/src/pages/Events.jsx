import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState({ type: '', city: '' });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_type: 'local', city: '', starts_at: '', ends_at: '', location_name: '' });
  const { user } = useAuth();

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.city) params.append('city', filter.city);
      const res = await api.get(`/events?${params}`);
      setEvents(res.data.events);
    } catch {}
  };

  useEffect(() => { load(); }, [filter]);

  const rsvp = async (id, status) => {
    try {
      await api.post(`/events/${id}/rsvp`, { rsvp_status: status });
      toast.success(status === 'going' ? "You're going! 🎉" : "RSVP updated");
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', form);
      toast.success('Event created!');
      setCreating(false);
      load();
    } catch { toast.error('Failed to create event'); }
  };

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 className="fw-bold mb-0">🎪 Events</h3>
        <button className="btn btn-wine rounded-pill px-4" onClick={() => setCreating(!creating)}>
          {creating ? 'Cancel' : '+ Create Event'}
        </button>
      </div>

      {/* Create Event Form */}
      {creating && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <h5 className="fw-bold mb-3">Create New Event</h5>
          <form onSubmit={createEvent} className="row g-3">
            <div className="col-md-6">
              <input className="form-control" placeholder="Event Title *" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="col-md-6">
              <select className="form-select" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                <option value="local">Local Meetup</option>
                <option value="online">Online Event</option>
                <option value="meetup">Casual Meetup</option>
              </select>
            </div>
            <div className="col-12">
              <textarea className="form-control" placeholder="Description" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="col-md-6">
              <input className="form-control" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="col-md-6">
              <input className="form-control" placeholder="Venue Name" value={form.location_name} onChange={e => setForm({ ...form, location_name: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label small text-muted">Start Date/Time *</label>
              <input className="form-control" type="datetime-local" required value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label small text-muted">End Date/Time</label>
              <input className="form-control" type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-wine px-5 rounded-pill">Create Event</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="d-flex gap-3 flex-wrap mb-4">
        <div className="d-flex gap-2">
          {['', 'local', 'online', 'meetup'].map(t => (
            <button
              key={t}
              className={`filter-chip ${filter.type === t ? 'active' : ''}`}
              onClick={() => setFilter(f => ({ ...f, type: t }))}
            >
              {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <input
          className="form-control" placeholder="Filter by city..." style={{ maxWidth: 200 }}
          value={filter.city}
          onChange={e => setFilter(f => ({ ...f, city: e.target.value }))}
        />
      </div>

      {/* Events Grid */}
      <div className="row g-4">
        {events.map(event => (
          <div key={event.id} className="col-md-6 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
              <div className="p-4">
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <span className={`badge rounded-pill ${event.event_type === 'online' ? 'bg-primary' : event.event_type === 'meetup' ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {event.event_type === 'online' ? '💻 Online' : event.event_type === 'meetup' ? '☕ Meetup' : '📍 Local'}
                  </span>
                  <small className="text-muted">{event.attendee_count} going</small>
                </div>
                <h5 className="fw-bold mb-2">{event.title}</h5>
                {event.description && <p className="text-muted small mb-3 text-truncate">{event.description}</p>}
                <div className="mb-3">
                  <p className="text-muted small mb-1">
                    <i className="bi bi-calendar3 me-1"></i>
                    {new Date(event.starts_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {new Date(event.starts_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {event.city && (
                    <p className="text-muted small mb-0">
                      <i className="bi bi-geo-alt me-1"></i>{event.location_name || event.city}
                    </p>
                  )}
                </div>
                <p className="text-muted small mb-3">
                  <i className="bi bi-person me-1"></i>By {event.organizer_name}
                </p>
                {event.has_rsvp ? (
                  <div className="d-flex gap-2">
                    <button className="btn btn-success btn-sm rounded-pill flex-grow-1" disabled>✓ Going</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => rsvp(event.id, 'not_going')}>Cancel</button>
                  </div>
                ) : (
                  <div className="d-flex gap-2">
                    <button className="btn btn-wine btn-sm rounded-pill flex-grow-1" onClick={() => rsvp(event.id, 'going')}>I'm Going</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => rsvp(event.id, 'maybe')}>Maybe</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-12 text-center py-5 text-muted">
            <div style={{ fontSize: 64 }}>🎪</div>
            <h5>No events yet</h5>
            <p>Be the first to create an event!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
