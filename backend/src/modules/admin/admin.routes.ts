import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireAdmin } from '../../common/middleware/auth';

const router = Router();

// Middleware: All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/overview - Get admin dashboard overview
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalCoaches,
      totalPlayers,
      totalParents,
      totalSessions,
      recentBookings,
    ] = await Promise.all([
      prisma.coach.count(),
      prisma.player.count(),
      prisma.parent.count(),
      prisma.session.count(),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    // Get coaches with subscription status (mock for now, will integrate with Stripe)
    const activeSubscriptions = await prisma.coach.count({
      where: {
        // Add subscription field later
      },
    });

    res.json({
      totalCoaches,
      totalPlayers,
      totalParents,
      totalSessions,
      recentBookings,
      activeSubscriptions,
      revenue: 0, // Will be calculated from Stripe
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/coaches - Get all coaches with details
router.get('/coaches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coaches = await prisma.coach.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            isActive: true,
          },
        },
        players: {
          select: {
            id: true,
          },
        },
        sessions: {
          select: {
            id: true,
          },
        },
        sessionReports: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate average rating for each coach (from session reports)
    const coachesWithStats = await Promise.all(
      coaches.map(async (coach) => {
        // Get average ratings from session reports
        const avgRatings = await prisma.sessionReport.aggregate({
          where: { coachId: coach.id },
          _avg: {
            effortRating: true,
            focusRating: true,
            technicalRating: true,
          },
        });

        const avgRating = avgRatings._avg.effortRating 
          ? ((avgRatings._avg.effortRating + (avgRatings._avg.focusRating || 0) + (avgRatings._avg.technicalRating || 0)) / 3).toFixed(1)
          : null;

        return {
          id: coach.id,
          email: coach.user.email,
          firstName: coach.user.firstName,
          lastName: coach.user.lastName,
          isActive: coach.user.isActive,
          createdAt: coach.user.createdAt,
          playersCount: coach.players.length,
          sessionsCount: coach.sessions.length,
          reportsCount: coach.sessionReports.length,
          avgRating,
          subscription: {
            status: 'trial', // Mock - will integrate with Stripe
            plan: 'free',
            expiresAt: null,
          },
        };
      })
    );

    res.json(coachesWithStats);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/coaches/:id - Get single coach details
router.get('/coaches/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            createdAt: true,
            isActive: true,
          },
        },
        players: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        sessions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        sessionReports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            player: true,
            session: true,
          },
        },
      },
    });

    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    res.json(coach);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/players - Get all players
router.get('/players', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const players = await prisma.player.findMany({
      include: {
        coach: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        parent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            sessionReports: true,
            bookings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(players);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/subscriptions - Get subscription overview
router.get('/subscriptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This will be expanded when Stripe is integrated
    const coaches = await prisma.coach.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Mock subscription data
    const subscriptions = coaches.map((coach) => ({
      coachId: coach.id,
      email: coach.user.email,
      name: `${coach.user.firstName} ${coach.user.lastName}`,
      plan: 'free',
      status: 'trial',
      startDate: coach.createdAt,
      endDate: null,
      amount: 0,
    }));

    res.json({
      subscriptions,
      summary: {
        total: subscriptions.length,
        active: 0,
        trial: subscriptions.length,
        cancelled: 0,
        monthlyRevenue: 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/coaches/:id/status - Toggle coach active status
router.patch('/coaches/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const coach = await prisma.coach.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    await prisma.user.update({
      where: { id: coach.userId },
      data: { isActive },
    });

    res.json({ success: true, isActive });
  } catch (error) {
    next(error);
  }
});

export default router;
