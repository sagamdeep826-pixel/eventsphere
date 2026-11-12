const { PrismaClient } = require('@prisma/client');
const { analyzeOrganizerInsights } = require('../services/aiService');

const prisma = new PrismaClient();

// GET /api/organizer/dashboard
const getOrganizerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const whereClause = isAdmin ? {} : { organizerId: userId };

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        category: true,
        organizer: { select: { id: true, name: true, email: true } },
        registrations: {
          include: {
            user: { select: { id: true, name: true, email: true, studentProfile: true } },
            ticket: true,
            seat: true
          }
        },
        feedbacks: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { registrations: true, feedbacks: true, communityPosts: true }
        }
      },
      orderBy: { schedule: 'asc' }
    });

    let totalRegistrations = 0;
    let totalRevenue = 0;
    let totalCheckIns = 0;
    let allFeedbacks = [];

    const enrichedEvents = await Promise.all(
      events.map(async (ev) => {
        const regCount = ev.registrations.length;
        const checkedInCount = ev.registrations.filter((r) => r.ticket?.isUsed).length;
        const revenue = regCount * (ev.price || 0);

        totalRegistrations += regCount;
        totalRevenue += revenue;
        totalCheckIns += checkedInCount;
        allFeedbacks = allFeedbacks.concat(ev.feedbacks);

        const insights = await analyzeOrganizerInsights(ev, ev.feedbacks);

        return {
          ...ev,
          stats: {
            registrations: regCount,
            checkedIn: checkedInCount,
            revenue,
            fillRate: ev.maxSeats > 0 ? Math.round((regCount / ev.maxSeats) * 100) : 0
          },
          insights
        };
      })
    );

    const overallAvgRating =
      allFeedbacks.length > 0
        ? +(allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length).toFixed(2)
        : 4.8;

    res.json({
      summary: {
        totalEvents: events.length,
        totalRegistrations,
        totalCheckIns,
        totalRevenue,
        averageRating: overallAvgRating,
        attendanceRate: totalRegistrations > 0 ? Math.round((totalCheckIns / totalRegistrations) * 100) : 0
      },
      events: enrichedEvents
    });
  } catch (error) {
    console.error('getOrganizerDashboard error:', error);
    res.status(500).json({ error: 'Failed to load organizer dashboard' });
  }
};

// POST /api/organizer/events
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      schedule,
      venue,
      isOnline,
      isTeamEvent,
      minTeamSize,
      maxTeamSize,
      maxSeats,
      price,
      rules,
      prize,
      posterUrl,
      categoryId
    } = req.body;

    if (!title || !description || !schedule || !venue || !categoryId) {
      return res.status(400).json({ error: 'Title, description, schedule, venue, and category are required' });
    }

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const defaultLayout = await prisma.venueLayout.findFirst();

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description,
        schedule: new Date(schedule),
        venue,
        isOnline: Boolean(isOnline),
        isTeamEvent: Boolean(isTeamEvent),
        minTeamSize: parseInt(minTeamSize) || 1,
        maxTeamSize: parseInt(maxTeamSize) || 1,
        maxSeats: parseInt(maxSeats) || 50,
        seatsLeft: parseInt(maxSeats) || 50,
        price: parseFloat(price) || 0.0,
        rules: rules || 'Standard university event guidelines apply.',
        prize: prize || 'Certificates & Merit Badges',
        posterUrl:
          posterUrl ||
          'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
        status: 'PUBLISHED',
        organizerId: req.user.id,
        categoryId,
        venueLayoutId: !isOnline && defaultLayout ? defaultLayout.id : null
      },
      include: { category: true }
    });

    res.status(201).json({ message: 'Event created and published!', event });
  } catch (error) {
    console.error('createEvent error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// PATCH /api/organizer/events/:id/status
const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.event.update({
      where: { id },
      data: { status }
    });

    res.json({ message: `Event status updated to ${status}`, event: updated });
  } catch (error) {
    console.error('updateEventStatus error:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
};

// POST /api/organizer/events/:id/certificates
const issueEventCertificates = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, resultType = 'PARTICIPANT', title } = req.body;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (userId) {
      const cert = await prisma.certificate.create({
        data: {
          userId,
          eventId: id,
          resultType,
          title: title || `Certificate of ${resultType === 'WINNER' ? 'Excellence' : 'Participation'} - ${event.title}`,
          certificateUrl: `https://eventsphere.edu/certificates/${id}-${userId.slice(0, 6)}.pdf`
        }
      });
      return res.status(201).json({ message: 'Certificate issued', certificate: cert });
    }

    // Bulk issue to all confirmed registrants
    const registrations = await prisma.registration.findMany({
      where: { eventId: id, status: 'CONFIRMED' }
    });

    let issuedCount = 0;
    for (const reg of registrations) {
      const existing = await prisma.certificate.findFirst({
        where: { eventId: id, userId: reg.userId }
      });
      if (!existing) {
        await prisma.certificate.create({
          data: {
            userId: reg.userId,
            eventId: id,
            resultType: 'PARTICIPANT',
            title: `Certificate of Participation - ${event.title}`,
            certificateUrl: `https://eventsphere.edu/certificates/${id}-${reg.userId.slice(0, 6)}.pdf`
          }
        });
        issuedCount++;
      }
    }

    res.json({ message: `Issued ${issuedCount} new certificates for ${event.title}`, issuedCount });
  } catch (error) {
    console.error('issueEventCertificates error:', error);
    res.status(500).json({ error: 'Failed to issue certificates' });
  }
};

module.exports = {
  getOrganizerDashboard,
  createEvent,
  updateEventStatus,
  issueEventCertificates
};
