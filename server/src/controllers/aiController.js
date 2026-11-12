const { PrismaClient } = require('@prisma/client');
const { getRecommendations, compareEvents, askAssistant } = require('../services/aiService');

const prisma = new PrismaClient();

// GET /api/ai/recommendations
const getEventRecommendations = async (req, res) => {
  try {
    let studentProfile = null;
    let pastRegistrations = [];

    if (req.user && req.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { studentProfile: true, registrations: true }
      });
      studentProfile = user?.studentProfile || null;
      pastRegistrations = user?.registrations || [];
    }

    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        category: true,
        organizer: { select: { id: true, name: true } }
      },
      orderBy: { schedule: 'asc' }
    });

    const result = await getRecommendations(studentProfile, events, pastRegistrations);
    res.json(result);
  } catch (error) {
    console.error('AI Recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

// POST /api/ai/compare
const compareTwoEvents = async (req, res) => {
  try {
    const { eventAId, eventBId } = req.body;
    if (!eventAId || !eventBId) {
      return res.status(400).json({ error: 'Both eventAId and eventBId are required' });
    }

    const [eventA, eventB] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventAId }, include: { category: true, organizer: { select: { name: true } } } }),
      prisma.event.findUnique({ where: { id: eventBId }, include: { category: true, organizer: { select: { name: true } } } })
    ]);

    if (!eventA || !eventB) {
      return res.status(404).json({ error: 'One or both events not found' });
    }

    let studentProfile = null;
    if (req.user && req.user.id) {
      studentProfile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    }

    const comparison = await compareEvents(eventA, eventB, studentProfile);
    res.json(comparison);
  } catch (error) {
    console.error('AI Compare error:', error);
    res.status(500).json({ error: 'Failed to compare events' });
  }
};

// POST /api/ai/chat
const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      include: { category: true },
      orderBy: { schedule: 'asc' },
      take: 20
    });

    const response = await askAssistant(message, events, req.user || null);
    res.json(response);
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'Failed to process AI chat query' });
  }
};

module.exports = {
  getEventRecommendations,
  compareTwoEvents,
  chatWithAI
};
