import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireCoach } from '../../common/middleware/auth';
import { AppError } from '../../common/middleware/error';

const router = Router();

router.use(authenticate);
router.use(requireCoach);

// GET /api/players - Get all players for coach
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const players = await prisma.player.findMany({
      where: { coachId: coach.id, isActive: true },
      include: {
        _count: {
          select: {
            notes: true,
            sessions: true,
            teamMemberships: true,
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

// GET /api/players/:id - Get single player
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const player = await prisma.player.findFirst({
      where: { id, coachId: coach.id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            session: {
              select: { id: true, date: true, title: true },
            },
          },
        },
        sessions: {
          include: {
            session: true,
          },
          orderBy: { session: { date: 'desc' } },
          take: 10,
        },
        teamMemberships: {
          where: { isActive: true },
          include: {
            team: true,
          },
        },
        matchStats: {
          orderBy: { match: { date: 'desc' } },
          take: 10,
          include: {
            match: {
              select: { id: true, date: true, opponent: true, goalsFor: true, goalsAgainst: true },
            },
          },
        },
        _count: {
          select: {
            notes: true,
            sessions: true,
            manOfTheMatch: true,
          },
        },
      },
    });

    if (!player) {
      throw new AppError('Player not found', 404);
    }

    res.json(player);
  } catch (error) {
    next(error);
  }
});

// POST /api/players - Create player
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

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

    if (!firstName || !lastName) {
      throw new AppError('First name and last name are required', 400);
    }

    const player = await prisma.player.create({
      data: {
        coachId: coach.id,
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

    res.status(201).json(player);
  } catch (error) {
    next(error);
  }
});

// PUT /api/players/:id - Update player
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const existingPlayer = await prisma.player.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingPlayer) {
      throw new AppError('Player not found', 404);
    }

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
      avatar,
    } = req.body;

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
        avatar,
      },
    });

    res.json(player);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/players/:id - Soft delete player
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const player = await prisma.player.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!player) {
      throw new AppError('Player not found', 404);
    }

    await prisma.player.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
