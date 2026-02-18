import prisma from '../../database/prisma';
import { AppError } from '../../common/middleware/error';
import { SessionStatus, SessionType, Prisma } from '@prisma/client';

interface CreateSlotDTO {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  isRecurring?: boolean;
  specificDate?: Date;
  maxPlayers?: number;
  coachId: string;
}

interface CreateSessionDTO {
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  type?: SessionType;
  maxParticipants?: number;
  notes?: string;
  coachId: string;
  slotId?: string;
}

export const sessionService = {
  // ============================================
  // AVAILABILITY SLOTS
  // ============================================

  async createSlot(data: CreateSlotDTO) {
    const slot = await prisma.availabilitySlot.create({
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        isRecurring: data.isRecurring ?? true,
        specificDate: data.specificDate,
        maxPlayers: data.maxPlayers ?? 1,
        coachId: data.coachId,
      },
    });

    return slot;
  },

  async getSlots(coachId: string) {
    const slots = await prisma.availabilitySlot.findMany({
      where: { coachId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return slots;
  },

  async updateSlot(id: string, coachId: string, data: Partial<CreateSlotDTO>) {
    const existing = await prisma.availabilitySlot.findUnique({ where: { id } });
    
    if (!existing || existing.coachId !== coachId) {
      throw new AppError('Slot not found or not authorized', 404);
    }

    const slot = await prisma.availabilitySlot.update({
      where: { id },
      data,
    });

    return slot;
  },

  async deleteSlot(id: string, coachId: string) {
    const existing = await prisma.availabilitySlot.findUnique({ where: { id } });
    
    if (!existing || existing.coachId !== coachId) {
      throw new AppError('Slot not found or not authorized', 404);
    }

    await prisma.availabilitySlot.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  },

  // ============================================
  // SESSIONS
  // ============================================

  async createSession(data: CreateSessionDTO) {
    const session = await prisma.session.create({
      data: {
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        type: data.type ?? SessionType.INDIVIDUAL,
        maxParticipants: data.maxParticipants ?? 1,
        notes: data.notes,
        coachId: data.coachId,
        slotId: data.slotId,
      },
      include: {
        bookings: {
          include: {
            player: true,
          },
        },
      },
    });

    return session;
  },

  async getSessions(coachId: string, options?: {
    status?: SessionStatus;
    from?: Date;
    to?: Date;
    limit?: number;
  }) {
    const where: Prisma.SessionWhereInput = {
      coachId,
      ...(options?.status && { status: options.status }),
      ...(options?.from && { date: { gte: options.from } }),
      ...(options?.to && { date: { lte: options.to } }),
    };

    const sessions = await prisma.session.findMany({
      where,
      take: options?.limit || 100,
      orderBy: { date: 'asc' },
      include: {
        bookings: {
          include: {
            player: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
        _count: {
          select: { bookings: true, sessionReports: true },
        },
      },
    });

    return sessions;
  },

  async getUpcomingSessions(coachId: string, limit = 10) {
    const sessions = await prisma.session.findMany({
      where: {
        coachId,
        date: { gte: new Date() },
        status: { in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] },
      },
      take: limit,
      orderBy: { date: 'asc' },
      include: {
        bookings: {
          where: { status: { in: ['PENDING', 'CONFIRMED'] } },
          include: {
            player: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    return sessions;
  },

  async getSessionById(id: string) {
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        coach: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        bookings: {
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
        },
        sessionReports: {
          include: {
            player: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    return session;
  },

  async updateSession(id: string, coachId: string, data: Partial<CreateSessionDTO>) {
    const existing = await prisma.session.findUnique({ where: { id } });
    
    if (!existing || existing.coachId !== coachId) {
      throw new AppError('Session not found or not authorized', 404);
    }

    const session = await prisma.session.update({
      where: { id },
      data,
      include: {
        bookings: {
          include: { player: true },
        },
      },
    });

    return session;
  },

  async updateSessionStatus(id: string, coachId: string, status: SessionStatus) {
    const existing = await prisma.session.findUnique({ where: { id } });
    
    if (!existing || existing.coachId !== coachId) {
      throw new AppError('Session not found or not authorized', 404);
    }

    const session = await prisma.session.update({
      where: { id },
      data: { status },
    });

    // If completed, update all pending bookings to completed
    if (status === SessionStatus.COMPLETED) {
      await prisma.booking.updateMany({
        where: { sessionId: id, status: 'CONFIRMED' },
        data: { status: 'COMPLETED' },
      });
    }

    return session;
  },

  async cancelSession(id: string, coachId: string) {
    const existing = await prisma.session.findUnique({ where: { id } });
    
    if (!existing || existing.coachId !== coachId) {
      throw new AppError('Session not found or not authorized', 404);
    }

    const session = await prisma.session.update({
      where: { id },
      data: { status: SessionStatus.CANCELLED },
    });

    // Cancel all bookings
    await prisma.booking.updateMany({
      where: { sessionId: id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    return session;
  },

  // Get available sessions for booking (parent view)
  async getAvailableSessions(options?: {
    from?: Date;
    to?: Date;
    location?: string;
  }) {
    const where: Prisma.SessionWhereInput = {
      status: SessionStatus.SCHEDULED,
      date: { gte: options?.from || new Date() },
      ...(options?.to && { date: { lte: options.to } }),
      ...(options?.location && { location: { contains: options.location, mode: 'insensitive' } }),
    };

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        coach: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    // Filter to only sessions with available spots
    return sessions.filter(s => s._count.bookings < s.maxParticipants);
  },

  // Generate sessions from recurring slots
  async generateSessionsFromSlots(coachId: string, weeksAhead = 4) {
    const slots = await prisma.availabilitySlot.findMany({
      where: { coachId, isActive: true, isRecurring: true },
    });

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + weeksAhead * 7);

    const sessions: any[] = [];

    for (const slot of slots) {
      let current = new Date(today);
      
      // Find first occurrence of this day of week
      while (current.getDay() !== slot.dayOfWeek) {
        current.setDate(current.getDate() + 1);
      }

      while (current <= endDate) {
        // Check if session already exists
        const existing = await prisma.session.findFirst({
          where: {
            coachId,
            date: current,
            startTime: slot.startTime,
          },
        });

        if (!existing) {
          const session = await prisma.session.create({
            data: {
              coachId,
              slotId: slot.id,
              date: new Date(current),
              startTime: slot.startTime,
              endTime: slot.endTime,
              location: slot.location,
              maxParticipants: slot.maxPlayers,
              type: slot.maxPlayers > 1 ? SessionType.GROUP : SessionType.INDIVIDUAL,
            },
          });
          sessions.push(session);
        }

        current.setDate(current.getDate() + 7);
      }
    }

    return { created: sessions.length, sessions };
  },
};
