import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireCoach } from '../../common/middleware/auth';

const router = Router();

// Helper to get coach from user
async function getCoach(userId: string) {
  return prisma.coach.findUnique({ where: { userId } });
}

// Get notes for a player
router.get('/player/:playerId', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { playerId } = req.params;
    const { type } = req.query;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    // Verify player belongs to coach
    const player = await prisma.player.findFirst({
      where: { id: playerId, coachId: coach.id },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const where: any = { playerId };
    if (type) {
      where.type = type;
    }

    const notes = await prisma.playerNote.findMany({
      where,
      include: {
        session: {
          select: { id: true, title: true, date: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notes);
  } catch (error) {
    next(error);
  }
});

// Create note
router.post('/', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { playerId, content, type, sessionId } = req.body;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    // Verify player belongs to coach
    const player = await prisma.player.findFirst({
      where: { id: playerId, coachId: coach.id },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const note = await prisma.playerNote.create({
      data: {
        playerId,
        content,
        type: type || 'GENERAL',
        sessionId: sessionId || null,
      },
      include: {
        session: {
          select: { id: true, title: true, date: true },
        },
      },
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// Update note
router.put('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content, type } = req.body;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    // Verify note belongs to coach's player
    const existingNote = await prisma.playerNote.findFirst({
      where: { id },
      include: { player: true },
    });

    if (!existingNote || existingNote.player.coachId !== coach.id) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = await prisma.playerNote.update({
      where: { id },
      data: { content, type },
    });

    res.json(note);
  } catch (error) {
    next(error);
  }
});

// Delete note
router.delete('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    // Verify note belongs to coach's player
    const existingNote = await prisma.playerNote.findFirst({
      where: { id },
      include: { player: true },
    });

    if (!existingNote || existingNote.player.coachId !== coach.id) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await prisma.playerNote.delete({ where: { id } });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
