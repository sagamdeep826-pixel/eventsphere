const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: parse JSON fields safely
const parseJson = (val, fallback = []) => {
  if (!val) return fallback;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

// GET /api/events?q=&category=&price=&online=&sort=&page=&limit=
const getEvents = async (req, res) => {
  try {
    const {
      q, category, price, online, sort, page = 1, limit = 20
    } = req.query;

    const where = { status: 'PUBLISHED' };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { rules: { contains: q } },
        { prize: { contains: q } },
        { organizer: { name: { contains: q } } }
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (price === 'free') {
      where.price = { equals: 0 };
    } else if (price === 'paid') {
      where.price = { gt: 0 };
    }

    if (online === 'true') {
      where.isOnline = true;
    } else if (online === 'false') {
      where.isOnline = false;
    }

    let orderBy = {};
    switch (sort) {
      case 'date_asc':  orderBy = { schedule: 'asc' }; break;
      case 'date_desc': orderBy = { schedule: 'desc' }; break;
      case 'price_asc':  orderBy = { price: 'asc' }; break;
      case 'price_desc': orderBy = { price: 'desc' }; break;
      case 'popular':    orderBy = { createdAt: 'desc' }; break;
      default:           orderBy = { schedule: 'asc' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          category: true,
          organizer: { select: { id: true, name: true, email: true } },
          _count: { select: { registrations: true } }
        }
      }),
      prisma.event.count({ where })
    ]);

    const eventsWithSeats = events.map(e => ({
      ...e,
      registrationCount: e._count.registrations
    }));

    res.json({
      events: eventsWithSeats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('getEvents error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// GET /api/events/:id
const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
        organizer: { select: { id: true, name: true, email: true } },
        venueLayout: true,
        communityPosts: {
          include: { user: { select: { id: true, name: true } }, comments: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ ...event, communityPosts: event.communityPosts });
  } catch (error) {
    console.error('getEvent error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// GET /api/events/slug/:slug
const getEventBySlug = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        organizer: { select: { id: true, name: true, email: true } },
        venueLayout: true,
        communityPosts: {
          include: { user: { select: { id: true, name: true } }, comments: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ ...event, communityPosts: event.communityPosts });
  } catch (error) {
    console.error('getEventBySlug error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// GET /api/events/:id/similar
const getSimilarEvents = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      select: { categoryId: true, id: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const similar = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        categoryId: event.categoryId,
        id: { not: event.id }
      },
      take: 6,
      include: {
        category: true,
        organizer: { select: { id: true, name: true } },
        _count: { select: { registrations: true } }
      }
    });

    res.json(similar.map(e => ({ ...e, registrationCount: e._count.registrations })));
  } catch (error) {
    console.error('getSimilarEvents error:', error);
    res.status(500).json({ error: 'Failed to fetch similar events' });
  }
};

module.exports = {
  getEvents,
  getEvent,
  getEventBySlug,
  getCategories,
  getSimilarEvents
};