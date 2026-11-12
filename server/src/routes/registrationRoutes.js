const express = require('express');
const { registerForEvent, getMyRegistrations } = require('../controllers/registrationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, registerForEvent);
router.get('/my-registrations', authenticateToken, getMyRegistrations);

module.exports = router;
