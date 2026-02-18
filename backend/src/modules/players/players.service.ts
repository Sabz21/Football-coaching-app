import prisma from '../../database/prisma';
import { AppError } from '../../common/middleware/error';
import { Prisma } from '@prisma/client';

interface CreatePlayerDTO {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  position?: string;
  preferredFoot?: string;
  height?: number;
  weight?: number;
  notes?: string;
  parentId?: string;
  coachId: string;
}

interface UpdatePlayerDTO extends Partial<CreatePlayerDTO> {}

export const playerService = {
  async create(data: CreatePlayerDTO) {
    const player = await prisma.player.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        position: data.position,
        preferredFoot: data.preferredFoot,
        height: data.height,
        weight: data.weight,
        notes: data.notes,
        parentId: data.parentId,
        coachId: data.coachId,
      },
      include: {
        parent: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    return player;
  },

  async findAll(coachId: string, options?: {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.PlayerWhereInput = {
      coachId,
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
      ...(options?.search && {
        OR: [
          { firstName: { contains: options.search, mode: 'insensitive' } },
          { lastName: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        take: options?.limit || 50,
        skip: options?.offset || 0,
        orderBy: { firstName: 'asc' },
        include: {
          parent: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true, phone: true },
              },
            },
          },
          _count: {
            select: {
              sessionReports: true,
              achievements: true,
            },
          },
        },
      }),
      prisma.player.count({ where }),
    ]);

    return { players, total };
  },

  async findById(id: string, coachId?: string) {
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        parent: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
        coach: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        performanceMetrics: {
          orderBy: { measuredAt: 'desc' },
          take: 20,
        },
        achievements: {
          orderBy: { earnedAt: 'desc' },
        },
        sessionReports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            session: true,
          },
        },
      },
    });

    if (!player) {
      throw new AppError('Player not found', 404);
    }

    // Verify coach access if coachId provided
    if (coachId && player.coachId !== coachId) {
      throw new AppError('Not authorized to access this player', 403);
    }

    return player;
  },

  async findByParent(parentId: string) {
    const players = await prisma.player.findMany({
      where: { parentId },
      include: {
        coach: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: {
            sessionReports: true,
            achievements: true,
            bookings: true,
          },
        },
      },
    });

    return players;
  },

  async update(id: string, coachId: string, data: UpdatePlayerDTO) {
    // Verify ownership
    const existing = await prisma.player.findUnique({ where: { id } });
    
    if (!existing) {
      throw new AppError('Player not found', 404);
    }
    
    if (existing.coachId !== coachId) {
      throw new AppError('Not authorized to update this player', 403);
    }

    const player = await prisma.player.update({
      where: { id },
      data,
      include: {
        parent: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    return player;
  },

  async delete(id: string, coachId: string) {
    // Verify ownership
    const existing = await prisma.player.findUnique({ where: { id } });
    
    if (!existing) {
      throw new AppError('Player not found', 404);
    }
    
    if (existing.coachId !== coachId) {
      throw new AppError('Not authorized to delete this player', 403);
    }

    // Soft delete
    await prisma.player.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  },

  async assignToParent(playerId: string, parentId: string, coachId: string) {
    // Verify coach ownership
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    
    if (!player || player.coachId !== coachId) {
      throw new AppError('Player not found or not authorized', 404);
    }

    // Verify parent exists
    const parent = await prisma.parent.findUnique({ where: { id: parentId } });
    
    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: { parentId },
      include: {
        parent: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    return updated;
  },

  async getStatsSummary(playerId: string) {
    const [
      sessionsCount,
      latestMetrics,
      achievements,
      recentReports,
    ] = await Promise.all([
      prisma.booking.count({
        where: { playerId, status: 'COMPLETED' },
      }),
      prisma.performanceMetric.findMany({
        where: { playerId },
        orderBy: { measuredAt: 'desc' },
        distinct: ['name'],
        take: 10,
      }),
      prisma.achievement.count({
        where: { playerId },
      }),
      prisma.sessionReport.findMany({
        where: { playerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          session: true,
        },
      }),
    ]);

    return {
      totalSessions: sessionsCount,
      achievementsCount: achievements,
      latestMetrics,
      recentReports,
    };
  },
};
