const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Helper: Ensure seats are generated in DB for an event with a venueLayout
 */
const ensureEventSeats = async (event) => {
  if (!event.venueLayoutId || !event.venueLayout) return [];

  const existingSeats = await prisma.seat.findMany({
    where: { eventId: event.id },
    orderBy: [{ rowNumber: 'asc' }, { colNumber: 'asc' }]
  });

  if (existingSeats.length > 0) {
    return existingSeats;
  }

  let layoutMeta = {};
  try {
    layoutMeta = JSON.parse(event.venueLayout.layoutData || '{}');
  } catch {
    layoutMeta = {};
  }

  const accessibleRows = Array.isArray(layoutMeta.accessibleRows) ? layoutMeta.accessibleRows : [0];
  const seatsToCreate = [];

  for (let r = 0; r < event.venueLayout.rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    for (let c = 1; c <= event.venueLayout.columns; c++) {
      seatsToCreate.push({
        eventId: event.id,
        venueLayoutId: event.venueLayoutId,
        rowNumber: r,
        colNumber: c,
        seatLabel: `${rowLetter}${c}`,
        isBooked: false,
        isAccessible: accessibleRows.includes(r)
      });
    }
  }

  await prisma.seat.createMany({ data: seatsToCreate });

  return prisma.seat.findMany({
    where: { eventId: event.id },
    orderBy: [{ rowNumber: 'asc' }, { colNumber: 'asc' }]
  });
};

// GET /api/seats/event/:eventId
const getEventSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { venueLayout: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.venueLayout) {
      return res.json({
        eventId: event.id,
        hasLayout: false,
        seats: []
      });
    }

    const seats = await ensureEventSeats(event);
    res.json({
      eventId: event.id,
      hasLayout: true,
      layout: event.venueLayout,
      seats
    });
  } catch (error) {
    console.error('getEventSeats error:', error);
    res.status(500).json({ error: 'Failed to load seat map' });
  }
};

// POST /api/seats/allocate
const allocateSeat = async (req, res) => {
  try {
    const { eventId, seatLabel, autoAllocate, requireAccessible } = req.body;
    const userId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { venueLayout: true }
    });

    if (!event || !event.venueLayout) {
      return res.status(400).json({ error: 'This event does not use a seated venue layout' });
    }

    // Ensure registration exists for this student
    const registration = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId } },
      include: { seat: true }
    });

    if (!registration) {
      return res.status(400).json({ error: 'You must register for the event before selecting a seat' });
    }

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    await ensureEventSeats(event);

    // If user already had a seat, release it first so they can switch
    if (registration.seat) {
      await prisma.seat.update({
        where: { id: registration.seat.id },
        data: { isBooked: false, registrationId: null, studentId: null }
      });
    }

    let targetSeat = null;

    if (seatLabel && !autoAllocate) {
      targetSeat = await prisma.seat.findFirst({
        where: { eventId, seatLabel }
      });
      if (!targetSeat) {
        return res.status(404).json({ error: `Seat ${seatLabel} not found` });
      }
      if (targetSeat.isBooked) {
        return res.status(400).json({ error: `Seat ${seatLabel} is already booked` });
      }
    } else {
      // Smart auto-allocation: pick best available front-center or accessible seat
      const availableSeats = await prisma.seat.findMany({
        where: {
          eventId,
          isBooked: false,
          ...(requireAccessible ? { isAccessible: true } : {})
        },
        orderBy: [{ rowNumber: 'asc' }, { colNumber: 'asc' }]
      });

      if (availableSeats.length === 0) {
        return res.status(400).json({ error: 'No matching available seats left' });
      }

      targetSeat = availableSeats[0];
    }

    const updatedSeat = await prisma.seat.update({
      where: { id: targetSeat.id },
      data: {
        isBooked: true,
        registrationId: registration.id,
        studentId: studentProfile ? studentProfile.id : null
      }
    });

    res.json({
      message: `Seat ${updatedSeat.seatLabel} allocated successfully`,
      seat: updatedSeat
    });
  } catch (error) {
    console.error('allocateSeat error:', error);
    res.status(500).json({ error: 'Failed to allocate seat' });
  }
};

// POST /api/attendance/verify
const verifyTicketAndLogAttendance = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const scannedBy = req.user?.name || req.user?.email || 'Organizer Scanner';

    if (!qrCode) {
      return res.status(400).json({ error: 'QR code is required' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { qrCode: qrCode.trim() },
      include: {
        registration: {
          include: {
            user: { select: { id: true, name: true, email: true, studentProfile: true } },
            event: { select: { id: true, title: true, schedule: true, venue: true } },
            seat: true
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        valid: false,
        status: 'INVALID',
        message: 'Invalid QR Ticket Code — No matching ticket found.'
      });
    }

    if (ticket.isUsed) {
      const dupLog = await prisma.attendanceLog.create({
        data: {
          ticketId: ticket.id,
          scannedBy,
          status: 'DUPLICATE'
        }
      });

      return res.status(400).json({
        valid: false,
        status: 'DUPLICATE',
        message: `Ticket already scanned at ${ticket.usedAt ? new Date(ticket.usedAt).toLocaleString() : 'an earlier time'}.`,
        ticket,
        log: dupLog
      });
    }

    // Mark ticket as used and create attendance log + certificate if not already issued
    const now = new Date();
    const [updatedTicket, log] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { isUsed: true, usedAt: now }
      }),
      prisma.attendanceLog.create({
        data: {
          ticketId: ticket.id,
          scannedBy,
          status: 'SUCCESS'
        }
      })
    ]);

    res.json({
      valid: true,
      status: 'SUCCESS',
      message: 'Check-in verified! Attendee admitted.',
      attendee: ticket.registration.user,
      event: ticket.registration.event,
      seat: ticket.registration.seat,
      ticket: updatedTicket,
      log
    });
  } catch (error) {
    console.error('verifyTicket error:', error);
    res.status(500).json({ error: 'Failed to verify ticket' });
  }
};

// GET /api/attendance/event/:eventId
const getEventAttendanceLogs = async (req, res) => {
  try {
    const { eventId } = req.params;

    const logs = await prisma.attendanceLog.findMany({
      where: {
        ticket: {
          registration: { eventId }
        }
      },
      include: {
        ticket: {
          include: {
            registration: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                seat: true
              }
            }
          }
        }
      },
      orderBy: { scannedAt: 'desc' }
    });

    res.json({ logs });
  } catch (error) {
    console.error('getEventAttendanceLogs error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance logs' });
  }
};

module.exports = {
  getEventSeats,
  allocateSeat,
  verifyTicketAndLogAttendance,
  getEventAttendanceLogs
};
