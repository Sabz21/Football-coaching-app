import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireCoach } from '../../common/middleware/auth';
import { Match } from '@prisma/client';

const router = Router();

// Helper to get coach from user
async function getCoach(userId: string) {
  return prisma.coach.findUnique({ where: { userId } });
}

// Get all teams for coach
router.get('/', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const teams = await prisma.team.findMany({
      where: { coachId: coach.id },
      include: {
        _count: {
          select: {
            players: true,
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

// Get single team with stats
router.get('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const team = await prisma.team.findFirst({
      where: { id, coachId: coach.id },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        matches: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            players: true,
            matches: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Calculate stats
    const completedMatches = team.matches.filter((m: Match) => m.status === 'COMPLETED');
    const wins = completedMatches.filter((m: Match) => (m.goalsFor || 0) > (m.goalsAgainst || 0)).length;
    const draws = completedMatches.filter((m: Match) => m.goalsFor === m.goalsAgainst).length;
    const losses = completedMatches.filter((m: Match) => (m.goalsFor || 0) < (m.goalsAgainst || 0)).length;
    const goalsFor = completedMatches.reduce((sum: number, m: Match) => sum + (m.goalsFor || 0), 0);
    const goalsAgainst = completedMatches.reduce((sum: number, m: Match) => sum + (m.goalsAgainst || 0), 0);

    res.json({
      ...team,
      stats: {
        played: completedMatches.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create team
router.post('/', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const { name, category, season, formation } = req.body;

    const team = await prisma.team.create({
      data: {
        name,
        category,
        season,
        formation,
        coachId: coach.id,
      },
    });

    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
});

// Update team
router.put('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const { name, category, season, formation } = req.body;

    const existingTeam = await prisma.team.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = await prisma.team.update({
      where: { id },
      data: { name, category, season, formation },
    });

    res.json(team);
  } catch (error) {
    next(error);
  }
});

// Add players to team
router.post('/:id/players', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const { playerIds } = req.body;

    const team = await prisma.team.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
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
        },
        update: {},
      });
    }

    const updatedTeam = await prisma.team.findUnique({
      where: { id },
      include: {
        players: {
          include: { player: true },
        },
      },
    });

    res.json(updatedTeam);
  } catch (error) {
    next(error);
  }
});

// Remove player from team
router.delete('/:id/players/:playerId', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, playerId } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const team = await prisma.team.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await prisma.teamPlayer.delete({
      where: {
        teamId_playerId: { teamId: id, playerId },
      },
    });

    res.json({ message: 'Player removed from team' });
  } catch (error) {
    next(error);
  }
});

// Delete team
router.delete('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const team = await prisma.team.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await prisma.team.delete({ where: { id } });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
