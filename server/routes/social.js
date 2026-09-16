'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// ─── BLOCKS ───────────────────────────────────────────────────────────────────

// GET /api/social/blocks
router.get('/blocks', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.id, b.created_at, u.id as user_id, u.username, u.profile_photo, u.city
      FROM blocks b JOIN users u ON u.id = b.blocked_id
      WHERE b.blocker_id = $1 ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json({ blocks: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/social/block
router.post('/block', verifyToken, async (req, res) => {
  const { user_id, reason } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  try {
    await pool.query(
      'INSERT INTO blocks (blocker_id, blocked_id, reason) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [req.user.id, user_id, reason]
    );
    // Remove any match between them
    const uid1 = Math.min(req.user.id, user_id);
    const uid2 = Math.max(req.user.id, user_id);
    await pool.query('UPDATE matches SET is_active = false WHERE user1_id = $1 AND user2_id = $2', [uid1, uid2]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/social/block/:userId
router.delete('/block/:userId', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2', [req.user.id, req.params.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── MUTES ────────────────────────────────────────────────────────────────────

router.post('/mute', verifyToken, async (req, res) => {
  const { user_id } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM mutes WHERE muter_id=$1 AND muted_id=$2', [req.user.id, user_id]);
    if (existing.rows.length) {
      await pool.query('DELETE FROM mutes WHERE muter_id=$1 AND muted_id=$2', [req.user.id, user_id]);
      return res.json({ muted: false });
    }
    await pool.query('INSERT INTO mutes (muter_id, muted_id) VALUES ($1,$2)', [req.user.id, user_id]);
    res.json({ muted: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── FOLLOW ───────────────────────────────────────────────────────────────────

router.post('/follow', verifyToken, async (req, res) => {
  const { user_id } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM followers WHERE follower_id=$1 AND following_id=$2', [req.user.id, user_id]);
    if (existing.rows.length) {
      await pool.query('DELETE FROM followers WHERE follower_id=$1 AND following_id=$2', [req.user.id, user_id]);
      return res.json({ following: false });
    }
    await pool.query('INSERT INTO followers (follower_id, following_id) VALUES ($1,$2)', [req.user.id, user_id]);
    res.json({ following: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/followers', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.profile_photo, u.city, f.created_at
      FROM followers f JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = $1 ORDER BY f.created_at DESC
    `, [req.user.id]);
    res.json({ followers: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/following', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.profile_photo, u.city, f.created_at
      FROM followers f JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = $1 ORDER BY f.created_at DESC
    `, [req.user.id]);
    res.json({ following: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── REPORT ───────────────────────────────────────────────────────────────────

router.post('/report', verifyToken, async (req, res) => {
  const { reported_id, reason, description } = req.body;
  if (!reported_id || !reason) return res.status(400).json({ error: 'reported_id and reason required' });
  try {
    await pool.query(
      'INSERT INTO reports (reporter_id, reported_id, reason, description) VALUES ($1,$2,$3,$4)',
      [req.user.id, reported_id, reason, description]
    );
    res.json({ success: true, message: 'Report submitted. Our team will review it.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
