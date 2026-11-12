const express = require('express');
const {
  getOrganizerDashboard,
  createEvent,
  updateEventStatus,
  issueEventCertificates
} = require('../controllers/organizerController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticateToken, requireRole(['ORGANIZER', 'ADMIN']), getOrganizerDashboard);
router.post('/events', authenticateToken, requireRole(['ORGANIZER', 'ADMIN']), createEvent);
router.patch('/events/:id/status', authenticateToken, requireRole(['ORGANIZER', 'ADMIN']), updateEventStatus);
router.post('/events/:id/certificates', authenticateToken, requireRole(['ORGANIZER', 'ADMIN']), issueEventCertificates);

module.exports = router;
