import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireCoach } from '../../common/middleware/auth';
import { AppError } from '../../common/middleware/error';

const router = Router();

router.use(authenticate);
router.use(requireCoach);

// GET /api/sessions - Get sessions with date range
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, status } = req.query;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const sessions = await prisma.session.findMany({
      where: {
        coachId: coach.id,
        ...(from && to && {
          date: {
            gte: new Date(from as string),
            lte: new Date(to as string),
          },
        }),
        ...(status && { status: status as any }),
      },
      include: {
        players: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id - Get single session
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const session = await prisma.session.findFirst({
      where: { id, coachId: coach.id },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        playerNotes: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions - Create session
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const {
      date,
      startTime,
      endTime,
      title,
      location,
      type = 'INDIVIDUAL',
      objectives,
      notes,
      playerIds = [],
    } = req.body;

    if (!date || !startTime || !endTime || !location) {
      throw new AppError('Date, time, and location are required', 400);
    }

    const session = await prisma.session.create({
      data: {
        coachId: coach.id,
        date: new Date(date),
        startTime,
        endTime,
        title,
        location,
        type,
        objectives,
        notes,
        players: {
          create: playerIds.map((playerId: string) => ({
            playerId,
          })),
        },
      },
      include: {
        players: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// PUT /api/sessions/:id - Update session
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const existingSession = await prisma.session.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingSession) {
      throw new AppError('Session not found', 404);
    }

    const {
      date,
      startTime,
      endTime,
      title,
      location,
      type,
      status,
      objectives,
      notes,
      report,
      rating,
      playerIds,
    } = req.body;

    // Update session
    const session = await prisma.session.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        startTime,
        endTime,
        title,
        location,
        type,
        status,
        objectives,
        notes,
        report,
        rating,
      },
    });

    // Update players if provided
    if (playerIds !== undefined) {
      // Remove existing players
      await prisma.sessionPlayer.deleteMany({
        where: { sessionId: id },
      });

      // Add new players
      if (playerIds.length > 0) {
        await prisma.sessionPlayer.createMany({
          data: playerIds.map((playerId: string) => ({
            sessionId: id,
            playerId,
          })),
        });
      }
    }

    // Fetch updated session with relations
    const updatedSession = await prisma.session.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedSession);
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/report - Add session report with player notes
router.post('/:id/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { report, rating, playerFeedback = [] } = req.body;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const session = await prisma.session.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    // Update session with report
    await prisma.session.update({
      where: { id },
      data: {
        report,
        rating,
        status: 'COMPLETED',
      },
    });

    // Add individual player feedback as notes
    for (const feedback of playerFeedback) {
      if (feedback.content) {
        await prisma.playerNote.create({
          data: {
            playerId: feedback.playerId,
            sessionId: id,
            content: feedback.content,
            type: 'SESSION_REPORT',
          },
        });
      }

      // Update session player attendance and rating
      await prisma.sessionPlayer.updateMany({
        where: {
          sessionId: id,
          playerId: feedback.playerId,
        },
        data: {
          attended: feedback.attended ?? true,
          feedback: feedback.content,
          rating: feedback.rating,
        },
      });
    }

    res.json({ message: 'Report saved successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const session = await prisma.session.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    await prisma.session.delete({ where: { id } });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// AVAILABILITY SLOTS
// ============================================

// GET /api/sessions/availability - Get coach availability
router.get('/availability/slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const slots = await prisma.availabilitySlot.findMany({
      where: { coachId: coach.id, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.json(slots);
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/availability - Create availability slot
router.post('/availability/slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const { dayOfWeek, startTime, endTime, specificDate, isRecurring = true, location } = req.body;

    const slot = await prisma.availabilitySlot.create({
      data: {
        coachId: coach.id,
        dayOfWeek,
        startTime,
        endTime,
        specificDate: specificDate ? new Date(specificDate) : null,
        isRecurring,
        location,
      },
    });

    res.status(201).json(slot);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sessions/availability/:id - Delete availability slot
router.delete('/availability/slots/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const slot = await prisma.availabilitySlot.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!slot) {
      throw new AppError('Availability slot not found', 404);
    }

    await prisma.availabilitySlot.delete({ where: { id } });

    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
