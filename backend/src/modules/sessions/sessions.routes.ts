import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireCoach } from '../../common/middleware/auth';

const router = Router();

// Helper to get coach from user
async function getCoach(userId: string) {
  return prisma.coach.findUnique({ where: { userId } });
}

// Get all sessions for coach
router.get('/', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const { from, to } = req.query;

    const where: any = { coachId: coach.id };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        players: {
          include: {
            player: true,
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

// Get single session
router.get('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const session = await prisma.session.findFirst({
      where: { id, coachId: coach.id },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        playerNotes: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Create session
router.post('/', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const {
      title,
      date,
      startTime,
      endTime,
      location,
      type,
      objectives,
      notes,
      playerIds,
    } = req.body;

    const session = await prisma.session.create({
      data: {
        title,
        date: new Date(date),
        startTime,
        endTime,
        location,
        type: type || 'INDIVIDUAL',
        objectives,
        notes,
        coachId: coach.id,
        players: {
          create: (playerIds || []).map((playerId: string) => ({
            playerId,
          })),
        },
      },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// Update session
router.put('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const {
      title,
      date,
      startTime,
      endTime,
      location,
      type,
      objectives,
      notes,
    } = req.body;

    const existingSession = await prisma.session.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = await prisma.session.update({
      where: { id },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        location,
        type,
        objectives,
        notes,
      },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Submit session report
router.post('/:id/report', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const { report, rating, playerFeedback } = req.body;

    const existingSession = await prisma.session.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingSession) {
      return res.status(404).json({ error: 'Session not found' });
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

    // Update player feedback and create notes
    if (playerFeedback && Array.isArray(playerFeedback)) {
      for (const feedback of playerFeedback) {
        // Update session player record
        await prisma.sessionPlayer.updateMany({
          where: {
            sessionId: id,
            playerId: feedback.playerId,
          },
          data: {
            attended: feedback.attended ?? true,
            rating: feedback.rating,
            feedback: feedback.content,
          },
        });

        // Create player note if there's content
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
      }
    }

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Delete session
router.delete('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const session = await prisma.session.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.session.delete({ where: { id } });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get availability slots
router.get('/availability/slots', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const slots = await prisma.availabilitySlot.findMany({
      where: { coachId: coach.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.json(slots);
  } catch (error) {
    next(error);
  }
});

// Create availability slot
router.post('/availability/slots', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const { dayOfWeek, startTime, endTime } = req.body;

    const slot = await prisma.availabilitySlot.create({
      data: {
        dayOfWeek,
        startTime,
        endTime,
        coachId: coach.id,
      },
    });

    res.status(201).json(slot);
  } catch (error) {
    next(error);
  }
});

// Delete availability slot
router.delete('/availability/slots/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const slot = await prisma.availabilitySlot.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    await prisma.availabilitySlot.delete({ where: { id } });

    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
