import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireCoach } from '../../common/middleware/auth';
import { AppError } from '../../common/middleware/error';

const router = Router();

router.use(authenticate);
router.use(requireCoach);

// GET /api/notes/player/:playerId - Get all notes for a player
router.get('/player/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { playerId } = req.params;
    const { type, limit = '50' } = req.query;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    // Verify player belongs to coach
    const player = await prisma.player.findFirst({
      where: { id: playerId, coachId: coach.id },
    });

    if (!player) {
      throw new AppError('Player not found', 404);
    }

    const notes = await prisma.playerNote.findMany({
      where: {
        playerId,
        ...(type && { type: type as any }),
      },
      include: {
        session: {
          select: {
            id: true,
            date: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(notes);
  } catch (error) {
    next(error);
  }
});

// POST /api/notes - Create a note
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { playerId, content, type = 'GENERAL', sessionId } = req.body;

    if (!playerId || !content) {
      throw new AppError('Player ID and content are required', 400);
    }

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    // Verify player belongs to coach
    const player = await prisma.player.findFirst({
      where: { id: playerId, coachId: coach.id },
    });

    if (!player) {
      throw new AppError('Player not found', 404);
    }

    // If sessionId provided, verify session belongs to coach
    if (sessionId) {
      const session = await prisma.session.findFirst({
        where: { id: sessionId, coachId: coach.id },
      });
      if (!session) {
        throw new AppError('Session not found', 404);
      }
    }

    const note = await prisma.playerNote.create({
      data: {
        playerId,
        content,
        type,
        sessionId,
      },
      include: {
        session: {
          select: {
            id: true,
            date: true,
            title: true,
            type: true,
          },
        },
      },
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// PUT /api/notes/:id - Update a note
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content, type } = req.body;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    // Verify note belongs to a player of this coach
    const note = await prisma.playerNote.findUnique({
      where: { id },
      include: { player: true },
    });

    if (!note || note.player.coachId !== coach.id) {
      throw new AppError('Note not found', 404);
    }

    const updatedNote = await prisma.playerNote.update({
      where: { id },
      data: { content, type },
      include: {
        session: {
          select: {
            id: true,
            date: true,
            title: true,
            type: true,
          },
        },
      },
    });

    res.json(updatedNote);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    // Verify note belongs to a player of this coach
    const note = await prisma.playerNote.findUnique({
      where: { id },
      include: { player: true },
    });

    if (!note || note.player.coachId !== coach.id) {
      throw new AppError('Note not found', 404);
    }

    await prisma.playerNote.delete({ where: { id } });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
