import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireCoach } from '../../common/middleware/auth';

const router = Router();

// Helper to get coach from user
async function getCoach(userId: string) {
  return prisma.coach.findUnique({ where: { userId } });
}

// Get all matches for coach
router.get('/', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const { from, to, teamId } = req.query;

    const where: any = { coachId: coach.id };

    if (teamId) {
      where.teamId = teamId;
    }

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        team: true,
        manOfTheMatch: true,
        playerStats: {
          include: { player: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(matches);
  } catch (error) {
    next(error);
  }
});

// Get single match
router.get('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const match = await prisma.match.findFirst({
      where: { id, coachId: coach.id },
      include: {
        team: {
          include: {
            players: {
              include: { player: true },
            },
          },
        },
        manOfTheMatch: true,
        playerStats: {
          include: { player: true },
        },
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// Create match
router.post('/', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const {
      teamId,
      opponent,
      date,
      time,
      location,
      isHome,
      competition,
      competitionRound,
      preMatchNotes,
    } = req.body;

    // Verify team belongs to coach
    const team = await prisma.team.findFirst({
      where: { id: teamId, coachId: coach.id },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const match = await prisma.match.create({
      data: {
        opponent,
        date: new Date(date),
        time,
        location,
        isHome: isHome ?? true,
        competition,
        competitionRound,
        preMatchNotes,
        coachId: coach.id,
        teamId,
      },
      include: {
        team: true,
      },
    });

    res.status(201).json(match);
  } catch (error) {
    next(error);
  }
});

// Update match
router.put('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const {
      opponent,
      date,
      time,
      location,
      isHome,
      competition,
      competitionRound,
      preMatchNotes,
    } = req.body;

    const existingMatch = await prisma.match.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = await prisma.match.update({
      where: { id },
      data: {
        opponent,
        date: date ? new Date(date) : undefined,
        time,
        location,
        isHome,
        competition,
        competitionRound,
        preMatchNotes,
      },
      include: {
        team: true,
      },
    });

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// Update match result
router.put('/:id/result', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const {
      goalsFor,
      goalsAgainst,
      manOfTheMatchId,
      postMatchNotes,
      playerStats,
    } = req.body;

    const existingMatch = await prisma.match.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update match
    await prisma.match.update({
      where: { id },
      data: {
        goalsFor,
        goalsAgainst,
        manOfTheMatchId: manOfTheMatchId || null,
        postMatchNotes,
        status: 'COMPLETED',
      },
    });

    // Update player stats
    if (playerStats && Array.isArray(playerStats)) {
      for (const stat of playerStats) {
        await prisma.matchPlayerStats.upsert({
          where: {
            matchId_playerId: { matchId: id, playerId: stat.playerId },
          },
          create: {
            matchId: id,
            playerId: stat.playerId,
            minutesPlayed: stat.minutesPlayed || 0,
            isStarter: stat.isStarter || false,
            goals: stat.goals || 0,
            assists: stat.assists || 0,
            yellowCards: stat.yellowCards || 0,
            redCards: stat.redCards || 0,
            rating: stat.rating,
          },
          update: {
            minutesPlayed: stat.minutesPlayed,
            isStarter: stat.isStarter,
            goals: stat.goals,
            assists: stat.assists,
            yellowCards: stat.yellowCards,
            redCards: stat.redCards,
            rating: stat.rating,
          },
        });
      }
    }

    const updatedMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        team: true,
        manOfTheMatch: true,
        playerStats: {
          include: { player: true },
        },
      },
    });

    res.json(updatedMatch);
  } catch (error) {
    next(error);
  }
});

// Update lineup
router.put('/:id/lineup', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const { formation, starters } = req.body;

    const existingMatch = await prisma.match.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update formation
    await prisma.match.update({
      where: { id },
      data: { formation },
    });

    // Set starters
    if (starters && Array.isArray(starters)) {
      for (const playerId of starters) {
        await prisma.matchPlayerStats.upsert({
          where: {
            matchId_playerId: { matchId: id, playerId },
          },
          create: {
            matchId: id,
            playerId,
            isStarter: true,
          },
          update: {
            isStarter: true,
          },
        });
      }
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        team: true,
        playerStats: {
          include: { player: true },
        },
      },
    });

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// Get player career stats
router.get('/stats/player/:playerId', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { playerId } = req.params;

    const aggregate = await prisma.matchPlayerStats.aggregate({
      where: { playerId },
      _sum: {
        minutesPlayed: true,
        goals: true,
        assists: true,
        yellowCards: true,
        redCards: true,
      },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    res.json({
      appearances: aggregate._count,
      minutesPlayed: aggregate._sum?.minutesPlayed || 0,
      goals: aggregate._sum?.goals || 0,
      assists: aggregate._sum?.assists || 0,
      yellowCards: aggregate._sum?.yellowCards || 0,
      redCards: aggregate._sum?.redCards || 0,
      avgRating: aggregate._avg?.rating ? Number(aggregate._avg.rating).toFixed(1) : null,
    });
  } catch (error) {
    next(error);
  }
});

// Delete match
router.delete('/:id', authenticate, requireCoach, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coach = await getCoach(req.user!.userId);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    const match = await prisma.match.findFirst({
      where: { id, coachId: coach.id },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await prisma.match.delete({ where: { id } });

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
