import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireCoach } from '../../common/middleware/auth';
import { AppError } from '../../common/middleware/error';

const router = Router();

router.use(authenticate);
router.use(requireCoach);

// GET /api/teams - Get all teams for coach
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const teams = await prisma.team.findMany({
      where: { coachId: coach.id, isActive: true },
      include: {
        _count: {
          select: {
            players: { where: { isActive: true } },
            matches: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(teams);
  } catch (error) {
    next(error);
  }
});

// GET /api/teams/:id - Get single team with players
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const team = await prisma.team.findFirst({
      where: { id, coachId: coach.id },
      include: {
        players: {
          where: { isActive: true },
          include: {
            player: {
              include: {
                _count: {
                  select: {
                    matchStats: true,
                    manOfTheMatch: true,
                  },
                },
              },
            },
          },
          orderBy: { player: { firstName: 'asc' } },
        },
        matches: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Calculate team stats
    const stats = await prisma.match.aggregate({
      where: { teamId: id, status: 'COMPLETED' },
      _count: true,
      _sum: {
        goalsFor: true,
        goalsAgainst: true,
      },
    });

    const completedMatches = await prisma.match.findMany({
      where: { teamId: id, status: 'COMPLETED' },
      select: { goalsFor: true, goalsAgainst: true },
    });

    const wins = completedMatches.filter(m => (m.goalsFor || 0) > (m.goalsAgainst || 0)).length;
    const draws = completedMatches.filter(m => m.goalsFor === m.goalsAgainst).length;
    const losses = completedMatches.filter(m => (m.goalsFor || 0) < (m.goalsAgainst || 0)).length;

    res.json({
      ...team,
      stats: {
        played: stats._count,
        wins,
        draws,
        losses,
        goalsFor: stats._sum.goalsFor || 0,
        goalsAgainst: stats._sum.goalsAgainst || 0,
        goalDifference: (stats._sum.goalsFor || 0) - (stats._sum.goalsAgainst || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/teams - Create team
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const { name, category, season, logo, formation } = req.body;

    if (!name) {
      throw new AppError('Team name is required', 400);
    }

    const team = await prisma.team.create({
      data: {
        coachId: coach.id,
        name,
        category,
        season,
        logo,
        formation,
      },
    });

    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
});

// PUT /api/teams/:id - Update team
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const existingTeam = await prisma.team.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingTeam) {
      throw new AppError('Team not found', 404);
    }

    const { name, category, season, logo, formation } = req.body;

    const team = await prisma.team.update({
      where: { id },
      data: { name, category, season, logo, formation },
    });

    res.json(team);
  } catch (error) {
    next(error);
  }
});

// POST /api/teams/:id/players - Add players to team
router.post('/:id/players', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { playerIds, positions = {} } = req.body;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const team = await prisma.team.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Add players
    for (const playerId of playerIds) {
      await prisma.teamPlayer.upsert({
        where: {
          teamId_playerId: { teamId: id, playerId },
        },
        create: {
          teamId: id,
          playerId,
          position: positions[playerId],
          isActive: true,
        },
        update: {
          isActive: true,
          position: positions[playerId],
        },
      });
    }

    res.json({ message: 'Players added successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:id/players/:playerId - Remove player from team
router.delete('/:id/players/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, playerId } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const team = await prisma.team.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    await prisma.teamPlayer.updateMany({
      where: { teamId: id, playerId },
      data: { isActive: false, leftAt: new Date() },
    });

    res.json({ message: 'Player removed from team' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:id - Soft delete team
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!coach) {
      throw new AppError('Coach profile not found', 404);
    }

    const team = await prisma.team.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    await prisma.team.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
