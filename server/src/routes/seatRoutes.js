const express = require('express');
const {
  getEventSeats,
  allocateSeat,
  verifyTicketAndLogAttendance,
  getEventAttendanceLogs
} = require('../controllers/seatController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Seats endpoints
router.get('/event/:eventId', getEventSeats);
router.post('/allocate', authenticateToken, allocateSeat);

// Attendance verification endpoints
router.post('/verify', authenticateToken, requireRole(['ORGANIZER', 'ADMIN']), verifyTicketAndLogAttendance);
router.get('/logs/:eventId', authenticateToken, requireRole(['ORGANIZER', 'ADMIN']), getEventAttendanceLogs);

module.exports = router;
