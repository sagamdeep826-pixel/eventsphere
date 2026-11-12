const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/community/posts?eventId=&tag=
const getCommunityPosts = async (req, res) => {
  try {
    const { eventId, tag } = req.query;
    const where = {};

    if (eventId) where.eventId = eventId;
    if (tag) where.tags = { contains: tag };

    const posts = await prisma.communityPost.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true, studentProfile: true } },
        event: { select: { id: true, title: true, slug: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: [{ isAnnouncement: 'desc' }, { createdAt: 'desc' }]
    });

    res.json({ posts });
  } catch (error) {
    console.error('getCommunityPosts error:', error);
    res.status(500).json({ error: 'Failed to load community posts' });
  }
};

// POST /api/community/posts
const createCommunityPost = async (req, res) => {
  try {
    const { eventId, title, content, isAnnouncement, tags } = req.body;
    if (!eventId || !content) {
      return res.status(400).json({ error: 'eventId and content are required' });
    }

    const canAnnounce = ['ORGANIZER', 'ADMIN'].includes(req.user.role);

    const post = await prisma.communityPost.create({
      data: {
        eventId,
        userId: req.user.id,
        title: title || null,
        content,
        isAnnouncement: canAnnounce ? Boolean(isAnnouncement) : false,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : tags || JSON.stringify(['Discussion'])
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        event: { select: { id: true, title: true, slug: true } },
        comments: true
      }
    });

    res.status(201).json({ message: 'Post published', post });
  } catch (error) {
    console.error('createCommunityPost error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

// POST /api/community/posts/:postId/comments
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: req.user.id,
        content: content.trim()
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });

    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    console.error('addComment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// POST /api/community/feedback
const submitFeedback = async (req, res) => {
  try {
    const { eventId, rating, tags, comment } = req.body;
    const userId = req.user.id;

    if (!eventId || !rating) {
      return res.status(400).json({ error: 'eventId and rating (1-5) are required' });
    }

    const numericRating = Math.min(5, Math.max(1, parseInt(rating)));

    const feedback = await prisma.feedback.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: {
        rating: numericRating,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : tags || JSON.stringify(['content']),
        comment: comment || ''
      },
      create: {
        eventId,
        userId,
        rating: numericRating,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : tags || JSON.stringify(['content']),
        comment: comment || ''
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ message: 'Feedback saved! Thank you.', feedback });
  } catch (error) {
    console.error('submitFeedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

// GET /api/community/feedback/:eventId
const getEventFeedbacks = async (req, res) => {
  try {
    const { eventId } = req.params;
    const feedbacks = await prisma.feedback.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ feedbacks });
  } catch (error) {
    console.error('getEventFeedbacks error:', error);
    res.status(500).json({ error: 'Failed to fetch event feedbacks' });
  }
};

// GET /api/community/portfolio
const getStudentPortfolio = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        studentProfile: true,
        certificates: {
          include: {
            event: { include: { category: true } }
          },
          orderBy: { issuedAt: 'desc' }
        },
        registrations: {
          include: {
            event: { include: { category: true } },
            ticket: true,
            seat: true
          },
          orderBy: { createdAt: 'desc' }
        },
        feedbacks: true,
        communityPosts: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalEventsRegistered = user.registrations.length;
    const attendedEvents = user.registrations.filter((r) => r.ticket?.isUsed).length;
    const certificatesEarned = user.certificates.length;
    const winsCount = user.certificates.filter((c) => ['WINNER', 'RUNNER_UP'].includes(c.resultType)).length;

    // Group categories for skill breakdown
    const categoryBreakdown = {};
    user.registrations.forEach((r) => {
      const catName = r.event?.category?.name || 'General';
      categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + 1;
    });

    res.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentProfile: user.studentProfile
      },
      stats: {
        totalEventsRegistered,
        attendedEvents,
        certificatesEarned,
        winsCount,
        communityContributions: user.communityPosts.length + user.feedbacks.length,
        categoryBreakdown
      },
      certificates: user.certificates,
      registrations: user.registrations
    });
  } catch (error) {
    console.error('getStudentPortfolio error:', error);
    res.status(500).json({ error: 'Failed to load student portfolio' });
  }
};

// PUT /api/community/profile
const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { college, branch, year, interests, skills, preferredTypes } = req.body;

    const updated = await prisma.studentProfile.upsert({
      where: { userId },
      update: {
        ...(college ? { college } : {}),
        ...(branch ? { branch } : {}),
        ...(year ? { year: parseInt(year) } : {}),
        ...(interests ? { interests: JSON.stringify(interests) } : {}),
        ...(skills ? { skills: JSON.stringify(skills) } : {}),
        ...(preferredTypes ? { preferredTypes: JSON.stringify(preferredTypes) } : {})
      },
      create: {
        userId,
        college: college || 'State University of Technology',
        branch: branch || 'Computer Science',
        year: parseInt(year) || 3,
        interests: JSON.stringify(interests || ['Coding', 'AI']),
        skills: JSON.stringify(skills || ['JavaScript', 'Python']),
        preferredTypes: JSON.stringify(preferredTypes || ['hackathon', 'workshop'])
      }
    });

    res.json({ message: 'Profile updated', studentProfile: updated });
  } catch (error) {
    console.error('updateStudentProfile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  getCommunityPosts,
  createCommunityPost,
  addComment,
  submitFeedback,
  getEventFeedbacks,
  getStudentPortfolio,
  updateStudentProfile
};
