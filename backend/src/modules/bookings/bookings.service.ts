import prisma from '../../database/prisma';
import { AppError } from '../../common/middleware/error';
import { BookingStatus, Prisma } from '@prisma/client';

interface CreateBookingDTO {
  sessionId: string;
  playerId: string;
  parentId: string;
  notes?: string;
}

export const bookingService = {
  async create(data: CreateBookingDTO) {
    // Check if session exists and has capacity
    const session = await prisma.session.findUnique({
      where: { id: data.sessionId },
      include: {
        _count: { select: { bookings: true } },
      },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.status !== 'SCHEDULED') {
      throw new AppError('Session is not available for booking', 400);
    }

    if (session._count.bookings >= session.maxParticipants) {
      throw new AppError('Session is fully booked', 400);
    }

    // Verify player belongs to parent
    const player = await prisma.player.findUnique({
      where: { id: data.playerId },
    });

    if (!player || player.parentId !== data.parentId) {
      throw new AppError('Player not found or not authorized', 403);
    }

    // Check for existing booking
    const existing = await prisma.booking.findUnique({
      where: {
        sessionId_playerId: {
          sessionId: data.sessionId,
          playerId: data.playerId,
        },
      },
    });

    if (existing) {
      throw new AppError('Player already booked for this session', 400);
    }

    const booking = await prisma.booking.create({
      data: {
        sessionId: data.sessionId,
        playerId: data.playerId,
        parentId: data.parentId,
        notes: data.notes,
        status: BookingStatus.PENDING,
      },
      include: {
        session: {
          include: {
            coach: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        player: true,
      },
    });

    return booking;
  },

  async findByParent(parentId: string, options?: {
    status?: BookingStatus;
    upcoming?: boolean;
  }) {
    const where: Prisma.BookingWhereInput = {
      parentId,
      ...(options?.status && { status: options.status }),
      ...(options?.upcoming && {
        session: { date: { gte: new Date() } },
      }),
    };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { session: { date: 'asc' } },
      include: {
        session: {
          include: {
            coach: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        player: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    return bookings;
  },

  async findBySession(sessionId: string) {
    const bookings = await prisma.booking.findMany({
      where: { sessionId },
      include: {
        player: true,
        parent: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
      },
    });

    return bookings;
  },

  async findById(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            coach: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        player: true,
        parent: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    return booking;
  },

  async confirm(id: string, coachId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.session.coachId !== coachId) {
      throw new AppError('Not authorized', 403);
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError('Booking cannot be confirmed', 400);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
      include: {
        session: true,
        player: true,
      },
    });

    return updated;
  },

  async cancel(id: string, userId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        session: true,
        parent: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Verify authorization
    if (userRole === 'COACH') {
      const coach = await prisma.coach.findUnique({ where: { userId } });
      if (booking.session.coachId !== coach?.id) {
        throw new AppError('Not authorized', 403);
      }
    } else if (userRole === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId } });
      if (booking.parentId !== parent?.id) {
        throw new AppError('Not authorized', 403);
      }
    }

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new AppError('Booking cannot be cancelled', 400);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    return updated;
  },

  async markNoShow(id: string, coachId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.session.coachId !== coachId) {
      throw new AppError('Not authorized', 403);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.NO_SHOW },
    });

    return updated;
  },

  async getPendingBookings(coachId: string) {
    const bookings = await prisma.booking.findMany({
      where: {
        session: { coachId },
        status: BookingStatus.PENDING,
      },
      include: {
        session: true,
        player: true,
        parent: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
      orderBy: { bookedAt: 'asc' },
    });

    return bookings;
  },
};
