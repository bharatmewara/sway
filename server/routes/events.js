'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/events - List events
router.get('/', verifyToken, async (req, res) => {
  const { type, city, country, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let query = `
      SELECT e.*, 
             u.username as organizer_name,
             u.profile_photo as organizer_photo,
             EXISTS(SELECT 1 FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = $1) as has_rsvp
      FROM events e
      JOIN users u ON u.id = e.organizer_id
      WHERE e.is_active = true AND e.starts_at > NOW()
    `;
    const params = [req.user.id];
    let paramIdx = 2;

    if (type) { query += ` AND e.event_type = $${paramIdx++}`; params.push(type); }
    if (city) { query += ` AND e.city ILIKE $${paramIdx++}`; params.push(`%${city}%`); }
    if (country) { query += ` AND e.country ILIKE $${paramIdx++}`; params.push(`%${country}%`); }

    query += ` ORDER BY e.starts_at ASC LIMIT $${paramIdx++} OFFSET $${paramIdx}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ events: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const event = await pool.query(`
      SELECT e.*, u.username as organizer_name,
             EXISTS(SELECT 1 FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = $1) as has_rsvp
      FROM events e JOIN users u ON u.id = e.organizer_id WHERE e.id = $2
    `, [req.user.id, req.params.id]);
    
    if (!event.rows.length) return res.status(404).json({ error: 'Event not found' });
    
    const attendees = await pool.query(`
      SELECT u.id, u.username, u.profile_photo, ea.rsvp_status
      FROM event_attendees ea JOIN users u ON u.id = ea.user_id
      WHERE ea.event_id = $1 LIMIT 50
    `, [req.params.id]);

    res.json({ event: event.rows[0], attendees: attendees.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events - Create event
router.post('/', verifyToken, async (req, res) => {
  const { title, description, event_type, location_name, city, country, online_link, starts_at, ends_at, max_attendees } = req.body;
  if (!title || !starts_at) return res.status(400).json({ error: 'Title and start date required' });
  try {
    const result = await pool.query(`
      INSERT INTO events (organizer_id, title, description, event_type, location_name, city, country, online_link, starts_at, ends_at, max_attendees)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [req.user.id, title, description, event_type || 'local', location_name, city, country, online_link, starts_at, ends_at, max_attendees]);
    res.json({ event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', verifyToken, async (req, res) => {
  const { rsvp_status = 'going' } = req.body;
  try {
    const event = await pool.query('SELECT max_attendees, attendee_count FROM events WHERE id = $1', [req.params.id]);
    if (!event.rows.length) return res.status(404).json({ error: 'Event not found' });

    if (event.rows[0].max_attendees && event.rows[0].attendee_count >= event.rows[0].max_attendees) {
      return res.status(409).json({ error: 'Event is full' });
    }

    await pool.query(`
      INSERT INTO event_attendees (event_id, user_id, rsvp_status)
      VALUES ($1, $2, $3)
      ON CONFLICT (event_id, user_id) DO UPDATE SET rsvp_status = EXCLUDED.rsvp_status
    `, [req.params.id, req.user.id, rsvp_status]);

    await pool.query('UPDATE events SET attendee_count = (SELECT COUNT(*) FROM event_attendees WHERE event_id = $1 AND rsvp_status = \'going\') WHERE id = $1', [req.params.id]);

    res.json({ success: true, rsvp_status });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
