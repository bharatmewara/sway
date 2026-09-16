'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Simple AI features (rule-based suggestions)

const iceBreakerTemplates = [
  "What's your favorite travel destination and why?",
  "If you could have dinner with anyone, alive or dead, who would it be?",
  "What's one thing on your bucket list you're determined to do?",
  "Do you have a hidden talent? What is it?",
  "What's the most spontaneous thing you've ever done?",
  "What song are you currently obsessed with?",
  "Beach or mountains? And what's your ideal day there?",
  "What's a movie or show you could watch over and over?",
  "If you could instantly master any skill, what would it be?",
  "What does your perfect weekend look like?",
  "What's the best meal you've ever had?",
  "What's something most people don't know about you?",
];

const bioTemplates = [
  "Adventure seeker and coffee lover based in {city}. I believe in authentic connections and late-night conversations. {interests_line} Looking for someone who matches my energy.",
  "Life's too short for boring conversations. Based in {city}, I'm into {interests_line} When I'm not working, you'll find me exploring new places or trying new restaurants.",
  "Genuine, passionate, and always up for something new. {city} local who loves {interests_line} Let's skip the small talk and dive into something real.",
];

// GET /api/ai/icebreaker/:userId
router.get('/icebreaker/:userId', verifyToken, async (req, res) => {
  try {
    const them = await pool.query('SELECT interests, city, hobbies FROM users WHERE id = $1', [req.params.userId]);
    const me = await pool.query('SELECT interests FROM users WHERE id = $1', [req.user.id]);
    
    if (!them.rows.length) return res.status(404).json({ error: 'User not found' });

    const suggestions = [];
    
    // Personalized based on shared interests
    if (them.rows[0].interests && me.rows[0].interests) {
      const theirInterests = them.rows[0].interests.split(',').map(s => s.trim()).filter(Boolean);
      const myInterests = me.rows[0].interests.split(',').map(s => s.trim()).filter(Boolean);
      const common = theirInterests.filter(x => myInterests.some(y => y.toLowerCase() === x.toLowerCase()));
      if (common.length > 0) {
        suggestions.push(`I noticed we're both into ${common[0]} — what got you started with that?`);
      }
    }

    // Add random templates
    const shuffled = [...iceBreakerTemplates].sort(() => Math.random() - 0.5).slice(0, 4);
    suggestions.push(...shuffled);

    res.json({ suggestions: suggestions.slice(0, 5) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/ai/bio - Generate AI bio
router.post('/bio', verifyToken, async (req, res) => {
  try {
    const user = await pool.query('SELECT city, interests, hobbies, profession FROM users WHERE id=$1', [req.user.id]);
    const u = user.rows[0];
    
    const interestsList = [u.interests, u.hobbies].filter(Boolean).join(', ');
    const interestsLine = interestsList ? `passionate about ${interestsList}` : 'exploring new experiences';
    
    const template = bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
    const bio = template
      .replace('{city}', u.city || 'my city')
      .replace('{interests_line}', interestsLine)
      .replace(/\s+/g, ' ').trim();

    // Generate 3 variations
    const bios = bioTemplates.map(t => 
      t.replace('{city}', u.city || 'my city')
       .replace('{interests_line}', interestsLine)
       .replace(/\s+/g, ' ').trim()
    );

    res.json({ bios });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/ai/compatibility/:userId
router.get('/compatibility/:userId', verifyToken, async (req, res) => {
  try {
    const me = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    const them = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.userId]);
    
    if (!them.rows.length) return res.status(404).json({ error: 'User not found' });

    const myProfile = me.rows[0];
    const theirProfile = them.rows[0];

    // Detailed compatibility breakdown
    const breakdown = {
      location: myProfile.city === theirProfile.city ? 100 : myProfile.state === theirProfile.state ? 60 : 30,
      lifestyle: 50,
      values: 50,
      interests: 50,
    };

    if (myProfile.drinking && theirProfile.drinking && myProfile.drinking === theirProfile.drinking) breakdown.lifestyle += 25;
    if (myProfile.smoking && theirProfile.smoking && myProfile.smoking === theirProfile.smoking) breakdown.lifestyle += 25;
    if (myProfile.religion && theirProfile.religion && myProfile.religion === theirProfile.religion) breakdown.values += 30;
    
    const myInterests = (myProfile.interests || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    const theirInterests = (theirProfile.interests || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    const common = myInterests.filter(x => theirInterests.includes(x));
    if (common.length > 0) {
      breakdown.interests = Math.min(50 + common.length * 10, 100);
    }

    const overall = Math.round(
      breakdown.location * 0.2 + breakdown.lifestyle * 0.3 + breakdown.values * 0.25 + breakdown.interests * 0.25
    );

    const report = {
      overall,
      breakdown,
      common_interests: common,
      analysis: overall > 75 ? 'Excellent match! You have a lot in common.' :
                 overall > 55 ? 'Good compatibility. Worth exploring!' :
                 'Different backgrounds can make for interesting conversations.',
    };

    res.json({ compatibility: report });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/ai/chat-suggestion - AI chat response suggestion
router.post('/chat-suggestion', verifyToken, async (req, res) => {
  const { last_message } = req.body;
  
  const suggestions = [];
  const msg = (last_message || '').toLowerCase();

  if (msg.includes('hey') || msg.includes('hello') || msg.includes('hi')) {
    suggestions.push("Hey! How's your day going? 😊", "Hi there! Nice to connect with you!", "Hello! What brings you here today?");
  } else if (msg.includes('travel') || msg.includes('trip')) {
    suggestions.push("Oh I love traveling! Where was your last trip?", "I've been wanting to explore Southeast Asia, have you been?");
  } else if (msg.includes('work') || msg.includes('job')) {
    suggestions.push("That sounds interesting! Do you enjoy what you do?", "Work-life balance is so important. How do you manage it?");
  } else {
    suggestions.push("That's really interesting! Tell me more.", "I'd love to hear your perspective on that!", "What made you think about that?");
  }

  res.json({ suggestions });
});

// GET /api/ai/translate
router.post('/translate', verifyToken, async (req, res) => {
  // Stub — would integrate with Google Translate API
  const { text, target_language = 'en' } = req.body;
  res.json({ translated: text, note: 'Translation requires Google Translate API key in production.' });
});

module.exports = router;
