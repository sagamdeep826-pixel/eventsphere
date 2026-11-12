const express = require('express');
const jwt = require('jsonwebtoken');
const { getEventRecommendations, compareTwoEvents, chatWithAI } = require('../controllers/aiController');

const router = express.Router();

// Optional auth middleware so both logged-in students and guests can use AI tools
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET || 'eventsphere_super_secret_jwt_key_2026', (err, user) => {
    if (!err && user) req.user = user;
    next();
  });
};

router.get('/recommendations', optionalAuth, getEventRecommendations);
router.post('/compare', optionalAuth, compareTwoEvents);
router.post('/chat', optionalAuth, chatWithAI);

module.exports = router;
