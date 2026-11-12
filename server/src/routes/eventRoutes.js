const express = require('express');
const { getEvents, getEvent, getEventBySlug, getCategories, getSimilarEvents } = require('../controllers/eventController');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getEvents);
router.get('/slug/:slug', getEventBySlug);
router.get('/:id/similar', getSimilarEvents);
router.get('/:id', getEvent);

module.exports = router;
