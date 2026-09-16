'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storiesDir = path.join(__dirname, '../../uploads/stories');
if (!fs.existsSync(storiesDir)) fs.mkdirSync(storiesDir, { recursive: true });

const storyUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, storiesDir),
    filename: (req, file, cb) => cb(null, `story_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for videos
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    cb(null, allowed.includes(file.mimetype));
  },
}).single('media');


// GET /api/stories - Get stories from people you follow + yourself
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT 
        u.id as user_id, u.username, u.profile_photo,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', s.id,
            'media_url', s.media_url,
            'media_type', s.media_type,
            'caption', s.caption,
            'view_count', s.view_count,
            'created_at', s.created_at,
            'has_viewed', EXISTS(SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = $1)
          ) ORDER BY s.created_at ASC
        ) as stories,
        COUNT(s.id) as story_count,
        BOOL_AND(EXISTS(SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = $1)) as all_viewed
      FROM stories s
      JOIN users u ON u.id = s.user_id
      WHERE s.expires_at > NOW()
        AND s.user_id != $1
        AND (
          s.user_id IN (SELECT following_id FROM followers WHERE follower_id = $1)
          OR s.user_id IN (SELECT user1_id FROM matches WHERE user2_id = $1
                           UNION SELECT user2_id FROM matches WHERE user1_id = $1)
        )
      GROUP BY u.id, u.username, u.profile_photo
      ORDER BY all_viewed ASC, MAX(s.created_at) DESC
    `, [userId]);

    // Own stories
    const ownStories = await pool.query(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) as view_count
      FROM stories s WHERE s.user_id = $1 AND s.expires_at > NOW()
      ORDER BY s.created_at ASC
    `, [userId]);

    res.json({ stories: result.rows, my_stories: ownStories.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/stories - Create story
router.post('/', verifyToken, storyUpload, async (req, res) => {
  const { caption, duration = 5 } = req.body;
  const mediaFile = req.file;
  if (!mediaFile) return res.status(400).json({ error: 'Media file required' });

  try {
    const mediaType = mediaFile.mimetype.startsWith('video') ? 'video' : 'image';
    const result = await pool.query(`
      INSERT INTO stories (user_id, media_url, media_type, caption, duration)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [req.user.id, mediaFile.filename, mediaType, caption, duration]);

    res.json({ story: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/stories/:id/view - Record story view
router.post('/:id/view', verifyToken, async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO story_views (story_id, viewer_id) VALUES ($1, $2)
      ON CONFLICT (story_id, viewer_id) DO NOTHING
    `, [req.params.id, req.user.id]);

    await pool.query('UPDATE stories SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stories/:id/viewers
router.get('/:id/viewers', verifyToken, async (req, res) => {
  try {
    // Only story owner can see viewers
    const story = await pool.query('SELECT user_id FROM stories WHERE id = $1', [req.params.id]);
    if (!story.rows.length || story.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const viewers = await pool.query(`
      SELECT u.id, u.username, u.profile_photo, sv.viewed_at
      FROM story_views sv JOIN users u ON u.id = sv.viewer_id
      WHERE sv.story_id = $1 ORDER BY sv.viewed_at DESC
    `, [req.params.id]);
    res.json({ viewers: viewers.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/stories/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM stories WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
