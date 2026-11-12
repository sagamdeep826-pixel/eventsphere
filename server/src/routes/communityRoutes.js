const express = require('express');
const {
  getCommunityPosts,
  createCommunityPost,
  addComment,
  submitFeedback,
  getEventFeedbacks,
  getStudentPortfolio,
  updateStudentProfile
} = require('../controllers/communityController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Community posts & comments
router.get('/posts', getCommunityPosts);
router.post('/posts', authenticateToken, createCommunityPost);
router.post('/posts/:postId/comments', authenticateToken, addComment);

// Event Feedback
router.get('/feedback/:eventId', getEventFeedbacks);
router.post('/feedback', authenticateToken, submitFeedback);

// Student Portfolio & Profile
router.get('/portfolio', authenticateToken, getStudentPortfolio);
router.get('/portfolio/:userId', getStudentPortfolio);
router.put('/profile', authenticateToken, updateStudentProfile);

module.exports = router;
