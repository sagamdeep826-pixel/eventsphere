const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Register for an event.
 * Handles transaction: checks capacity, decreases seatsLeft, creates registration, ticket.
 */
const registerForEvent = async (req, res) => {
  try {
    const { eventId, teamName, teamMembers } = req.body;
    const userId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Use transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch event and check capacity
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { id: true, seatsLeft: true, isTeamEvent: true, minTeamSize: true, maxTeamSize: true }
      });

      if (!event) throw new Error('EVENT_NOT_FOUND');
      if (event.seatsLeft <= 0) throw new Error('EVENT_FULL');

      // 2. Check if already registered
      const existing = await tx.registration.findUnique({
        where: { eventId_userId: { eventId, userId } }
      });
      if (existing) throw new Error('ALREADY_REGISTERED');

      // 3. Create Registration
      const registration = await tx.registration.create({
        data: {
          eventId,
          userId,
          status: 'CONFIRMED',
          teamName,
          teamMembers: teamMembers ? JSON.stringify(teamMembers) : null
        }
      });

      // 4. Create Ticket
      const ticket = await tx.ticket.create({
        data: {
          registrationId: registration.id,
          qrCode: crypto.randomBytes(16).toString('hex')
        }
      });

      // 5. Decrement seats
      await tx.event.update({
        where: { id: eventId },
        data: { seatsLeft: { decrement: 1 } }
      });

      return { registration, ticket };
    });

    res.status(201).json({
      message: 'Registration successful',
      registration: result.registration,
      ticket: result.ticket
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Event not found' });
    if (error.message === 'EVENT_FULL') return res.status(400).json({ error: 'Event is full' });
    if (error.message === 'ALREADY_REGISTERED') return res.status(400).json({ error: 'You are already registered for this event' });
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

/**
 * Get user registrations
 */
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          select: { id: true, title: true, slug: true, schedule: true, venue: true, posterUrl: true, price: true, isTeamEvent: true }
        },
        ticket: true,
        seat: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ registrations });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { registerForEvent, getMyRegistrations };
