import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireCoach } from '../../common/middleware/auth';

const router = Router();

// Helper to get coach from user
async function getCoach(userId: string) {
  return prisma.coach.findUnique({ where: { userId } });
}

// Get all players for coach
router.get('/', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const players = await prisma.player.findMany({
      where: { coachId: coach.id },
      include: {
        _count: {
          select: {
            sessions: true,
            notes: true,
            manOfTheMatch: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    res.json(players);
  } catch (error) {
    next(error);
  }
});

// Get single player
router.get('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const player = await prisma.player.findFirst({
      where: { id, coachId: coach.id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            session: {
              select: { id: true, title: true, date: true },
            },
          },
        },
        sessions: {
          include: {
            session: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        teamMemberships: {
          include: {
            team: true,
          },
        },
        matchStats: {
          include: {
            match: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            sessions: true,
            notes: true,
            manOfTheMatch: true,
          },
        },
      },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(player);
  } catch (error) {
    next(error);
  }
});

// Create player
router.post('/', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      position,
      preferredFoot,
      height,
      weight,
      jerseyNumber,
      parentName,
      parentEmail,
      parentPhone,
    } = req.body;

    const player = await prisma.player.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        position,
        preferredFoot,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
        parentName,
        parentEmail,
        parentPhone,
        coachId: coach.id,
      },
    });

    res.status(201).json(player);
  } catch (error) {
    next(error);
  }
});

// Update player
router.put('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      position,
      preferredFoot,
      height,
      weight,
      jerseyNumber,
      parentName,
      parentEmail,
      parentPhone,
    } = req.body;

    const existingPlayer = await prisma.player.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = await prisma.player.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        position,
        preferredFoot,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
        parentName,
        parentEmail,
        parentPhone,
      },
    });

    res.json(player);
  } catch (error) {
    next(error);
  }
});

// Delete player
router.delete('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const existingPlayer = await prisma.player.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await prisma.player.delete({ where: { id } });

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
