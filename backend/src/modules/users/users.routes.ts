import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, coachOnly } from '../../common/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/users/parents - List all parents (coach only)
router.get('/parents', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;

    const parents = await prisma.parent.findMany({
      where: search ? {
        user: {
          OR: [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
          ],
        },
      } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        children: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json(parents);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/coaches - List all coaches (public or authenticated)
router.get('/coaches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coaches = await prisma.coach.findMany({
      where: {
        user: { isActive: true },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.json(coaches);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/dashboard/coach - Coach dashboard stats
router.get('/dashboard/coach', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      res.status(404).json({ error: 'Coach profile not found' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const [
      totalPlayers,
      activePlayers,
      upcomingSessions,
      todaySessions,
      pendingBookings,
      completedSessions,
      recentReports,
    ] = await Promise.all([
      prisma.player.count({ where: { coachId: coach.id } }),
      prisma.player.count({ where: { coachId: coach.id, isActive: true } }),
      prisma.session.count({
        where: {
          coachId: coach.id,
          date: { gte: today, lte: weekFromNow },
          status: 'SCHEDULED',
        },
      }),
      prisma.session.findMany({
        where: {
          coachId: coach.id,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: {
          bookings: {
            where: { status: { in: ['PENDING', 'CONFIRMED'] } },
            include: {
              player: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.booking.count({
        where: {
          session: { coachId: coach.id },
          status: 'PENDING',
        },
      }),
      prisma.session.count({
        where: {
          coachId: coach.id,
          status: 'COMPLETED',
        },
      }),
      prisma.sessionReport.findMany({
        where: { coachId: coach.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          player: {
            select: { firstName: true, lastName: true },
          },
          session: {
            select: { date: true },
          },
        },
      }),
    ]);

    res.json({
      stats: {
        totalPlayers,
        activePlayers,
        upcomingSessions,
        pendingBookings,
        completedSessions,
      },
      todaySessions,
      recentReports,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/dashboard/parent - Parent dashboard stats
router.get('/dashboard/parent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== Role.PARENT) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!parent) {
      res.status(404).json({ error: 'Parent profile not found' });
      return;
    }

    const today = new Date();

    const [
      children,
      upcomingBookings,
      completedSessions,
    ] = await Promise.all([
      prisma.player.findMany({
        where: { parentId: parent.id },
        include: {
          _count: {
            select: { achievements: true },
          },
          performanceMetrics: {
            orderBy: { measuredAt: 'desc' },
            take: 5,
            distinct: ['name'],
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          parentId: parent.id,
          status: { in: ['PENDING', 'CONFIRMED'] },
          session: { date: { gte: today } },
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
          player: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { session: { date: 'asc' } },
        take: 5,
      }),
      prisma.booking.count({
        where: {
          parentId: parent.id,
          status: 'COMPLETED',
        },
      }),
    ]);

    res.json({
      children,
      upcomingBookings,
      stats: {
        totalChildren: children.length,
        completedSessions,
        upcomingBookingsCount: upcomingBookings.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
